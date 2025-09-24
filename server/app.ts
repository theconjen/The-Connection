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

dotenv.config();

const app = express();

// Set up PostgreSQL session store
const PgSessionStore = connectPgSimple(session);
const sessionStore = new PgSessionStore({
  pool: pool,
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
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    console.log("✅ Database migrations completed");
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
