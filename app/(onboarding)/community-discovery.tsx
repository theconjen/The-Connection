/**
 * COMMUNITY DISCOVERY SCREEN - The Connection Onboarding
 * Step 4: Discover and join communities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { communitiesAPI } from '../../src/lib/apiClient';
import apiClient from '../../src/lib/apiClient';
import * as SecureStore from 'expo-secure-store';

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount?: number;
  iconName?: string;
  iconColor?: string;
}

export default function CommunityDiscoveryScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [inviteCommunityId, setInviteCommunityId] = useState<number | null>(null);

  useEffect(() => {
    loadCommunities();
    // Track onboarding step for analytics
    apiClient.post('/api/user/onboarding', { onboardingStep: 'community-discovery' }).catch(() => {});
  }, []);

  const loadCommunities = async () => {
    try {
      setIsLoading(true);

      // Check for invite link community
      let inviteId: number | null = null;
      try {
        const storedInviteId = await SecureStore.getItemAsync('invite_community_id');
        if (storedInviteId) {
          inviteId = parseInt(storedInviteId, 10);
          setInviteCommunityId(inviteId);
          // Clean up so it doesn't persist across sessions
          await SecureStore.deleteItemAsync('invite_community_id');
        }
      } catch {
        // No invite link
      }

      // Try the recommendation engine first (uses interests, location, denomination)
      let data: Community[] = [];
      try {
        const res = await apiClient.get('/api/communities/recommended?limit=8');
        data = res.data || [];
      } catch {
        // Recommendation endpoint may not be available — fall back
      }

      // Fallback: sort by member count if recommendations are empty
      if (data.length === 0) {
        const allCommunities = await communitiesAPI.getAll();
        data = allCommunities
          .sort((a: any, b: any) => (b.memberCount || 0) - (a.memberCount || 0))
          .slice(0, 8);
      }

      // If there's an invite community, ensure it's at the top
      if (inviteId) {
        const inviteCommunity = data.find(c => c.id === inviteId);
        if (inviteCommunity) {
          // Move to top
          data = [inviteCommunity, ...data.filter(c => c.id !== inviteId)];
        } else {
          // Fetch it separately and prepend
          try {
            const inviteData = await communitiesAPI.getById(inviteId);
            if (inviteData) {
              data = [inviteData, ...data.slice(0, 7)];
            }
          } catch {
            // Invite community not found — proceed normally
          }
        }

        // Auto-join the invite community
        try {
          await communitiesAPI.join(inviteId);
          setJoinedCommunities(new Set([inviteId]));
        } catch {
          // May already be a member
        }
      }

      setCommunities(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleJoin = async (communityId: number) => {
    const isJoined = joinedCommunities.has(communityId);

    try {
      if (isJoined) {
        await communitiesAPI.leave(communityId);
        setJoinedCommunities(prev => {
          const next = new Set(prev);
          next.delete(communityId);
          return next;
        });
      } else {
        await communitiesAPI.join(communityId);
        setJoinedCommunities(prev => new Set(prev).add(communityId));
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update membership');
    }
  };

  const handleContinue = async () => {
    setIsCompleting(true);
    try {
      // Save joined community IDs for the first-action screen
      const joinedIds = Array.from(joinedCommunities);
      const joinedNames = communities
        .filter(c => joinedCommunities.has(c.id))
        .map(c => ({ id: c.id, name: c.name }));

      await SecureStore.setItemAsync('onboarding_joined_communities', JSON.stringify(joinedNames));

      // Navigate to first-action screen
      router.push('/(onboarding)/first-action');
    } catch (error) {
      // If storing fails, still navigate
      router.push('/(onboarding)/first-action');
    } finally {
      setIsCompleting(false);
    }
  };

  const CommunityCard = ({ community }: { community: Community }) => {
    const isJoined = joinedCommunities.has(community.id);
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldShowExpand = community.description && community.description.length > 100;

    return (
      <View style={[styles.communityCard, {
        backgroundColor: isDark ? '#1a2a4a' : '#fff',
        borderColor: colors.borderSubtle
      }]}>
        <View style={styles.communityHeader}>
          <View style={[styles.communityIcon, {
            backgroundColor: community.iconColor || colors.primary + '20'
          }]}>
            <Ionicons
              name={(community.iconName as any) || 'people'}
              size={24}
              color={community.iconColor || colors.primary}
            />
          </View>
          <View style={styles.communityInfo}>
            <Text style={[styles.communityName, { color: colors.textPrimary }]}>
              {community.name}
            </Text>
            <Text style={[styles.communityMembers, { color: colors.textSecondary }]}>
              {community.memberCount || 0} members
            </Text>
          </View>
        </View>

        <Pressable onPress={() => shouldShowExpand && setIsExpanded(!isExpanded)}>
          <Text
            style={[styles.communityDescription, { color: colors.textSecondary }]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {community.description}
          </Text>
          {shouldShowExpand && (
            <Text style={[styles.expandText, { color: colors.primary }]}>
              {isExpanded ? 'Show less' : 'Read more'}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.joinButton, {
            backgroundColor: isJoined ? 'transparent' : colors.primary,
            borderColor: isJoined ? colors.borderSubtle : colors.primary,
            borderWidth: 1,
          }]}
          onPress={() => toggleJoin(community.id)}
        >
          <Ionicons
            name={isJoined ? 'checkmark-circle' : 'add-circle-outline'}
            size={20}
            color={isJoined ? colors.textPrimary : '#fff'}
          />
          <Text style={[styles.joinButtonText, {
            color: isJoined ? colors.textPrimary : '#fff'
          }]}>
            {isJoined ? 'Joined' : 'Join'}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Discover Communities
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '60%' }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step 3 of 5
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {inviteCommunityId && communities.length > 0 && (
          <View style={[styles.inviteBanner, {
            backgroundColor: colors.primary + '15',
            borderColor: colors.primary,
          }]}>
            <Ionicons name="mail-open" size={20} color={colors.primary} />
            <Text style={[styles.inviteBannerText, { color: colors.textPrimary }]}>
              You've been invited to{' '}
              <Text style={{ fontWeight: '700' }}>
                {communities.find(c => c.id === inviteCommunityId)?.name || 'a community'}
              </Text>
              !
            </Text>
          </View>
        )}

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {inviteCommunityId
            ? 'We also found some communities you might enjoy based on your interests.'
            : 'Join communities that align with your faith and interests. You can always discover more later.'}
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Finding communities for you...
            </Text>
          </View>
        ) : communities.length > 0 ? (
          <View style={styles.communitiesContainer}>
            {communities.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No communities available yet
            </Text>
          </View>
        )}

        {/* Encouragement */}
        <View style={[styles.encouragementBox, {
          backgroundColor: isDark ? '#1a2a4a' : '#f0f9ff',
          borderColor: colors.primary
        }]}>
          <Ionicons name="bulb" size={20} color={colors.primary} />
          <Text style={[styles.encouragementText, { color: colors.textPrimary }]}>
            Communities are where you'll find accountability, encouragement, and opportunities to grow in faith together.
          </Text>
        </View>
      </ScrollView>

      {/* Complete Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
        <View style={[styles.statsBox, {
          backgroundColor: isDark ? '#1a2a4a' : '#f0f4f8',
        }]}>
          <Text style={[styles.statsText, { color: colors.textPrimary }]}>
            {joinedCommunities.size} {joinedCommunities.size === 1 ? 'community' : 'communities'} joined
          </Text>
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
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
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  inviteBannerText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  communitiesContainer: {
    gap: 12,
  },
  communityCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  communityHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  communityMembers: {
    fontSize: 13,
  },
  communityDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  encouragementBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
    marginTop: 20,
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
  statsBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
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
});
