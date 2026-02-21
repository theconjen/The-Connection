import cors from "cors";
import { envConfig } from "./config/env";

const DEV = !envConfig.isProduction;

const DEFAULT_ALLOWED_ORIGINS = [
  // Production domains
  "https://theconnection.app",
  "https://www.theconnection.app",
  "https://app.theconnection.app",
  "https://api.theconnection.app",

  // Mobile app
  "capacitor://localhost",

  // Development
  "http://localhost:5173",
  "http://localhost:5000",
  "http://localhost:3000",
];

// Patterns for Vercel preview/production deployments
// Only matches: the-connection*.vercel.app (project-specific deployments)
const VERCEL_PATTERN = /^https:\/\/the-connection[a-z0-9-]*\.vercel\.app$/i;

export function makeCors() {
  const allowlist = new Set<string | undefined>([undefined, ...DEFAULT_ALLOWED_ORIGINS]);
  const extraOrigins = envConfig.corsAllowedOrigins;

  for (const origin of extraOrigins) {
    allowlist.add(origin);
  }

  return cors({
    origin: (origin, cb) => {
      if (DEV) return cb(null, true);

      if (origin && VERCEL_PATTERN.test(origin)) {
        return cb(null, true);
      }

      return cb(null, allowlist.has(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  });
}
