/**
 * WELCOME SCREEN - The Connection Onboarding
 * First screen after registration - introduces values and mission
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import apiClient from '../../src/lib/apiClient';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { refresh } = useAuth();
  const [isSkipping, setIsSkipping] = useState(false);

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      // Mark onboarding as completed
      await apiClient.post('/api/user/onboarding', {
        onboardingCompleted: true,
      });

      // Refresh user context to get updated onboardingCompleted status
      await refresh();

      // Navigate to feed
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Error', 'Failed to skip onboarding. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/Icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Welcome to The Connection
          </Text>
        </View>

        {/* Values Statement */}
        <View style={[styles.valuesCard, {
          backgroundColor: isDark ? '#1a2a4a' : '#f0f4f8',
          borderLeftColor: colors.primary
        }]}>
          <View style={styles.iconRow}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={[styles.valuesTitle, { color: colors.textPrimary }]}>
              Our Foundation
            </Text>
          </View>

          <Text style={[styles.valuesText, { color: colors.textPrimary }]}>
            <Text style={styles.bold}>The Connection exists because Jesus Christ is Lord.</Text>
            {'\n\n'}
            This platform is built on the conviction that He is not merely a teacher, a symbol,
            or an idea, but the risen Son of God, worthy of full allegiance.
            {'\n\n'}
            We hold <Text style={styles.bold}>the Bible as the authoritative Word of God</Text> and
            the final standard for truth, identity, and moral life.
            {'\n\n'}
            Our discussions, relationships, and decisions are shaped by Scripture, not by trends,
            personal preference, or cultural pressure.
            {'\n\n'}
            This community is for those who desire a faith that is serious, thoughtful, and lived
            out in real life. We pursue spiritual growth, honest conversation, personal responsibility,
            and obedience to Christ—not performative religion or shallow affirmation.
            {'\n\n'}
            <Text style={styles.italic}>It is a place to seek truth, be sharpened, and walk forward
            together in conviction and grace.</Text>
          </Text>
        </View>

        {/* What You'll Find Here */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            What You'll Find Here
          </Text>

          {[
            { icon: 'people', text: 'Communities centered on Scripture and spiritual growth' },
            { icon: 'chatbubbles', text: 'Honest conversations rooted in biblical truth' },
            { icon: 'heart', text: 'Prayer requests and support from believers' },
            { icon: 'book-outline', text: 'Apologetics resources for defending the faith' },
            { icon: 'calendar', text: 'Christian events and gatherings in your area' },
          ].map((item, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name={item.icon as any} size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(onboarding)/profile-setup')}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={styles.skipButton}
          disabled={isSkipping}
        >
          {isSkipping ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              Skip for now
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  valuesCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  valuesTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  valuesText: {
    fontSize: 15,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
  },
});
