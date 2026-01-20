import "dotenv/config";
import express from "express";
import session from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { initializeEmailTemplates } from "./email";
import { runAllMigrations } from "./run-migrations";
import { setupVite, serveStatic, log } from "./vite.js";
import dotenv from "dotenv";
import { createServer } from "http";
import helmet from "helmet";
import lusca from "lusca";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { makeCors } from "./cors";

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const sameSite = (process.env.SESSION_SAMESITE as 'lax' | 'strict' | 'none' | undefined) ?? 'lax';
const secureCookie = sameSite === 'none' ? true : isProduction;

// Apply CORS configuration early so that preflight requests are handled correctly
app.use(makeCors());

// Add secure HTTP headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Add HSTS and Referrer Policy in production
if (isProduction) {
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
  app.use(helmet.referrerPolicy({ policy: 'no-referrer-when-downgrade' }));
}

// Apply a basic rate limiter to prevent brute-force and DDoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/health',
});
// Apply limiter only for /api and skip in test env
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/', limiter);
}

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // allow fewer attempts for auth routes
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

// Parse cookies before sessions (needed for CSRF tokens)
app.use(cookieParser());

// Limit JSON and form body sizes to mitigate DoS
// Increased to 10mb to support base64 image uploads (avatars, post images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Recursively escape '<' and '>' in strings from req.body, req.query and req.params to neutralise basic XSS
app.use((req, _res, next) => {
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        // @ts-ignore
        value[key] = sanitize(value[key]);
      }
    }
    return value;
  };
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});

if (isProduction) {
  app.set("trust proxy", 1);
}

// Enforce strong session secret in production
if (isProduction && !process.env.SESSION_SECRET) {
  console.error("FATAL ERROR: SESSION_SECRET environment variable is required in production");
  console.error("Please set a strong, random SESSION_SECRET in your environment variables");
  process.exit(1);
}

// Set up PostgreSQL session store
const PgSessionStore = connectPgSimple(session);
const sessionStore = new PgSessionStore({
  pool: pool as any,
  tableName: 'sessions',
  createTableIfMissing: true,
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "theconnection-session-secret",
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: secureCookie,
    httpOnly: true,
    sameSite,
    path: '/',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// CSRF protection for non-API routes
// Skip CSRF for: /api routes, JWT-authenticated requests (mobile apps), and safe methods
const csrfProtection = lusca.csrf();
app.use((req, res, next) => {
  // Skip CSRF for /api routes (check both path and url for different route mounting scenarios)
  if (req.path.startsWith('/api') || req.url.startsWith('/api')) return next();

  // Skip CSRF for mobile app requests (identified by custom header)
  if (req.headers['x-mobile-app'] === 'true' || req.headers['x-requested-with'] === 'com.theconnection.mobile') return next();

  // Skip CSRF for JWT-authenticated requests (mobile apps use Bearer tokens)
  if (req.headers.authorization?.startsWith('Bearer ')) return next();

  // Skip CSRF for safe HTTP methods (GET, HEAD, OPTIONS are idempotent)
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

  // Apply CSRF protection for all other requests (web forms, etc.)
  return csrfProtection(req, res, next);
});

// (global/api limiter handled above)

// Lusca protections (depends on cookie/session)
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Basic logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  // @ts-ignore
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    // @ts-ignore
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// Run async initialization but don't block export
(async () => {
  try {
    await runAllMigrations();
    const { runOrganizationMigrations } = await import("./run-migrations-organizations");
    await runOrganizationMigrations();
  } catch (error) {
    console.error("❌ Error running database migrations:", error);
  }

  try {
    await initializeEmailTemplates();
  } catch (error) {
    console.error("Error initializing email templates:", error);
  }
  // Register routes; some modules may import http server later (routes may require WebSocket setup)
  // registerRoutes returns a server when run in the original index, but here we'll register routes only
  // and allow the Vercel serverless adapter to handle the HTTP layer.
  try {
    await registerRoutes(app, createServer(app));
  } catch (err) {
    console.error('Error registering routes in server/app.ts', err);
  }
})();

export default app;
