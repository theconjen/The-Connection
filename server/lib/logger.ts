/**
 * Production-safe logger utility with Sentry structured logging
 *
 * In development: logs to console
 * In production: sends structured logs to Sentry
 *
 * Sentry structured logs provide:
 * - Searchable log entries in Sentry dashboard
 * - Log levels (trace, debug, info, warn, error, fatal)
 * - Parameter interpolation for structured data
 * - Correlation with errors and transactions
 */

import * as Sentry from '@sentry/node';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Format message with data for structured logging
 * Converts: ('User action', { userId: 123 }) -> 'User action | userId=123'
 */
function formatMessage(message: string, data?: Record<string, any>): string {
  if (!data || Object.keys(data).length === 0) {
    return message;
  }

  const dataStr = Object.entries(data)
    .map(([key, value]) => {
      // Stringify objects/arrays for readability
      const formattedValue = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
      return `${key}=${formattedValue}`;
    })
    .join(', ');

  return `${message} | ${dataStr}`;
}

/**
 * Structured logger that sends logs to Sentry in production
 *
 * Usage:
 *   logger.info('User logged in', { userId: 123, method: 'email' });
 *   logger.error('Failed to fetch data', error, { endpoint: '/api/users' });
 *   logger.warn('Deprecated API used', { api: 'v1/posts' });
 */
export const logger = {
  /**
   * Trace level - most verbose, for detailed debugging
   */
  trace: (message: string, data?: Record<string, any>) => {
    if (isDev) {
      console.debug('[TRACE]', message, data || '');
    } else {
      Sentry.logger.trace(formatMessage(message, data));
    }
  },

  /**
   * Debug level - development debugging info
   */
  debug: (message: string, data?: Record<string, any>) => {
    if (isDev) {
      console.debug('[DEBUG]', message, data || '');
    } else {
      Sentry.logger.debug(formatMessage(message, data));
    }
  },

  /**
   * Log level - general logging (alias for info)
   */
  log: (message: string, data?: Record<string, any>) => {
    if (isDev) {
      console.info(message, data || '');
    } else {
      Sentry.logger.info(formatMessage(message, data));
    }
  },

  /**
   * Info level - important application events
   */
  info: (message: string, data?: Record<string, any>) => {
    if (isDev) {
      console.info('[INFO]', message, data || '');
    } else {
      Sentry.logger.info(formatMessage(message, data));
    }
  },

  /**
   * Warn level - potential issues that don't break functionality
   */
  warn: (message: string, data?: Record<string, any>) => {
    if (isDev) {
      console.warn('[WARN]', message, data || '');
    } else {
      Sentry.logger.warn(formatMessage(message, data));
    }
  },

  /**
   * Error level - errors that need attention
   * Optionally accepts an Error object for stack traces
   */
  error: (message: string, error?: Error | any, data?: Record<string, any>) => {
    if (isDev) {
      console.error('[ERROR]', message, error || '', data || '');
    } else {
      // Send structured log
      Sentry.logger.error(formatMessage(message, data));

      // Also capture the exception for error tracking
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: { message, ...data },
        });
      } else if (error) {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: { error, ...data },
        });
      }
    }
  },

  /**
   * Fatal level - critical errors that may crash the app
   */
  fatal: (message: string, error?: Error | any, data?: Record<string, any>) => {
    if (isDev) {
      console.error('[FATAL]', message, error || '', data || '');
    } else {
      // Send structured log
      Sentry.logger.fatal(formatMessage(message, data));

      // Capture the exception
      if (error instanceof Error) {
        Sentry.captureException(error, {
          level: 'fatal',
          extra: { message, ...data },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'fatal',
          extra: { error, ...data },
        });
      }
    }
  },

  /**
   * Flush logs to Sentry (useful before process exits)
   */
  flush: async (timeout = 2000) => {
    if (!isDev) {
      await Sentry.flush(timeout);
    }
  },
};

export default logger;
