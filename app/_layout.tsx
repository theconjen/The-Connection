import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { CreateMenuProvider } from '../src/contexts/CreateMenuContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Text, TextInput, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { initializeNotifications, cleanupNotifications, unregisterPushToken, getCurrentToken } from '../src/services/notificationService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// Global font configuration - Apply Figtree to ALL text
if (Platform.OS !== 'web') {
  // Override Text component default props
  const textRender = Text.render;
  const textInputRender = TextInput.render;

  Text.render = function (props, ref) {
    return textRender.call(this, {
      ...props,
      style: [{ fontFamily: 'Figtree-Regular' }, props.style],
    }, ref);
  };

  TextInput.render = function (props, ref) {
    return textInputRender.call(this, {
      ...props,
      style: [{ fontFamily: 'Figtree-Regular' }, props.style],
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
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!user) {
      // Not logged in - redirect to login (unless already on auth screens)
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // Logged in
      if (inAuthGroup) {
        // User is logged in but on auth screens (just registered/logged in)
        // Check if they need onboarding
        if (user.onboardingCompleted === false) {
          router.replace('/(onboarding)/welcome');
        } else {
          router.replace('/(tabs)/feed');
        }
      } else if (inOnboardingGroup && user.onboardingCompleted === true) {
        // User completed onboarding but still on onboarding screens - redirect to feed
        router.replace('/(tabs)/feed');
      }
      // If user is in tabs or other authenticated areas, let them be
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
    'Figtree-Regular': require('../assets/fonts/Figtree-Regular.ttf'),
    'Figtree-Medium': require('../assets/fonts/Figtree-Medium.ttf'),
    'Figtree-SemiBold': require('../assets/fonts/Figtree-SemiBold.ttf'),
    'Figtree-Bold': require('../assets/fonts/Figtree-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <CreateMenuProvider>
              <RootLayoutNav />
            </CreateMenuProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
