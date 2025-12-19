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
import { initializeEmailTemplates } from "./email";
import { runAllMigrations } from "./run-migrations";
import { pool } from "./db";

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

  // Legacy compatibility handler for probes that still request /api.php
  app.get("/api.php", (_req: Request, res: Response) => {
    res.json({ ok: true, message: "The Connection API is available under /api" });
  });

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
      intervalMs: envConfig.verification.cleanupIntervalMs,
      retentionDays: envConfig.verification.retentionDays,
    });
  } catch (err) {
    console.warn('Failed to start verification cleanup scheduler:', err);
  }

  if (envConfig.sentry.dsn) {
    try {
      // Dynamic import can return a module namespace where the actual SDK
      // is on the `default` property (depending on ESM/CommonJS interop).
      const imported = await import("@sentry/node");
      const SentryModule = (imported as any).default ?? imported;

      SentryClient = SentryModule as typeof import("@sentry/node");

      // Build available integrations depending on the installed SDK shape.
      const integrations: any[] = [];
      try {
        if (typeof (SentryModule as any).getAutoPerformanceIntegrations === "function") {
          const auto = (SentryModule as any).getAutoPerformanceIntegrations();
          if (Array.isArray(auto)) integrations.push(...auto);
        }

        if (typeof (SentryModule as any).getDefaultIntegrations === "function") {
          const def = (SentryModule as any).getDefaultIntegrations?.();
          if (Array.isArray(def)) integrations.push(...def);
        }

        if (typeof (SentryModule as any).expressIntegration === "function") {
          try {
            integrations.push((SentryModule as any).expressIntegration());
          } catch (_) {
            // ignore integration construction errors
          }
        }

        if (typeof (SentryModule as any).httpIntegration === "function") {
          try {
            integrations.push((SentryModule as any).httpIntegration());
          } catch (_) {
            // ignore
          }
        }
      } catch (err) {
        console.warn("Error building Sentry integrations:", err);
      }

      SentryClient.init({
        dsn: envConfig.sentry.dsn,
        environment: envConfig.nodeEnv,
        tracesSampleRate: envConfig.sentry.tracesSampleRate,
        debug: envConfig.sentry.debug,
        // Respect explicit flag to send default PII (IP addresses, etc.)
        sendDefaultPii: envConfig.sentry.sendDefaultPii,
        integrations: integrations.length > 0 ? integrations : undefined,
      });

      console.log("Sentry integrations mounted:", integrations.map((i) => i?.name || i?.constructor?.name || "anonymous"));
      // The newer SDK build you're using exposes different exports
      // (see startup logs). It may not provide `Handlers` but does expose
      // an `expressErrorHandler` function we can mount later.
      SentryExpressErrorHandler = (SentryModule as any).expressErrorHandler ?? null;

      // Try to mount legacy-style handlers if present (older SDKs expose them)
      const handlers = (SentryClient as any).Handlers ?? (SentryClient as any).default?.Handlers;
      if (handlers && typeof handlers.requestHandler === "function") {
        app.use(handlers.requestHandler() as express.RequestHandler);
        const tracesRate = envConfig.sentry.tracesSampleRate;
        if (tracesRate > 0 && typeof handlers.tracingHandler === "function") {
          app.use(handlers.tracingHandler());
        }
      } else {
        // Informative log — we won't crash; the SDK still captures exceptions
        // via `captureException` calls below and `expressErrorHandler` may be
        // mounted if available.
        console.warn(
          "Sentry SDK loaded but `Handlers` not found. Skipping legacy request/tracing handlers."
        );
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
    console.log(`API listening on ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("❌ Fatal error during server bootstrap:", error);
  process.exit(1);
});
