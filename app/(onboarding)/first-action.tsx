/**
 * FIRST ACTION SCREEN - The Connection Onboarding
 * Step 4: Prompt user to introduce themselves or share a prayer request
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { communitiesAPI } from '../../src/lib/apiClient';
import apiClient from '../../src/lib/apiClient';
import * as SecureStore from 'expo-secure-store';

type ActionType = 'intro' | 'prayer' | null;

interface JoinedCommunity {
  id: number;
  name: string;
}

export default function FirstActionScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { user, refresh } = useAuth();

  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [content, setContent] = useState('');
  const [prayerTitle, setPrayerTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [joinedCommunities, setJoinedCommunities] = useState<JoinedCommunity[]>([]);

  useEffect(() => {
    loadJoinedCommunities();
    // Track onboarding step for analytics
    apiClient.post('/api/user/onboarding', { onboardingStep: 'first-action' }).catch(() => {});
  }, []);

  const loadJoinedCommunities = async () => {
    try {
      const stored = await SecureStore.getItemAsync('onboarding_joined_communities');
      if (stored) {
        setJoinedCommunities(JSON.parse(stored));
      }
    } catch {
      // No communities saved — skip buttons will still work
    }
  };

  const completeOnboarding = async () => {
    try {
      // Get saved onboarding data
      const profileData = await SecureStore.getItemAsync('onboarding_profile');
      const faithData = await SecureStore.getItemAsync('onboarding_faith');

      const profile = profileData ? JSON.parse(profileData) : {};
      const faith = faithData ? JSON.parse(faithData) : {};

      // Update user profile with all onboarding data
      await apiClient.patch('/api/user/profile', {
        displayName: profile.displayName,
        bio: profile.bio,
        location: profile.location,
        denomination: faith.denomination,
        homeChurch: faith.homeChurch,
        favoriteBibleVerse: faith.favoriteBibleVerse,
        interests: faith.interests || [],
        activities: faith.activities || [],
      });

      // Mark onboarding as completed
      await apiClient.post('/api/user/onboarding', {
        onboardingCompleted: true,
        onboardingStep: 'completed',
        interests: faith.interests || [],
      });

      // Refresh user context
      await refresh();

      // Clean up secure storage
      await SecureStore.deleteItemAsync('onboarding_profile');
      await SecureStore.deleteItemAsync('onboarding_faith');
      await SecureStore.deleteItemAsync('onboarding_joined_communities');
    } catch {
      // Non-critical — user can still proceed
    }
  };

  const handleSubmit = async () => {
    if (!selectedAction) return;

    const targetCommunity = joinedCommunities[0];
    if (!targetCommunity) {
      // No community joined — just complete onboarding
      await handleSkip();
      return;
    }

    if (selectedAction === 'intro' && content.trim().length < 5) {
      Alert.alert('Too short', 'Write at least a few words to introduce yourself.');
      return;
    }

    if (selectedAction === 'prayer') {
      if (!prayerTitle.trim()) {
        Alert.alert('Title needed', 'Give your prayer request a short title.');
        return;
      }
      if (content.trim().length < 5) {
        Alert.alert('Too short', 'Write at least a few words about your prayer request.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (selectedAction === 'intro') {
        // Post an introduction to the community wall
        await apiClient.post(`/api/communities/${targetCommunity.id}/wall`, {
          content: content.trim(),
        });
      } else if (selectedAction === 'prayer') {
        // Create a prayer request in the community
        await apiClient.post(`/api/communities/${targetCommunity.id}/prayer-requests`, {
          title: prayerTitle.trim(),
          content: content.trim(),
        });
      }

      await completeOnboarding();
      router.push('/(onboarding)/invite-friends');

      setTimeout(() => {
        Alert.alert(
          'Nice!',
          selectedAction === 'intro'
            ? `Your introduction has been posted to ${targetCommunity.name}.`
            : `Your prayer request has been shared with ${targetCommunity.name}.`
        );
      }, 500);
    } catch (error) {
      Alert.alert('Error', 'Failed to post. You can always do this later.');
      await completeOnboarding();
      router.push('/(onboarding)/invite-friends');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await completeOnboarding();
      router.push('/(onboarding)/invite-friends');
    } catch {
      router.push('/(onboarding)/invite-friends');
    } finally {
      setIsSkipping(false);
    }
  };

  const targetName = joinedCommunities[0]?.name || 'your community';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Your First Step
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '80%' }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step 4 of 5
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Make your first connection
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {joinedCommunities.length > 0
              ? `Start by sharing something with ${targetName}.`
              : 'Choose how you\'d like to get started.'}
          </Text>

          {/* Action Cards */}
          {!selectedAction && (
            <View style={styles.cardsContainer}>
              {/* Introduce Yourself Card */}
              <Pressable
                style={[styles.actionCard, {
                  backgroundColor: isDark ? '#1a2a4a' : '#fff',
                  borderColor: colors.borderSubtle,
                }]}
                onPress={() => setSelectedAction('intro')}
              >
                <View style={[styles.cardIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="hand-left" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Introduce yourself
                </Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  Say hello and let the community know a little about you
                </Text>
                <View style={[styles.cardArrow, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </Pressable>

              {/* Prayer Request Card */}
              <Pressable
                style={[styles.actionCard, {
                  backgroundColor: isDark ? '#1a2a4a' : '#fff',
                  borderColor: colors.borderSubtle,
                }]}
                onPress={() => setSelectedAction('prayer')}
              >
                <View style={[styles.cardIconContainer, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="heart" size={28} color="#8B5CF6" />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Share a prayer request
                </Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  Let your community lift you up in prayer
                </Text>
                <View style={[styles.cardArrow, { backgroundColor: '#8B5CF610' }]}>
                  <Ionicons name="arrow-forward" size={16} color="#8B5CF6" />
                </View>
              </Pressable>
            </View>
          )}

          {/* Input Form — shown after selecting an action */}
          {selectedAction && (
            <View style={styles.formContainer}>
              <Pressable
                onPress={() => { setSelectedAction(null); setContent(''); setPrayerTitle(''); }}
                style={styles.backToCards}
              >
                <Ionicons name="arrow-back" size={16} color={colors.primary} />
                <Text style={[styles.backToCardsText, { color: colors.primary }]}>
                  Choose a different action
                </Text>
              </Pressable>

              <View style={[styles.formCard, {
                backgroundColor: isDark ? '#1a2a4a' : '#fff',
                borderColor: colors.borderSubtle,
              }]}>
                <View style={styles.formHeader}>
                  <Ionicons
                    name={selectedAction === 'intro' ? 'hand-left' : 'heart'}
                    size={20}
                    color={selectedAction === 'intro' ? colors.primary : '#8B5CF6'}
                  />
                  <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
                    {selectedAction === 'intro'
                      ? `Introduce yourself to ${targetName}`
                      : `Share with ${targetName}`}
                  </Text>
                </View>

                {selectedAction === 'prayer' && (
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: isDark ? '#0f1a2e' : '#f0f4f8',
                      color: colors.textPrimary,
                      borderColor: colors.borderSubtle,
                    }]}
                    value={prayerTitle}
                    onChangeText={setPrayerTitle}
                    placeholder="Prayer request title"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={100}
                  />
                )}

                <TextInput
                  style={[styles.textArea, {
                    backgroundColor: isDark ? '#0f1a2e' : '#f0f4f8',
                    color: colors.textPrimary,
                    borderColor: colors.borderSubtle,
                  }]}
                  value={content}
                  onChangeText={setContent}
                  placeholder={selectedAction === 'intro'
                    ? "Hi everyone! I'm excited to be here..."
                    : 'Share what you\'d like prayer for...'}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />

                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                  {content.length}/500
                </Text>
              </View>
            </View>
          )}

          {/* Encouragement */}
          {!selectedAction && (
            <View style={[styles.encouragementBox, {
              backgroundColor: isDark ? '#1a2a4a' : '#f0f9ff',
              borderColor: colors.primary,
            }]}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
              <Text style={[styles.encouragementText, { color: colors.textPrimary }]}>
                Taking a first step helps you build real connections faster. People who introduce themselves are 3x more likely to stay active!
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
        {selectedAction ? (
          <Pressable
            style={[styles.button, {
              backgroundColor: content.trim().length >= 5 ? colors.primary : colors.primary + '60',
            }]}
            onPress={handleSubmit}
            disabled={isSubmitting || content.trim().length < 5}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  {selectedAction === 'intro' ? 'Post Introduction' : 'Submit Prayer Request'}
                </Text>
                <Ionicons name="send" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        ) : (
          <View />
        )}

        <Pressable
          onPress={handleSkip}
          style={styles.skipButton}
          disabled={isSkipping}
        >
          {isSkipping ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              Skip and explore
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 16,
    paddingTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 150,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 16,
  },
  actionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardArrow: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    gap: 12,
  },
  backToCards: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backToCardsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  input: {
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 12,
  },
  textArea: {
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
  },
  encouragementBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
    marginTop: 24,
  },
  encouragementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
