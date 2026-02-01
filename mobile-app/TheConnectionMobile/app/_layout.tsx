import React from 'react';
import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/contexts/AuthContext';

// Prefer DSN from app config extra, fall back to env var
const dsn = (Constants?.manifest as any)?.extra?.SENTRY_DSN || process.env.SENTRY_DSN || '';

Sentry.init({
  dsn: dsn || undefined,
  enableInExpoDevelopment: false,
  debug: __DEV__,
  tracesSampleRate: 0.05,
});

// Create a query client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <Slot />
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
