import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { setupUpdates, checkForUpdatesSafely, fetchUpdateSafely } from './setupUpdates';

interface UpdatesErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * UpdatesErrorBoundary - Handles expo-updates errors gracefully
 *
 * This component prevents the app from crashing during update operations
 * by catching errors in the updates reaper/cleanup process.
 *
 * Key features:
 * - Catches errors during update cleanup
 * - Prevents ErrorRecovery crashes
 * - Falls back to cached version on errors
 * - Provides user-friendly error messaging
 */
export function UpdatesErrorBoundary({ children }: UpdatesErrorBoundaryProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeUpdates() {
      try {
        // Set up global error handlers and listeners
        await setupUpdates();

        // Only check for updates if we're in a release build
        if (__DEV__) {
          setIsReady(true);
          return;
        }

        console.info('[Updates] Initializing updates...');

        // Use safe update checking with timeout
        const updateCheckTimeout = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.info('[Updates] Update check timed out, continuing with current version');
            resolve();
          }, 5000);
        });

        const updateCheck = (async () => {
          try {
            const isAvailable = await checkForUpdatesSafely();
            if (isAvailable) {
              console.info('[Updates] Update available, fetching...');
              const fetched = await fetchUpdateSafely();
              if (fetched) {
                console.info('[Updates] Update fetched successfully');
              }
            } else {
              console.info('[Updates] No updates available');
            }
          } catch (err) {
            console.error('[Updates] Error during update check:', err);
            // Don't throw - just log and continue
          }
        })();

        // Race between update check and timeout
        await Promise.race([updateCheck, updateCheckTimeout]);

        setIsReady(true);
      } catch (err) {
        console.error('[Updates] Fatal error during setup:', err);
        // Even if there's an error, set ready so app can continue
        // Better to run with potentially stale code than crash
        setError('Update check failed, running with cached version');
        setIsReady(true);
      }
    }

    initializeUpdates();
  }, []);

  // Show loading state while checking for updates
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show error if one occurred (but still render children)
  if (error) {
    console.warn('[Updates]', error);
    // Don't block the UI - just log the error
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});
