import cors from 'cors';

const DEV = process.env.NODE_ENV !== 'production';

// In dev, reflect and allow the requesting origin (useful for Expo tunnel/LAN and Vite).
// In production, use a strict allowlist provided via environment variable.
export function makeCors() {
  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow curl / same-origin
      if (DEV) return cb(null, true); // allow any origin in dev
      const allowed = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
}
