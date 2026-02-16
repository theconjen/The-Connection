import * as Sentry from "@sentry/node";
// import { nodeProfilingIntegration } from "@sentry/profiling-node"; // Optional: install @sentry/profiling-node

// Re-export the logger for structured logging
export const sentryLogger = Sentry.logger;

/**
 * Initialize Sentry for server-side error tracking
 *
 * Features:
 * - Error tracking and reporting
 * - Performance monitoring
 * - Structured logging
 * - Request tracking
 * - User context
 * - Release tracking
 * - Source maps support
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured - error tracking disabled');
    console.warn('   Set SENTRY_DSN in .env for production error tracking');
    return;
  }

  try {
    Sentry.init({
      dsn,

      // Environment configuration
      environment: process.env.NODE_ENV || "development",

      // Release tracking (use git commit hash or package.json version)
      release: process.env.SENTRY_RELEASE || process.env.RENDER_GIT_COMMIT || '1.0.0',

      // Performance monitoring
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

      // Profiling (Node.js 16+)
      profilesSampleRate: 0.1,

      // Integrations
      integrations: [
        // Capture console statements as Sentry logs
        Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
        // Enable profiling (requires @sentry/profiling-node)
        // Uncomment when @sentry/profiling-node is installed:
        // nodeProfilingIntegration(),
      ],

      // Enable structured logging
      _experiments: {
        enableLogs: true,
      },

      // Privacy settings
      sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === 'true',

      // Error filtering
      beforeSend(event, hint) {
        // Don't send errors in development unless explicitly enabled
        if (process.env.NODE_ENV === 'development' && process.env.SENTRY_DEBUG !== 'true') {
          return null;
        }

        // Filter out sensitive information
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }

          // Remove sensitive query params
          if (event.request.query_string) {
            event.request.query_string = event.request.query_string
              .replace(/password=[^&]*/gi, 'password=[FILTERED]')
              .replace(/token=[^&]*/gi, 'token=[FILTERED]')
              .replace(/api_key=[^&]*/gi, 'api_key=[FILTERED]');
          }
        }

        return event;
      },

      // Breadcrumbs configuration
      maxBreadcrumbs: 50,
    });

    console.info('✅ Sentry initialized successfully');
    console.info(`   Environment: ${process.env.NODE_ENV}`);
    console.info(`   Traces sample rate: ${process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'}`);
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: { id: number; username?: string; email?: string }) {
  Sentry.setUser({
    id: user.id.toString(),
    username: user.username,
    email: user.email,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add custom context to errors
 */
export function setSentryContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context);
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

export { Sentry };
