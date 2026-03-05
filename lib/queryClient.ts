/**
 * React Query Client Configuration
 *
 * This file creates and exports the QueryClient instance
 * used throughout the app for data fetching and caching.
 */

import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

// Tell React Query to refetch when app comes back to foreground
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active');
  });
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 2 minutes
      staleTime: 2 * 60 * 1000,
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Refetch when app returns to foreground (via focusManager above)
      refetchOnWindowFocus: true,
      // Auto-refresh every 5 minutes in the background
      refetchInterval: 5 * 60 * 1000,
      // Always refetch when navigating to a new screen
      refetchOnMount: 'always',
      // Refetch when network reconnects
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

export default queryClient;
