import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
// Seed imports removed for production
import { initializeEmailTemplates } from "./email";
import { runAllMigrations } from "./run-migrations";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { User } from "@shared/schema";
import { APP_DOMAIN, BASE_URL } from "./config/domain";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";

// Load environment variables from .env file
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Set up PostgreSQL session store
const PgSessionStore = connectPgSimple(session);
const sessionStore = new PgSessionStore({
  pool: pool,
  tableName: 'sessions',
  createTableIfMissing: true
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "theconnection-session-secret",
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Explicit session name
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: false, // Disable secure for development
    httpOnly: true,
    sameSite: 'lax' // Allow cross-origin requests in development
  }
}));

// Initialize passport with proper serialization
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as User).id);
});
passport.deserializeUser(async (id: number, done) => {
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

(async () => {
  // Run migrations for locality and interest features
  // try {
  //   await runAllMigrations();
    
  //   // Run organization migrations
  //   const { runOrganizationMigrations } = await import("./run-migrations-organizations");
  //   await runOrganizationMigrations();
    
  //   console.log("✅ Database migrations completed");
  // } catch (error) {
  //   console.error("❌ Error running database migrations:", error);
  // }

  // Production mode: No seed data needed
  console.log("Database migrations temporarily disabled for development");
  
  // Initialize email templates
  try {
    await initializeEmailTemplates();
  } catch (error) {
    console.error("Error initializing email templates:", error);
    // Continue with server startup even if email template initialization fails
  }
  
  const server = await registerRoutes(app, httpServer);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
