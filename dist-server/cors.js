import cors from "cors";
const DEV = process.env.NODE_ENV !== "production";
const BUILT_IN_ALLOWED = [
  "capacitor://localhost",
  "https://app.theconnection.app"
];
function makeCors() {
  const allowlist = new Set(BUILT_IN_ALLOWED);
  const extraOrigins = (process.env.CORS_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const origin of extraOrigins) {
    allowlist.add(origin);
  }
  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (DEV) return cb(null, true);
      cb(null, allowlist.has(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
  });
}
export {
  makeCors
};
