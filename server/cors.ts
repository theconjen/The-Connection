import cors from "cors";

const DEV = process.env.NODE_ENV !== "production";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://<your-vercel-app>.vercel.app",
  "https://app.theconnection.app",
  "capacitor://localhost",
];

// Patterns for Vercel preview/production deployments
// Matches: the-connection-*.vercel.app or custom Vercel domains
// Allows dots in branch names (e.g., feature.branch-name-abc123.vercel.app)
const VERCEL_PATTERN = /^https:\/\/[a-z0-9.-]+\.vercel\.app$/i;

export function makeCors() {
  const allowlist = new Set<string | undefined>([undefined, ...DEFAULT_ALLOWED_ORIGINS]);
  const extraOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });
}
