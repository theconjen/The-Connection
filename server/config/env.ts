import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  SESSION_SECRET: z.string().min(1).optional(),
  USE_DB: z.coerce.boolean().default(false),
  DATABASE_URL: z.string().url().optional(),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional().default(""),
  VERIFICATION_CLEANUP_INTERVAL_MS: z.coerce.number().int().positive().default(24 * 60 * 60 * 1000),
  VERIFICATION_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  APP_DOMAIN: z.string().min(1).default("theconnection.app"),
  AWS_SES_FROM_EMAIL: z.string().email().optional(),
});

// Normalize environment: some `.env` loaders can set keys to empty
// strings which causes Zod to treat them as present but invalid.
// Remove empty-string values so `optional()` and `default()` work.
const sanitizedEnv: Record<string, string | undefined> = { ...process.env };
for (const k of Object.keys(sanitizedEnv)) {
  if (sanitizedEnv[k] === "") {
    delete sanitizedEnv[k];
  }
}

const parsedEnv = envSchema.parse(sanitizedEnv as Record<string, unknown>);

if (parsedEnv.USE_DB && !parsedEnv.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required when USE_DB=true");
}

if (parsedEnv.NODE_ENV === "production" && !parsedEnv.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

const isProduction = parsedEnv.NODE_ENV === "production";
const isSecureCookie = isProduction && parsedEnv.COOKIE_SECURE !== "false";
const corsAllowedOrigins = parsedEnv.CORS_ALLOWED_ORIGINS.split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const envConfig = {
  nodeEnv: parsedEnv.NODE_ENV,
  isProduction,
  port: parsedEnv.PORT,
  sessionSecret: parsedEnv.SESSION_SECRET,
  useDb: parsedEnv.USE_DB,
  databaseUrl: parsedEnv.DATABASE_URL,
  isSecureCookie,
  corsAllowedOrigins,
  verification: {
    cleanupIntervalMs: parsedEnv.VERIFICATION_CLEANUP_INTERVAL_MS,
    retentionDays: parsedEnv.VERIFICATION_RETENTION_DAYS,
  },
  sentry: {
    dsn: parsedEnv.SENTRY_DSN,
    tracesSampleRate: parsedEnv.SENTRY_TRACES_SAMPLE_RATE,
  },
  appDomain: parsedEnv.APP_DOMAIN,
  emailFrom: parsedEnv.AWS_SES_FROM_EMAIL ?? `The Connection <noreply@${parsedEnv.APP_DOMAIN}>`,
};

export type EnvConfig = typeof envConfig;
