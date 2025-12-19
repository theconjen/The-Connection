import * as Sentry from "@sentry/node";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (dsn) {
    Sentry.init({
      dsn,
      sendDefaultPii: true,
      environment: process.env.NODE_ENV || "development",
    } as any);
    console.log("✅ Sentry initialized");
  } else {
    console.log("⚠️ Sentry DSN not configured, skipping initialization");
  }
}

export { Sentry };
