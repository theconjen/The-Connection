/**
 * Production-safe logger utility
 * Only logs in development mode (__DEV__)
 * In production, errors are sent to Sentry
 */

import * as Sentry from '@sentry/react-native';

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  error: (message: string, error?: any) => {
    if (isDev) {
      console.error(message, error);
    } else {
      // In production, send to Sentry
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: { message },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: { error },
        });
      }
    }
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};

export default logger;
