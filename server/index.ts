import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { makeCors } from "./cors";
import cookieParser from 'cookie-parser';
import { setupVite, serveStatic, log } from "./vite";
import lusca from "lusca";
import helmet from "helmet";
// Seed imports removed for production
import { initializeEmailTemplates } from "./email";
import { runAllMigrations } from "./run-migrations";
import session from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { User } from "@shared/schema";
import { APP_DOMAIN, BASE_URL } from "./config/domain";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import rateLimit from 'express-rate-limit';
import type { EventEmitter } from "events";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}
const httpServer = createServer(app);
(app as any).listen = httpServer.listen.bind(httpServer);

// SECURITY: Enforce SESSION_SECRET in production
if (isProduction && !process.env.SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET environment variable is required in production');
  console.error('Please set a strong, random SESSION_SECRET in your environment variables');
  process.exit(1);
}

// Session store: use Postgres-backed store only when USE_DB=true; otherwise
// fall back to the default in-memory store for a lightweight MVP run.
const USE_DB = process.env.USE_DB === 'true';
const isSecureCookie = isProduction && process.env.COOKIE_SECURE !== 'false';
const sameSiteMode = isSecureCookie ? 'none' : 'lax';

let sessionOptions: any = {
  secret: process.env.SESSION_SECRET || "theconnection-session-secret-dev-only",
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Explicit session name
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (reduced from 30 for security)
    secure: isSecureCookie,
    httpOnly: true,
    sameSite: sameSiteMode,
    path: '/',
  }
};

if (USE_DB) {
  // Set up PostgreSQL session store
  const PgSessionStore = connectPgSimple(session);
  const sessionStore = new PgSessionStore({
    pool: pool as any,
    tableName: 'sessions',
    createTableIfMissing: true
  });

  sessionOptions.store = sessionStore;
}

// SECURITY: Add helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: unsafe-eval needed for dev mode
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility with external resources
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
}));

// parse cookies before sessions so session middleware can read cookies
app.use(cookieParser());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

app.use(session(sessionOptions));
app.use(lusca.csrf());

// Initialize passport with proper serialization
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user: Express.User, done) => {
  // If running without DB, store the whole user object in session (best-effort)
  try {
    const uid = (user as any).id ?? user;
    done(null, uid);
  } catch (e) {
    done(null, user as any);
  }
});

passport.deserializeUser(async (id: number, done) => {
  if (!USE_DB) {
    // In DB-less mode we can't look up users; return null so req.user won't be set.
    return done(null, null);
  }

  try {
    const { storage } = await import("./storage");
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use centralized, dev-friendly CORS middleware
const corsMiddleware = makeCors();
app.use(corsMiddleware);

// lightweight health endpoint for mobile/dev smoke tests
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get('/health', (_req: Request, res: Response) => {
  res.type('application/json').status(200).json({ status: 'ok' });
});

// Dev helper: create a test user and set session (ONLY in non-production)
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/_dev/create-login', async (req: Request, res: Response) => {
    try {
      const { username, email, password, displayName } = req.body ?? {};
      if (!username) return res.status(400).json({ message: 'username required' });

      const storageModule = await import('./storage');
      const storage = storageModule.storage as any;

      // Create user (storage implementations handle duplicates)
      const user = await storage.createUser({
        username,
        email: email || `${username}@example.com`,
        password: password || 'password',
        displayName: displayName || username,
      });

      // Attach to session
      if (!req.session) return res.status(500).json({ message: 'Session unavailable' });
      req.session.userId = user.id.toString();
      req.session.username = user.username;
      req.session.save((err) => {
        if (err) return res.status(500).json({ message: 'Failed to save session', err });
        const { password: _p, ...u } = user as any;
        return res.json({ ok: true, user: u });
      });
    } catch (error) {
      console.error('Dev create-login error:', error);
      res.status(500).json({ message: 'Error creating dev user', error: String(error) });
    }
  });
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  const nodeResponse = res as Response & NodeJS.EventEmitter & { statusCode: number };

  nodeResponse.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${nodeResponse.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run migrations for locality and interest features
  try {
    if (USE_DB) {
      await runAllMigrations();

      // Run organization migrations
      const { runOrganizationMigrations } = await import("./run-migrations-organizations");
      await runOrganizationMigrations();

      console.log("✅ Database migrations completed");
    } else {
      console.log("⚠️ Skipping database migrations because USE_DB != 'true'");
    }
  } catch (error) {
    console.error("❌ Error running database migrations:", error);
  }
  
  // Initialize email templates
  try {
    await initializeEmailTemplates();
  } catch (error) {
    console.error("Error initializing email templates:", error);
    // Continue with server startup even if email template initialization fails
  }
  
  const server = await registerRoutes(app, httpServer);

  // If SENTRY_DSN is provided, dynamically import Sentry and initialize it
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = await import("@sentry/node");
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "production",
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.0),
      });

      // Request handler should be the first middleware for Sentry
      app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
    } catch (err) {
      console.warn("Sentry failed to initialize:", err);
    }
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // Re-throw so Sentry error handler (if present) can capture
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Read port from environment (DigitalOcean App Platform sets $PORT)
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on ${port}`);
  });
})();
