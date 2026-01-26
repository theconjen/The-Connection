/**
 * Deep Link Route: /u/:username
 *
 * Handles deep links to user profiles from share URLs.
 * Fetches user ID by username and redirects to the user profile page.
 */

import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import apiClient from '../../src/lib/apiClient';

export default function ProfileDeepLink() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function lookupUser() {
      if (!username) return;

      try {
        // Try to get user by username
        const response = await apiClient.get(`/api/users/username/${username}`);
        const user = response.data;

        if (user && user.id) {
          // Redirect to the user profile page by ID
          router.replace(`/profile/${user.id}` as any);
        } else {
          setError('User not found');
        }
      } catch (err) {
        // If the username endpoint doesn't exist, try the public API
        try {
          const publicResponse = await apiClient.get(`/api/public/users/${username}`);
          const publicUser = publicResponse.data;

          if (publicUser && publicUser.id) {
            router.replace(`/profile/${publicUser.id}` as any);
          } else {
            setError('User not found');
          }
        } catch {
          setError('User not found');
        }
      }
    }

    lookupUser();
  }, [username, router]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
