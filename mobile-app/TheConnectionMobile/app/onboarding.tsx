import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../src/shared/colors';
import { useNotifications } from '../src/shared/NotificationProvider';
import { markOnboardingComplete } from '../src/shared/onboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const { requestPermission } = useNotifications();

  const completeOnboarding = useCallback(
    async (target: '/(auth)/login' | '/(auth)/register') => {
      await markOnboardingComplete();
      router.replace(target);
    },
    [router]
  );

  const enableNotifications = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.badge}>NATIVE EXPERIENCE</Text>
        <Text style={styles.title}>Welcome to The Connection</Text>
        <Text style={styles.subtitle}>
          Access the community, prayer wall, and events without ever opening a browser. Stay connected even when
          your connection drops.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stay informed</Text>
          <Text style={styles.cardBody}>
            Turn on push notifications so we can alert you about new messages, event reminders, and updates from your
            communities.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={enableNotifications}>
            <Text style={styles.secondaryButtonText}>Enable notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ready to dive in?</Text>
          <Text style={styles.cardBody}>
            Choose how you want to start. You can switch accounts anytime from settings.
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.outlineButton]} onPress={() => completeOnboarding('/(auth)/register')}>
              <Text style={[styles.actionText, styles.outlineText]}>Create account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => completeOnboarding('/(auth)/login')}>
              <Text style={styles.actionText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
    paddingTop: 72,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    color: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  cardBody: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    columnGap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  outlineText: {
    color: Colors.primary,
  },
});

