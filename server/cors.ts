import cors from "cors";

const DEV = process.env.NODE_ENV !== "production";

const BUILT_IN_ALLOWED = [
  "capacitor://localhost",
  "https://app.theconnection.app",
];

// Patterns for Vercel preview/production deployments
// Matches: the-connection-*.vercel.app or custom Vercel domains
// Allows dots in branch names (e.g., feature.branch-name-abc123.vercel.app)
const VERCEL_PATTERN = /^https:\/\/[a-z0-9.-]+\.vercel\.app$/i;

export function makeCors() {
  const allowlist = new Set<string>(BUILT_IN_ALLOWED);
  const extraOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const origin of extraOrigins) {
    allowlist.add(origin);
  }

  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (DEV) return cb(null, true);
      
      // Check if origin is in the explicit allowlist
      if (allowlist.has(origin)) {
        return cb(null, true);
      }
      
      // Check if origin matches Vercel deployment pattern
      if (VERCEL_PATTERN.test(origin)) {
        return cb(null, true);
      }
      
      // Deny all other origins
      cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });
}
