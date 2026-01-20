import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { CreateMenuProvider } from '../src/contexts/CreateMenuContext';
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_500Medium, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';
import { Text, TextInput, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { initializeNotifications, cleanupNotifications, unregisterPushToken, getCurrentToken } from '../src/services/notificationService';
import { isConfigValid } from '../src/lib/config';
import { ConfigErrorScreen } from '../src/components/ConfigErrorScreen';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// Global font configuration - Apply Playfair Display to ALL text
if (Platform.OS !== 'web') {
  // Override Text component default props
  const textRender = Text.render;
  const textInputRender = TextInput.render;

  Text.render = function (props, ref) {
    return textRender.call(this, {
      ...props,
      style: [{ fontFamily: 'PlayfairDisplay_500Medium' }, props.style],
    }, ref);
  };

  TextInput.render = function (props, ref) {
    return textInputRender.call(this, {
      ...props,
      style: [{ fontFamily: 'PlayfairDisplay_500Medium' }, props.style],
    }, ref);
  };
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const notificationListeners = useRef<{
    receivedListener: Notifications.Subscription | null;
    responseListener: Notifications.Subscription | null;
  } | null>(null);

  // Handle authentication routing
  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (user && inAuthGroup) {
      router.replace('/(tabs)/feed');
    } else if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, segments]);

  // Initialize notifications when user is authenticated
  useEffect(() => {
    let isMounted = true;

    async function setupNotifications() {
      if (!user || isLoading) {
        // Clean up if user logs out
        if (notificationListeners.current) {
          cleanupNotifications(
            notificationListeners.current.receivedListener,
            notificationListeners.current.responseListener
          );
          notificationListeners.current = null;
        }

        // Unregister token on logout
        if (!user) {
          const currentToken = await getCurrentToken();
          if (currentToken) {
            await unregisterPushToken(currentToken);
          }
        }
        return;
      }

      // Initialize notifications for authenticated user
      if (isMounted) {
        const listeners = await initializeNotifications(true);
        if (listeners) {
          notificationListeners.current = listeners;
        }
      }
    }

    setupNotifications();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (notificationListeners.current) {
        cleanupNotifications(
          notificationListeners.current.receivedListener,
          notificationListeners.current.responseListener
        );
      }
    };
  }, [user, isLoading]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // PRODUCTION HARDENING: Block app startup if critical config is missing
  // In production builds, this shows an error screen instead of crashing
  if (!isConfigValid()) {
    return <ConfigErrorScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CreateMenuProvider>
            <RootLayoutNav />
          </CreateMenuProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
