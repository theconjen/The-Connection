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

/**
 * Global error handler for uncaught errors
 * This prevents the app from crashing and logs errors for debugging
 */
const setupGlobalErrorHandler = () => {
  try {
    // Check if ErrorUtils is available (it should be in React Native)
    if (typeof ErrorUtils === 'undefined') {
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
        // Don't propagate fatal errors from updates - they're not worth crashing for
        if (isFatal) {
          return;
        }
      }

      // For non-updates errors, use the original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  } catch (error) {
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
      return;
    }


    // Add event listeners for updates. The installed `expo-updates`
    // package may not expose the same TypeScript members across
    // versions, so cast to `any` and compare the event.type string
    // values directly.
    try {
      const addListener = (Updates as any).addListener;
      if (typeof addListener === 'function') {
        addListener((event: any) => {

          // Use string comparisons to avoid depending on exported enums
          const t = event?.type;
          if (t === 'error') {
            // Don't crash - just log
          } else if (t === 'noUpdateAvailable') {
          } else if (t === 'updateAvailable') {
          }
        });
      } else {
      }
    } catch (err) {
    }

  } catch (error) {
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


    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Update check timed out')), 10000);
    });

    const checkPromise = Updates.checkForUpdateAsync();

    const result = await Promise.race([checkPromise, timeoutPromise]);

    if (result.isAvailable) {
      return true;
    }

    return false;
  } catch (error) {
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


    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Update fetch timed out')), 30000);
    });

    const fetchPromise = Updates.fetchUpdateAsync();

    const result = await Promise.race([fetchPromise, timeoutPromise]);

    if (result.isNew) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}
