/**
 * App Entry Point
 * Redirects to login or main app based on auth state
 */

import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { Colors } from '../src/shared/colors';
import { hasCompletedOnboarding } from '../src/shared/onboarding';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    hasCompletedOnboarding()
      .then((value) => setHasSeenOnboarding(value))
      .catch(() => setHasSeenOnboarding(false));
  }, []);

  // Show loading state while checking auth
  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/feed" />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}
