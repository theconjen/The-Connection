import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { CreateMenuProvider } from '../src/contexts/CreateMenuContext';
import { SocketProvider } from '../src/contexts/SocketContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Text, TextInput, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { initializeNotifications, cleanupNotifications, unregisterPushToken, getCurrentToken } from '../src/services/notificationService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import apiClient from '../src/lib/apiClient';
import { VideoSplash } from '../src/components/VideoSplash';
import { BirthdayCelebration } from '../src/components/BirthdayCelebration';
import { initSentry, setSentryUser, clearSentryUser } from '../src/lib/sentry';

// Initialize Sentry as early as possible
initSentry();

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 2 minutes by default
      staleTime: 2 * 60 * 1000,
      // Keep data in cache for 30 minutes even when unused
      gcTime: 30 * 60 * 1000,
      // Don't refetch on mount if data exists and is fresh
      refetchOnMount: 'always',
      // Don't refetch when window regains focus
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const notificationListeners = useRef<{
    receivedListener: Notifications.Subscription | null;
    responseListener: Notifications.Subscription | null;
  } | null>(null);

  // Prefetch events data when user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      // Prefetch events in background so they're ready when user navigates to events tab
      queryClient.prefetchQuery({
        queryKey: ["events", { view: "list", range: "week", mode: "all", distance: "all", q: "", city: "", userLocation: null }],
        queryFn: async () => {
          const res = await apiClient.get('/api/events?range=week&mode=all');
          return res.data?.events ?? res.data ?? [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  }, [user, isLoading, queryClient]);

  // Set/clear Sentry user context when auth state changes
  useEffect(() => {
    if (user) {
      setSentryUser({
        id: user.id,
        username: user.username,
        email: user.email,
      });
    } else {
      clearSentryUser();
    }
  }, [user]);

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
          router.replace('/(tabs)/home');
        }
      } else if (inOnboardingGroup && user.onboardingCompleted === true) {
        // User completed onboarding but still on onboarding screens - redirect to feed
        router.replace('/(tabs)/home');
      }
      // If user is in tabs or other authenticated areas, let them be
    }

    // Mark navigation as ready after first auth check
    setIsNavigationReady(true);
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

  // Don't render routes until we know the auth state
  // This prevents the login screen from flashing before redirect
  if (isLoading || !isNavigationReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EDE8DF' }}>
        <ThemedStatusBar />
      </View>
    );
  }

  return (
    <>
      <ThemedStatusBar />
      <Slot />
      <BirthdayCelebration />
    </>
  );
}

// Status bar that responds to theme
function ThemedStatusBar() {
  const { colorScheme } = useTheme();
  // Use dark content (dark icons) on light backgrounds
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Figtree-Regular': require('../assets/fonts/Figtree-Regular.ttf'),
    'Figtree-Medium': require('../assets/fonts/Figtree-Medium.ttf'),
    'Figtree-SemiBold': require('../assets/fonts/Figtree-SemiBold.ttf'),
    'Figtree-Bold': require('../assets/fonts/Figtree-Bold.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
  });

  // Track if video splash has finished
  const [showVideoSplash, setShowVideoSplash] = useState(true);

  // Hide native splash when fonts are loaded (video splash will still show)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const handleVideoSplashFinish = useCallback(() => {
    setShowVideoSplash(false);
  }, []);

  // Wait for fonts before showing anything
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Show video splash after native splash hides
  if (showVideoSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EDE8DF' }}>
        <VideoSplash onFinish={handleVideoSplashFinish} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <CreateMenuProvider>
                <RootLayoutNav />
              </CreateMenuProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
