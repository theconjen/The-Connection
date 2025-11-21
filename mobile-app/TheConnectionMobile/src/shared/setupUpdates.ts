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
      console.warn('[Updates] ErrorUtils not available, skipping global error handler setup');
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
        console.error('[Updates] Caught updates error:', {
          message: error.message,
          stack: error.stack,
          isFatal,
        });

        // Log to a monitoring service if available
        // TODO: Send to Sentry or other error tracking service

        // Don't propagate fatal errors from updates - they're not worth crashing for
        if (isFatal) {
          console.warn('[Updates] Suppressed fatal updates error to prevent crash');
          return;
        }
      }

      // For non-updates errors, use the original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  } catch (error) {
    console.error('[Updates] Error setting up global error handler:', error);
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
      console.log('[Updates] Running in development mode, skipping updates setup');
      return;
    }

    console.log('[Updates] Setting up updates module...');

    // Add event listeners for updates
    const eventListener = Updates.addListener((event) => {
      console.log('[Updates] Event:', event);

      if (event.type === Updates.UpdateEventType.ERROR) {
        console.error('[Updates] Update error:', event.message);
        // Don't crash - just log
      }

      if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
        console.log('[Updates] No updates available');
      }

      if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
        console.log('[Updates] Update available');
      }
    });

    console.log('[Updates] Updates module configured successfully');

    // Return cleanup function
    return () => {
      if (eventListener) {
        eventListener.remove();
      }
    };
  } catch (error) {
    console.error('[Updates] Error setting up updates:', error);
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

    console.log('[Updates] Checking for updates...');

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Update check timed out')), 10000);
    });

    const checkPromise = Updates.checkForUpdateAsync();

    const result = await Promise.race([checkPromise, timeoutPromise]);

    if (result.isAvailable) {
      console.log('[Updates] Update available');
      return true;
    }

    console.log('[Updates] No update available');
    return false;
  } catch (error) {
    console.error('[Updates] Error checking for updates:', error);
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

    console.log('[Updates] Fetching update...');

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Update fetch timed out')), 30000);
    });

    const fetchPromise = Updates.fetchUpdateAsync();

    const result = await Promise.race([fetchPromise, timeoutPromise]);

    if (result.isNew) {
      console.log('[Updates] New update fetched successfully');
      return true;
    }

    console.log('[Updates] No new update fetched');
    return false;
  } catch (error) {
    console.error('[Updates] Error fetching update:', error);
    return false;
  }
}
