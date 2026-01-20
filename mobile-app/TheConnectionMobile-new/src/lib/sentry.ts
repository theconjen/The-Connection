/**
 * Sentry Error Tracking for React Native Mobile App
 *
 * This module initializes Sentry for the React Native mobile application
 * Features:
 * - Error tracking
 * - Performance monitoring
 * - Native crash reporting
 * - React Native error boundaries integration
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Initialize Sentry for the mobile app
 * Call this as early as possible in your app initialization
 */
export function initSentry() {
  // Get DSN from environment (configured in app.json or .env)
  const dsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    if (__DEV__) {
      console.warn('[Sentry] DSN not configured - error tracking disabled');
    }
    return;
  }

  try {
    Sentry.init({
      dsn,

      // Environment
      environment: __DEV__ ? 'development' : 'production',

      // Release tracking
      release: Constants.expoConfig?.version || '1.0.0',

      // Distribution (build number)
      dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString(),

      // Performance Monitoring
      tracesSampleRate: __DEV__ ? 0.0 : 0.1, // Disabled in dev, 10% in production

      // Integrations
      integrations: [
        // React Native-specific integrations
        new Sentry.ReactNativeTracing({
          routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        }),
      ],

      // Privacy settings
      beforeSend(event, hint) {
        // Don't send errors in development
        if (__DEV__) {
          return null;
        }

        // Filter out sensitive information from URLs
        if (event.request?.url) {
          event.request.url = event.request.url
            .replace(/token=[^&]*/gi, 'token=[FILTERED]')
            .replace(/api_key=[^&]*/gi, 'api_key=[FILTERED]')
            .replace(/password=[^&]*/gi, 'password=[FILTERED]');
        }

        // Filter out common network errors
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as Error).message.toLowerCase();

          if (
            message.includes('network request failed') ||
            message.includes('timeout') ||
            message.includes('connection refused')
          ) {
            return null;
          }
        }

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        'Network request failed',
        'Request timeout',
        'Connection refused',
        'cancelled',
        'aborted',
      ],

      // Breadcrumbs
      maxBreadcrumbs: 100,

      // Enable native crash reporting
      enableNative: true,
      enableNativeCrashHandling: true,
      enableNativeNagger: false, // Don't show native debug prompt

      // Auto session tracking
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000, // 30 seconds
    });

    if (__DEV__) {
      console.info('[Sentry] Initialized successfully');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[Sentry] Failed to initialize:', error);
    }
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: {
  id: number;
  username?: string;
  email?: string;
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
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

/**
 * Wrap the root component with Sentry's error boundary
 * Usage: export default Sentry.wrap(App);
 */
export const wrap = Sentry.wrap;

export { Sentry };
