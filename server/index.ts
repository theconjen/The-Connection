// IMPORTANT: Load dotenv FIRST before any other imports
import "dotenv/config";

import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import lusca from "lusca";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { makeCors } from "./cors";
import { envConfig } from "./config/env";
import { setupVite, serveStatic, log } from "./vite";
import { initSentry, Sentry as SentryLib } from './lib/sentry';
import { initializeEmailTemplates } from "./email";
import { runAllMigrations } from "./run-migrations";
import { pool } from "./db";
import { startEventReminderScheduler } from "./services/eventReminderService";
import compression from "compression";

// Hold a module-level reference to the Sentry SDK when initialized so
// we can mount handlers (tracing + error handler) in other places below.
let SentryClient: typeof import("@sentry/node") | null = null;
// If the installed SDK exposes an express-specific error handler function
// (e.g. `expressErrorHandler`) store it here so we can mount it later.
let SentryExpressErrorHandler: ((...args: any[]) => any) | null = null;

async function bootstrap() {
  const app = express();
  const isProduction = envConfig.isProduction;

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  const httpServer = createServer(app);
  (app as any).listen = httpServer.listen.bind(httpServer);

  app.use(makeCors());

  // Only apply strict CSP in production - Safari has issues with upgrade-insecure-requests in dev
  if (isProduction) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://fonts.googleapis.com",
              "https://cdnjs.cloudflare.com"
            ],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https:", "wss:"],
            fontSrc: [
              "'self'",
              "data:",
              "https://fonts.gstatic.com",
              "https://cdnjs.cloudflare.com"
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
      })
    );
  } else {
    // Minimal security headers in development - no CSP that breaks Safari
    app.use(
      helmet({
        contentSecurityPolicy: false,
        hsts: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
      })
    );
  }

  // Rate limiting - only in production
  if (isProduction) {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health' || req.path === '/api/health',
    });
    app.use(limiter);
  }

  app.use(cookieParser());

  // Enable gzip/brotli compression to reduce memory usage for large responses
  // Only compress responses > 1KB to avoid overhead for small responses
  app.use(compression({
    level: 6, // Balanced compression (1-9, higher = more CPU, less memory)
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress if client doesn't accept it
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }));

  const useDb = envConfig.useDb;
  const isSecureCookie = envConfig.isSecureCookie;
  const sameSiteMode: "lax" | "none" = isSecureCookie ? "none" : "lax";

  const sessionOptions: session.SessionOptions = {
    secret: envConfig.sessionSecret ?? "theconnection-session-secret-dev-only",
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
    cookie: {
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000, // ~10 years - Instagram-style indefinite session
      secure: isSecureCookie,
      httpOnly: true,
      sameSite: sameSiteMode,
      path: "/",
    },
  };

  if (useDb) {
    const PgSessionStore = connectPgSimple(session);
    sessionOptions.store = new PgSessionStore({
      pool: pool as any,
      tableName: "sessions",
      createTableIfMissing: true,
      // Memory optimization: Prune expired sessions every 15 minutes
      pruneSessionInterval: 15 * 60, // seconds
      // Disable session padding to save memory
      disableTouch: false,
    });
  }

  app.use(session(sessionOptions));

  // CSRF protection for non-API routes
  // Skip CSRF for: /api routes, JWT-authenticated requests (mobile apps), and safe methods
  const csrfProtection = lusca.csrf();
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Use originalUrl which contains the full path regardless of route mounting
    const fullPath = req.originalUrl || req.url || req.path;

    // Skip CSRF for all /api routes (REST API uses session cookies, not CSRF tokens)
    if (fullPath.startsWith('/api')) {
      return next();
    }

    // Skip CSRF for mobile app requests (identified by custom header)
    if (req.headers['x-mobile-app'] === 'true' || req.headers['x-requested-with'] === 'com.theconnection.mobile') {
      return next();
    }

    // Skip CSRF for JWT-authenticated requests (mobile apps use Bearer tokens)
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return next();
    }

    // Skip CSRF for safe HTTP methods (GET, HEAD, OPTIONS are idempotent)
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    // Apply CSRF protection for all other requests (web forms, etc.)
    return csrfProtection(req, res, next);
  });

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    try {
      const uid = (user as any)?.id ?? user;
      done(null, uid);
    } catch (error) {
      done(null, user as any);
    }
  });

  passport.deserializeUser(async (id: number, done) => {
    if (!useDb) {
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

  // Set body size limit for image uploads (profile pictures, post images)
  // Matches Instagram's ~8MB image limit for good quality without excessive bandwidth
  // Save raw body for Stripe webhook signature verification
  app.use(express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      if (req.originalUrl?.startsWith('/api/stripe/webhook')) {
        req.rawBody = buf;
      }
    },
  }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));

  // Legacy compatibility handler for probes that still request /api.php
  app.get("/api.php", (_req: Request, res: Response) => {
    res.json({ ok: true, message: "The Connection API is available under /api" });
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Memory stats endpoint for monitoring (admin-only in production)
  app.get("/api/memory-stats", (req: Request, res: Response) => {
    const memUsage = process.memoryUsage();
    res.json({
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + "MB",
      rss: Math.round(memUsage.rss / 1024 / 1024) + "MB",
      external: Math.round(memUsage.external / 1024 / 1024) + "MB",
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) + "MB",
    });
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    let capturedJsonResponse: unknown;

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown, ...args: unknown[]) => {
      capturedJsonResponse = body;
      return originalJson(body as any, ...args);
    }) as typeof res.json;

    res.on("finish", () => {
      if (!req.path.startsWith("/api")) {
        return;
      }

      const duration = Date.now() - start;
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = `${logLine.slice(0, 79)}…`;
      }

      log(logLine);
    });

    next();
  });

  try {
    if (useDb) {
      await runAllMigrations();
      const { runOrganizationMigrations } = await import("./run-migrations-organizations");
      await runOrganizationMigrations();
    } else {
    }
  } catch (error) {
    console.error("❌ Error running database migrations:", error);
  }

  try {
    await initializeEmailTemplates();
  } catch (error) {
    console.error("Error initializing email templates:", error);
  }

  // Start verification cleanup scheduler (safe no-op if DB not configured)
  try {
    const { startVerificationCleanup } = await import('./lib/verificationCleanup');
    startVerificationCleanup({
      intervalMs: envConfig.verification.cleanupIntervalMs,
      retentionDays: envConfig.verification.retentionDays,
    });
  } catch (err) {
    console.warn('Failed to start verification cleanup scheduler:', err);
  }

  try {
    // Initialize Sentry using the simplified wrapper.
    initSentry();
    SentryClient = SentryLib as typeof import("@sentry/node");
  } catch (error) {
    console.warn("Sentry failed to initialize:", error);
    SentryClient = null;
  }

  const server = await registerRoutes(app, httpServer);

  // If Sentry was initialized above, register its error handler before our
  // custom error middleware so it can capture exceptions and send them to Sentry.
  if (SentryClient) {
    const errHandlers = (SentryClient as any).Handlers ?? (SentryClient as any).default?.Handlers;
    if (errHandlers && typeof errHandlers.errorHandler === "function") {
      app.use(errHandlers.errorHandler() as express.ErrorRequestHandler);
    } else if (SentryExpressErrorHandler && typeof SentryExpressErrorHandler === "function") {
      // Some SDK builds provide `expressErrorHandler` as a top-level helper
      // — use it when the legacy `Handlers.errorHandler` API is not present.
      app.use(SentryExpressErrorHandler() as express.ErrorRequestHandler);
    } else {
      console.warn("Sentry initialized but errorHandler not found; skipping Sentry error middleware.");
    }
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Ensure Sentry also receives this exception (captureException is safe
    // to call even if Sentry wasn't initialized because we guard above).
    try {
      if (SentryClient) {
        // The imported Sentry module types don't expose captureException on the
        // namespace type in a way TypeScript understands here, so use a safe any
        // cast — this is fine for runtime usage and avoids type errors.
        (SentryClient as any).captureException?.(err);
      }
    } catch (_) {
      // ignore capture errors
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // Do not rethrow here — we've already responded and Sentry has the event
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = envConfig.port;
  app.listen(port, "0.0.0.0", () => {
    console.info(`✅ Server listening on http://0.0.0.0:${port}`);

    // Start event reminder scheduler (checks every hour for events in next 24 hours)
    startEventReminderScheduler();
    console.info('✅ Event reminder scheduler started');
  });
}

bootstrap().catch((error) => {
  console.error("❌ Fatal error during server bootstrap:", error);
  process.exit(1);
});
