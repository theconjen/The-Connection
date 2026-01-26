/**
 * Deep Link Route: /p/:postId
 *
 * Handles deep links to posts from share URLs.
 * Redirects to the full post detail page.
 */

import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function PostDeepLink() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (postId) {
      // Redirect to the full post detail page
      router.replace(`/posts/${postId}`);
    }
  }, [postId, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
