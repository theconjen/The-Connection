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
import { setupVite, serveStatic, log } from "./vite";
import { initializeEmailTemplates } from "./email";
import { runAllMigrations } from "./run-migrations";
import { pool } from "./db";

// Hold a module-level reference to the Sentry SDK when initialized so
// we can mount handlers (tracing + error handler) in other places below.
let SentryClient: typeof import("@sentry/node") | null = null;

async function bootstrap() {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  const httpServer = createServer(app);
  (app as any).listen = httpServer.listen.bind(httpServer);

  if (isProduction && !process.env.SESSION_SECRET) {
    console.error("FATAL ERROR: SESSION_SECRET environment variable is required in production");
    console.error("Please set a strong, random SESSION_SECRET in your environment variables");
    process.exit(1);
  }

  app.use(makeCors());

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

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health' || req.path === '/api/health',
  });
  app.use(limiter);

  app.use(cookieParser());

  const useDb = process.env.USE_DB === "true";
  const isSecureCookie = isProduction && process.env.COOKIE_SECURE !== "false";
  const sameSiteMode: "lax" | "none" = isSecureCookie ? "none" : "lax";

  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET ?? "theconnection-session-secret-dev-only",
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
    });
  }

  app.use(session(sessionOptions));

  const csrfProtection = lusca.csrf();
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

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

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
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
      console.log("✅ Database migrations completed");
    } else {
      console.log("⚠️ Skipping database migrations because USE_DB != 'true'");
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
      intervalMs: Number(process.env.VERIFICATION_CLEANUP_INTERVAL_MS ?? 24 * 60 * 60 * 1000),
      retentionDays: Number(process.env.VERIFICATION_RETENTION_DAYS ?? 30),
    });
  } catch (err) {
    console.warn('Failed to start verification cleanup scheduler:', err);
  }

  if (process.env.SENTRY_DSN) {
    try {
      SentryClient = await import("@sentry/node");
      SentryClient.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "production",
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.0),
      });

      // Request handler should be the first middleware for Sentry to capture request data
      app.use(SentryClient.Handlers.requestHandler() as express.RequestHandler);

      // Optionally mount the tracing handler when tracesSampleRate is enabled
      const tracesRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0);
      if (tracesRate > 0) {
        app.use(SentryClient.Handlers.tracingHandler());
      }
    } catch (error) {
      console.warn("Sentry failed to initialize:", error);
      SentryClient = null;
    }
  }

  const server = await registerRoutes(app, httpServer);

  // If Sentry was initialized above, register its error handler before our
  // custom error middleware so it can capture exceptions and send them to Sentry.
  if (SentryClient) {
    app.use(SentryClient.Handlers.errorHandler() as express.ErrorRequestHandler);
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

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("❌ Fatal error during server bootstrap:", error);
  process.exit(1);
});
