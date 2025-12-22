/**
 * Updates Setup Module
 *
 * This module provides defensive error handling for expo-updates to prevent
 * crashes during update cleanup operations (UpdatesReaper, UpdatesDatabase).
 *
 * The issue: expo-updates native module can crash during asset cleanup if:
 * - SQLite database is locked or corrupted
 * - Concurrent access to the updates database
 * - File system errors during cleanup
 * - ErrorRecovery triggers intentional crash via StartupProcedure.throwException
 *
 * Solution: Configure updates to be less aggressive and handle errors gracefully.
 */

import * as Updates from 'expo-updates';
import { captureError, captureMessage } from './errorReporting';

const logDebug = (...args: unknown[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};

const logWarn = (...args: unknown[]) => {
  if (__DEV__) {
    console.warn(...args);
  }
};

const logError = (...args: unknown[]) => {
  if (__DEV__) {
    console.error(...args);
  }
};

/**
 * Global error handler for uncaught errors
 * This prevents the app from crashing and logs errors for debugging
 */
const setupGlobalErrorHandler = () => {
  try {
    // Check if ErrorUtils is available (it should be in React Native)
    if (typeof ErrorUtils === 'undefined') {
      logWarn('[Updates] ErrorUtils not available, skipping global error handler setup');
      return;
    }

    // Store the original error handler
    const originalHandler = ErrorUtils.getGlobalHandler();

    // Set up custom error handler
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // Check if this is an updates-related error
      const isUpdatesError =
        error?.message?.includes('expo-updates') ||
        error?.message?.includes('UpdatesReaper') ||
        error?.message?.includes('UpdatesDatabase') ||
        error?.message?.includes('ErrorRecovery') ||
        error?.message?.includes('StartupProcedure') ||
        error?.stack?.includes('expo-updates');

      if (isUpdatesError) {
        logError('[Updates] Caught updates error:', {
          message: error.message,
          stack: error.stack,
          isFatal,
        });

        captureError(error, {
          scope: 'expo-updates',
          isFatal,
        });

        // Don't propagate fatal errors from updates - they're not worth crashing for
        if (isFatal) {
          logWarn('[Updates] Suppressed fatal updates error to prevent crash');
          captureMessage('Suppressed fatal expo-updates error to prevent crash', {
            scope: 'expo-updates',
          });
          return;
        }
      }

      // For non-updates errors, use the original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  } catch (error) {
    logError('[Updates] Error setting up global error handler:', error);
    captureError(error, { scope: 'expo-updates' });
    // Don't throw - continue without global error handler
  }
};

/**
 * Set up updates with defensive error handling
 */
export async function setupUpdates(): Promise<void> {
  try {
    // Set up global error handler first
    setupGlobalErrorHandler();

    // Only run in production builds
    if (__DEV__) {
      logDebug('[Updates] Running in development mode, skipping updates setup');
      return;
    }

    logDebug('[Updates] Setting up updates module...');

    // Add event listeners for updates. The installed `expo-updates`
    // package may not expose the same TypeScript members across
    // versions, so cast to `any` and compare the event.type string
    // values directly.
    try {
      const addListener = (Updates as any).addListener;
      if (typeof addListener === 'function') {
        addListener((event: any) => {
          logDebug('[Updates] Event:', event);

          // Use string comparisons to avoid depending on exported enums
          const t = event?.type;
          if (t === 'error') {
            logError('[Updates] Update error:', event.message);
            captureError(event, { scope: 'expo-updates' });
          } else if (t === 'noUpdateAvailable') {
            logDebug('[Updates] No updates available');
          } else if (t === 'updateAvailable') {
            logDebug('[Updates] Update available');
          }
        });
      } else {
        logWarn('[Updates] updates.addListener not available on this runtime');
      }
    } catch (err) {
      logWarn('[Updates] Failed to attach update listener:', err);
      captureError(err, { scope: 'expo-updates' });
    }

    logDebug('[Updates] Updates module configured successfully');
  } catch (error) {
    logError('[Updates] Error setting up updates:', error);
    captureError(error, { scope: 'expo-updates' });
    // Don't throw - just log and continue
    // Better to run without updates than to crash
  }
}

/**
 * Check for updates safely without crashing
 */
export async function checkForUpdatesSafely(): Promise<boolean> {
  try {
    if (__DEV__) {
      return false;
    }

    logDebug('[Updates] Checking for updates...');

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Update check timed out')), 10000);
    });

    const checkPromise = Updates.checkForUpdateAsync();

    const result = await Promise.race([checkPromise, timeoutPromise]);

    if (result.isAvailable) {
      logDebug('[Updates] Update available');
      return true;
    }

    logDebug('[Updates] No update available');
    return false;
  } catch (error) {
    logError('[Updates] Error checking for updates:', error);
    captureError(error, { scope: 'expo-updates' });
    return false;
  }
}

/**
 * Fetch updates safely without crashing
 */
export async function fetchUpdateSafely(): Promise<boolean> {
  try {
    if (__DEV__) {
      return false;
    }

    logDebug('[Updates] Fetching update...');

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Update fetch timed out')), 30000);
    });

    const fetchPromise = Updates.fetchUpdateAsync();

    const result = await Promise.race([fetchPromise, timeoutPromise]);

    if (result.isNew) {
      logDebug('[Updates] New update fetched successfully');
      return true;
    }

    logDebug('[Updates] No new update fetched');
    return false;
  } catch (error) {
    logError('[Updates] Error fetching update:', error);
    captureError(error, { scope: 'expo-updates' });
    return false;
  }
}
