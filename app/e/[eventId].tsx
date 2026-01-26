/**
 * Deep Link Route: /e/:eventId
 *
 * Handles deep links to events from share URLs.
 * Redirects to the events detail page.
 */

import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';

export default function EventDeepLink() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't navigate until auth is loaded
    if (authLoading) {
      return;
    }

    // Only navigate once
    if (hasNavigated) {
      return;
    }

    // Validate eventId
    if (!eventId) {
      setError('Invalid event link');
      return;
    }

    // Validate eventId is a number
    const parsedId = parseInt(eventId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      setError('Invalid event ID');
      return;
    }

    // Navigate to event detail
    setHasNavigated(true);

    // Use setTimeout to ensure navigation happens after render cycle
    setTimeout(() => {
      router.replace(`/events/${eventId}` as any);
    }, 100);
  }, [eventId, router, authLoading, hasNavigated]);

  // Show error state
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/events')}
          style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Go to Events</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.textMuted, marginTop: 16, fontSize: 14 }}>Loading event...</Text>
    </View>
  );
}
