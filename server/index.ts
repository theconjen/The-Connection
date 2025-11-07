import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { makeCors } from "./cors";
import cookieParser from 'cookie-parser';
import { setupVite, serveStatic, log } from "./vite";
import lusca from "lusca";
// Seed imports removed for production
import { initializeEmailTemplates } from "./email";
import { runAllMigrations } from "./run-migrations";
import session from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { createServer } from "http";
import rateLimit from 'express-rate-limit';

// Load .env only in development
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
}

async function bootstrap() {
  const app = express();
  app.set('trust proxy', 1); // needed for secure cookies behind Render proxy
  const httpServer = createServer(app);
  (app as any).listen = httpServer.listen.bind(httpServer);

  // Session store: use Postgres-backed store only when USE_DB=true; otherwise
  // fall back to the default in-memory store for a lightweight MVP run.
  const USE_DB = process.env.USE_DB === 'true';
  const isProd = process.env.NODE_ENV === 'production';
  let sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (isProd) {
      throw new Error('SESSION_SECRET is required in production');
    }

    sessionSecret = '372f79df29a1113a00d5bde03125eddc';
    console.warn('SESSION_SECRET not set; using development fallback. Set SESSION_SECRET to override.');
  }

  const sessionOptions: session.SessionOptions = {
  secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
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

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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
}

bootstrap().catch((error) => {
  console.error("❌ Fatal error during server bootstrap:", error);
  process.exit(1);
});
