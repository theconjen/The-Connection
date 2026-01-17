/**
 * Create Community Screen
 * Placeholder for community creation
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { AppHeader } from '../../src/screens/AppHeader';

export default function CreateCommunityScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader
        title="Create a Community"
        showBack
        onBackPress={() => router.back()}
      />
      <View style={[styles.content, { padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Create a Community
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Build a space around a topic
        </Text>
        <Text style={[styles.placeholder, { color: colors.textMuted, marginTop: spacing.xl }]}>
          Community creation UI coming soon...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Figtree_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Figtree_400Regular',
  },
  placeholder: {
    fontSize: 14,
    fontFamily: 'Figtree_400Regular',
    textAlign: 'center',
  },
});
