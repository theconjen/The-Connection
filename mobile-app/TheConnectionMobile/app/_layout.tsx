import React from 'react';
import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prefer DSN from app config extra, fall back to env var
const dsn = (Constants?.manifest as any)?.extra?.SENTRY_DSN || process.env.SENTRY_DSN || '';

Sentry.init({
  dsn: dsn || undefined,
  enableInExpoDevelopment: false,
  debug: __DEV__,
  tracesSampleRate: 0.05,
});

export default function Layout() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}
