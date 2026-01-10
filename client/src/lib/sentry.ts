/**
 * Sentry Error Tracking for Web Client
 *
 * This module initializes Sentry for the React web application
 * Features:
 * - Error tracking
 * - Performance monitoring
 * - User session replay
 * - React error boundaries integration
 * - Source maps for better stack traces
 */

import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for the web client
 * Call this as early as possible in your app initialization
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured - error tracking disabled');
    console.warn('   Set VITE_SENTRY_DSN in .env for client-side error tracking');
    return;
  }

  try {
    Sentry.init({
      dsn,

      // Environment
      environment: import.meta.env.MODE,

      // Release tracking (should match server release)
      release: import.meta.env.VITE_SENTRY_RELEASE || '1.0.0',

      // Performance Monitoring
      tracesSampleRate: parseFloat(
        import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'
      ),

      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      integrations: [
        // Browser tracing for performance monitoring
        Sentry.browserTracingIntegration(),

        // Session replay
        Sentry.replayIntegration({
          maskAllText: true, // Mask all text for privacy
          blockAllMedia: true, // Block images/videos for privacy
        }),
      ],

      // Privacy settings
      beforeSend(event, hint) {
        // Don't send errors in development
        if (import.meta.env.MODE === 'development') {
          return null;
        }

        // Filter out sensitive information from URLs
        if (event.request?.url) {
          event.request.url = event.request.url
            .replace(/token=[^&]*/gi, 'token=[FILTERED]')
            .replace(/api_key=[^&]*/gi, 'api_key=[FILTERED]')
            .replace(/password=[^&]*/gi, 'password=[FILTERED]');
        }

        // Filter out common non-errors
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as Error).message.toLowerCase();

          // Ignore network errors that are expected
          if (
            message.includes('failed to fetch') ||
            message.includes('network request failed') ||
            message.includes('load failed')
          ) {
            return null;
          }
        }

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',

        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',

        // Third-party scripts
        'Script error.',
      ],

      // Ignore specific URLs
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,

        // Local files
        /^file:\/\//i,
      ],

      // Breadcrumbs
      maxBreadcrumbs: 50,
    });

    console.info('✅ Sentry (client) initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: {
  id: number;
  username?: string;
  email?: string
}) {
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
 * Manually capture an exception
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
 * Manually capture a message
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Create an error boundary component
 * Usage: Wrap your app or specific components
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * withProfiler HOC for performance monitoring of specific components
 * Usage: export default Sentry.withProfiler(MyComponent);
 */
export const withProfiler = Sentry.withProfiler;

export { Sentry };
