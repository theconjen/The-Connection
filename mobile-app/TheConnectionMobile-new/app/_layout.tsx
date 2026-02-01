import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { CreateMenuProvider } from '../src/contexts/CreateMenuContext';
import { SocketProvider } from '../src/contexts/SocketContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Text, TextInput, Platform, View, AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { initializeNotifications, cleanupNotifications, unregisterPushToken, getCurrentToken } from '../src/services/notificationService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { VideoSplash } from '../src/components/VideoSplash';
import { AttendanceConfirmationModal } from '../src/components/AttendanceConfirmationModal';
import { BirthdayCelebration } from '../src/components/BirthdayCelebration';
import { eventsAPI } from '../src/lib/apiClient';

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

  // Attendance confirmation state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<any>(null);
  const hasCheckedAttendance = useRef(false);

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

  // Check for pending attendance confirmations
  useEffect(() => {
    async function checkPendingConfirmations() {
      if (!user || isLoading || hasCheckedAttendance.current) {
        return;
      }

      try {
        const response = await eventsAPI.getPendingConfirmations();
        if (response?.events && response.events.length > 0) {
          // Show modal for the most recent event awaiting confirmation
          setPendingEvent(response.events[0]);
          setShowAttendanceModal(true);
        }
        hasCheckedAttendance.current = true;
      } catch (error) {
        console.error('[AttendanceCheck] Error checking pending confirmations:', error);
      }
    }

    // Check on initial load when user is authenticated
    if (user && !isLoading) {
      // Small delay to let the app settle after login
      const timer = setTimeout(checkPendingConfirmations, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

  // Re-check when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user && !showAttendanceModal) {
        try {
          const response = await eventsAPI.getPendingConfirmations();
          if (response?.events && response.events.length > 0) {
            setPendingEvent(response.events[0]);
            setShowAttendanceModal(true);
          }
        } catch (error) {
          // Silently fail on foreground check
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user, showAttendanceModal]);

  const handleAttendanceConfirmed = () => {
    // Check for more pending events
    eventsAPI.getPendingConfirmations().then(response => {
      if (response?.events && response.events.length > 0) {
        // Show next event
        setPendingEvent(response.events[0]);
        setShowAttendanceModal(true);
      }
    }).catch(() => {});
  };

  const handleCloseAttendanceModal = () => {
    setShowAttendanceModal(false);
    setPendingEvent(null);
  };

  return (
    <>
      <ThemedStatusBar />
      <Slot />
      <AttendanceConfirmationModal
        visible={showAttendanceModal}
        event={pendingEvent}
        onClose={handleCloseAttendanceModal}
        onConfirmed={handleAttendanceConfirmed}
      />
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
