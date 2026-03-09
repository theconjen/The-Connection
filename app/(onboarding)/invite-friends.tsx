/**
 * INVITE FRIENDS SCREEN - The Connection Onboarding
 * Step 5: Encourage new users to invite friends and grow their community
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { communitiesAPI } from '../../src/lib/apiClient';
import apiClient from '../../src/lib/apiClient';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';

const WEB_BASE_URL = 'https://theconnection.app';
const APP_STORE_URL = 'https://apps.apple.com/app/the-connection/id6738976084';

interface JoinedCommunity {
  id: number;
  name: string;
}

export default function InviteFriendsScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();

  const [joinedCommunities, setJoinedCommunities] = useState<JoinedCommunity[]>([]);
  const [inviteCodes, setInviteCodes] = useState<Record<number, string>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [sharedCount, setSharedCount] = useState(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadJoinedCommunities();
    apiClient.post('/api/user/onboarding', { onboardingStep: 'invite-friends' }).catch(() => {});
  }, []);

  const loadJoinedCommunities = async () => {
    try {
      const stored = await SecureStore.getItemAsync('onboarding_joined_communities');
      if (stored) {
        const communities: JoinedCommunity[] = JSON.parse(stored);
        setJoinedCommunities(communities);
        // Generate invite codes for each community
        for (const community of communities) {
          try {
            const response = await communitiesAPI.generateInviteCode(community.id);
            if (response?.inviteCode) {
              setInviteCodes(prev => ({ ...prev, [community.id]: response.inviteCode }));
            }
          } catch {
            // Community may not support invite codes — skip
          }
        }
      }
    } catch {
      // No communities — general share will still work
    }
  };

  const handleShareApp = async () => {
    try {
      const displayName = user?.displayName || user?.username || 'a friend';
      const message = `Hey! I just joined The Connection — a faith-based community app where we can grow together. Come join me!\n\n${APP_STORE_URL}`;

      await Share.share(
        {
          title: 'Join The Connection',
          message,
          url: Platform.OS === 'ios' ? APP_STORE_URL : undefined,
        },
        {
          dialogTitle: 'Invite Friends',
          subject: `${displayName} invited you to The Connection`,
        },
      );
      setSharedCount(prev => prev + 1);
    } catch {
      // Share dismissed or failed
    }
  };

  const handleShareCommunity = async (community: JoinedCommunity) => {
    const code = inviteCodes[community.id];
    if (!code) {
      // Fallback to general app share
      handleShareApp();
      return;
    }

    try {
      const utmSource = Platform.OS === 'ios' ? 'ios_app' : 'android_app';
      const url = `${WEB_BASE_URL}/invite/${code}?utm_source=${utmSource}&utm_medium=share&utm_campaign=onboarding_invite`;
      const message = `Join ${community.name} on The Connection! We'd love to have you.\n\n${url}`;

      await Share.share(
        {
          title: `Join ${community.name}`,
          message,
          url: Platform.OS === 'ios' ? url : undefined,
        },
        {
          dialogTitle: `Invite to ${community.name}`,
          subject: `You're invited to ${community.name}`,
        },
      );
      setSharedCount(prev => prev + 1);
    } catch {
      // Share dismissed or failed
    }
  };

  const handleCopyLink = async (community: JoinedCommunity) => {
    const code = inviteCodes[community.id];
    if (!code) return;

    const utmSource = Platform.OS === 'ios' ? 'ios_app' : 'android_app';
    const url = `${WEB_BASE_URL}/invite/${code}?utm_source=${utmSource}&utm_medium=share&utm_campaign=onboarding_invite`;

    try {
      await Clipboard.setStringAsync(url);
      setCopiedId(community.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard not available
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      router.replace('/(tabs)/home');
    } catch {
      router.replace('/(tabs)/home');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Invite Friends
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '100%' }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step 5 of 5
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="people" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Grow your community
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            The Connection is better with friends. Invite the people you want to grow in faith with — the more who join, the stronger your community becomes.
          </Text>
        </View>

        {/* Share App Card */}
        <Pressable
          style={[styles.shareCard, {
            backgroundColor: colors.primary,
          }]}
          onPress={handleShareApp}
        >
          <View style={styles.shareCardContent}>
            <View style={[styles.shareIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="share-social" size={24} color="#fff" />
            </View>
            <View style={styles.shareCardText}>
              <Text style={styles.shareCardTitle}>Share The Connection</Text>
              <Text style={styles.shareCardDescription}>
                Send a link to friends via text, email, or social media
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </Pressable>

        {/* Community-specific invites */}
        {joinedCommunities.length > 0 && (
          <View style={styles.communitiesSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Invite to your communities
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Share a direct link so friends join the same communities as you
            </Text>

            {joinedCommunities.map((community) => (
              <View
                key={community.id}
                style={[styles.communityCard, {
                  backgroundColor: isDark ? '#1a2a4a' : '#fff',
                  borderColor: colors.borderSubtle,
                }]}
              >
                <View style={styles.communityInfo}>
                  <View style={[styles.communityIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="globe-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.communityName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {community.name}
                  </Text>
                </View>
                <View style={styles.communityActions}>
                  {inviteCodes[community.id] && (
                    <Pressable
                      onPress={() => handleCopyLink(community)}
                      style={[styles.copyButton, { borderColor: colors.borderSubtle }]}
                    >
                      <Ionicons
                        name={copiedId === community.id ? 'checkmark' : 'copy-outline'}
                        size={16}
                        color={copiedId === community.id ? '#22c55e' : colors.textSecondary}
                      />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleShareCommunity(community)}
                    style={[styles.inviteButton, { backgroundColor: colors.primary + '15' }]}
                  >
                    <Ionicons name="paper-plane-outline" size={14} color={colors.primary} />
                    <Text style={[styles.inviteButtonText, { color: colors.primary }]}>
                      Invite
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Social proof / encouragement */}
        <View style={[styles.encouragementBox, {
          backgroundColor: isDark ? '#1a2a4a' : '#f0f9ff',
          borderColor: colors.primary,
        }]}>
          <Ionicons name="heart" size={20} color={colors.primary} />
          <Text style={[styles.encouragementText, { color: colors.textPrimary }]}>
            {sharedCount > 0
              ? `You've shared ${sharedCount} invite${sharedCount > 1 ? 's' : ''}! Each one is a seed planted for someone's faith journey.`
              : '"For where two or three gather in my name, there am I with them." — Matthew 18:20'}
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleFinish}
          disabled={isFinishing}
        >
          {isFinishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {sharedCount > 0 ? "Let's go!" : "Start exploring"}
            </Text>
          )}
        </Pressable>

        {sharedCount === 0 && (
          <Pressable onPress={handleFinish} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              I'll invite friends later
            </Text>
          </Pressable>
        )}
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
    paddingBottom: 180,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  shareCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  shareCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  shareIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCardText: {
    flex: 1,
  },
  shareCardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  shareCardDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
  },
  communitiesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  communityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  communityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  encouragementBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
  },
  encouragementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
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
