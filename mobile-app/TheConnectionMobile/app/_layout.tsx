import { Stack } from 'expo-router';
import { useAppFonts } from '../src/shared/useFonts';
import { ThemeProvider } from '../src/shared/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/contexts/AuthContext';
import { UpdatesErrorBoundary } from '../src/shared/UpdatesErrorBoundary';
import { RootErrorBoundary } from '../src/shared/RootErrorBoundary';
import { NotificationProvider } from '../src/shared/NotificationProvider';
import { OfflineNotice, OfflineProvider } from '../src/shared/OfflineProvider';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

const queryClient = new QueryClient();

export default function Root() {
  const [loaded, error] = useAppFonts();
  const [fontTimeout, setFontTimeout] = useState(false);

  // Add timeout for font loading - don't block app forever
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded) {
        console.warn('[Fonts] Font loading timed out after 10s, continuing anyway');
        setFontTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [loaded]);

  // If fonts are loading and haven't timed out, show loading indicator
  if (!loaded && !fontTimeout && !error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>Loading...</Text>
      </View>
    );
  }

  // Log warnings but continue if fonts failed
  if (error) {
    console.error('[Fonts] Error loading fonts:', error);
    console.warn('[Fonts] Continuing without custom fonts');
  }

  if (fontTimeout) {
    console.warn('[Fonts] Font loading timed out, using system fonts');
  }

  // Continue rendering app even if fonts failed or timed out
  return (
    <RootErrorBoundary>
      <UpdatesErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <ThemeProvider>
              <OfflineProvider>
                <QueryClientProvider client={queryClient}>
                  <OfflineNotice />
                  <Stack screenOptions={{ headerShown: false }} />
                </QueryClientProvider>
              </OfflineProvider>
            </ThemeProvider>
          </NotificationProvider>
        </AuthProvider>
      </UpdatesErrorBoundary>
    </RootErrorBoundary>
  );
}
