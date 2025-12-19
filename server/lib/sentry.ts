


import * as Sentry from '@sentry/node';

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      sendDefaultPii: true,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
      debug: !!process.env.SENTRY_DEBUG,
    });
    console.log('✅ Sentry initialized');
  } else {
    console.log('⚠️ Sentry DSN not configured, skipping initialization');
  }
}
export default {
export { Sentry };
  isAvailable,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  lastEventId,
};
