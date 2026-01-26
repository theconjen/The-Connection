/**
 * Deep Link Route: /a/:slugOrId
 *
 * Handles deep links to apologetics articles from share URLs.
 * Redirects to the full apologetics detail page.
 */

import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function ApologeticsDeepLink() {
  const { slugOrId } = useLocalSearchParams<{ slugOrId: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (slugOrId) {
      // Redirect to the full apologetics detail page
      router.replace(`/apologetics/${slugOrId}`);
    }
  }, [slugOrId, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
