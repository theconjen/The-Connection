import "dotenv/config";
import express from "express";
import session from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";
import { registerRoutes } from "./routes.js";
import { initializeEmailTemplates } from "./email.js";
import { runAllMigrations } from "./run-migrations.js";
import { log } from "./vite.js";
import dotenv from "dotenv";
import { createServer } from "http";
dotenv.config();
const app = express();
const PgSessionStore = connectPgSimple(session);
const sessionStore = new PgSessionStore({
  pool,
  tableName: "sessions",
  createTableIfMissing: true
});
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "theconnection-session-secret",
  resave: false,
  saveUninitialized: false,
  name: "sessionId",
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1e3,
    secure: false,
    httpOnly: true,
    sameSite: "lax"
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "\u2026";
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    await runAllMigrations();
    const { runOrganizationMigrations } = await import("./run-migrations-organizations.js");
    await runOrganizationMigrations();
    console.log("\u2705 Database migrations completed");
  } catch (error) {
    console.error("\u274C Error running database migrations:", error);
  }
  try {
    await initializeEmailTemplates();
  } catch (error) {
    console.error("Error initializing email templates:", error);
  }
  try {
    await registerRoutes(app, createServer(app));
  } catch (err) {
    console.error("Error registering routes in server/app.ts", err);
  }
})();
var app_default = app;
export {
  app_default as default
};
