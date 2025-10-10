import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes.js";
import cors from "cors";
import { setupVite, serveStatic, log } from "./vite.js";
import { initializeEmailTemplates } from "./email.js";
import { runAllMigrations } from "./run-migrations.js";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";
import { createServer } from "http";
dotenv.config();
const app = express();
const httpServer = createServer(app);
const USE_DB = process.env.USE_DB === "true";
let sessionOptions = {
  secret: process.env.SESSION_SECRET || "theconnection-session-secret",
  resave: false,
  saveUninitialized: false,
  name: "sessionId",
  // Explicit session name
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1e3,
    // 30 days
    secure: false,
    // Disable secure for development
    httpOnly: true,
    sameSite: "lax"
    // Allow cross-origin requests in development
  }
};
if (USE_DB) {
  const PgSessionStore = connectPgSimple(session);
  const sessionStore = new PgSessionStore({
    pool,
    tableName: "sessions",
    createTableIfMissing: true
  });
  sessionOptions.store = sessionStore;
}
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
  try {
    const uid = user.id ?? user;
    done(null, uid);
  } catch (e) {
    done(null, user);
  }
});
passport.deserializeUser(async (id, done) => {
  if (!USE_DB) {
    return done(null, null);
  }
  try {
    const { storage } = await import("./storage.js");
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost",
    "capacitor://localhost",
    process.env.BASE_URL || ""
  ].filter(Boolean),
  credentials: true
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
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
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    if (USE_DB) {
      await runAllMigrations();
      const { runOrganizationMigrations } = await import("./run-migrations-organizations.js");
      await runOrganizationMigrations();
      console.log("\u2705 Database migrations completed");
    } else {
      console.log("\u26A0\uFE0F Skipping database migrations because USE_DB != 'true'");
    }
  } catch (error) {
    console.error("\u274C Error running database migrations:", error);
  }
  try {
    await initializeEmailTemplates();
  } catch (error) {
    console.error("Error initializing email templates:", error);
  }
  const server = await registerRoutes(app, httpServer);
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = await import("@sentry/node");
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "production",
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0)
      });
      app.use(Sentry.Handlers.requestHandler());
    } catch (err) {
      console.warn("Sentry failed to initialize:", err);
    }
  }
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = Number(process.env.PORT) || 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
