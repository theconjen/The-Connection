/**
 * React Query Client Configuration
 *
 * This file creates and exports the QueryClient instance
 * used throughout the app for data fetching and caching.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // No automatic refetch on focus — prevents mid-scroll refreshes
      refetchOnWindowFocus: false,
      // Only refetch on screen mount if data is stale
      refetchOnMount: true,
      // Refetch when network reconnects after being offline
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default queryClient;
