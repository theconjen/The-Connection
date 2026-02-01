/**
 * COMMUNITY DISCOVERY SCREEN - The Connection Onboarding
 * Step 4: Discover and join communities
 *
 * Communities are personalized based on user's selected interests
 * from the faith-background step.
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { communitiesAPI } from '../../src/lib/apiClient';
import apiClient from '../../src/lib/apiClient';
import * as SecureStore from 'expo-secure-store';

// Topic to community keyword mapping - matches user interests to communities
const INTEREST_KEYWORDS: Record<string, string[]> = {
  'Bible Study': ['bible', 'study', 'scripture', 'word', 'reading'],
  'Prayer': ['prayer', 'intercession', 'warriors', 'praying'],
  'Apologetics': ['apologetics', 'defense', 'reason', 'evidence', 'questions'],
  'Theology': ['theology', 'doctrine', 'reformed', 'faith', 'beliefs'],
  'Evangelism': ['evangelism', 'outreach', 'gospel', 'witness', 'sharing'],
  'Missions': ['missions', 'missionary', 'outreach', 'global', 'international'],
  'Discipleship': ['discipleship', 'growth', 'mentor', 'disciple', 'spiritual'],
  'Worship': ['worship', 'praise', 'music', 'singing'],
  'Youth Ministry': ['youth', 'teen', 'student', 'young'],
  "Men's Ministry": ['men', 'man', 'brotherhood', 'guys', 'fathers'],
  "Women's Ministry": ['women', 'woman', 'sisterhood', 'ladies', 'mothers', 'moms'],
  'Marriage & Family': ['marriage', 'married', 'couples', 'spouse', 'family', 'parent'],
  'Small Groups': ['small', 'group', 'home', 'cell'],
  'Volunteering': ['volunteer', 'serve', 'service', 'helping'],
  'Christian Education': ['education', 'teaching', 'learning', 'school'],
  'Spiritual Formation': ['formation', 'spiritual', 'growth', 'journey'],
};

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
  const { colors, isDark } = useTheme();
  const { user, refresh } = useAuth();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  useEffect(() => {
    loadCommunities();
  }, []);

  // Calculate relevance score for a community based on user's interests
  const calculateRelevanceScore = (community: Community, interests: string[]): number => {
    if (interests.length === 0) return 0;

    let score = 0;
    const communityText = `${community.name} ${community.description || ''}`.toLowerCase();

    for (const interest of interests) {
      const keywords = INTEREST_KEYWORDS[interest] || [];
      for (const keyword of keywords) {
        if (communityText.includes(keyword.toLowerCase())) {
          score += 10; // Base match
          // Bonus for name match (more relevant)
          if (community.name.toLowerCase().includes(keyword.toLowerCase())) {
            score += 5;
          }
        }
      }
    }

    return score;
  };

  // Filter and sort communities by relevance to user's interests
  const filterCommunitiesByInterests = (allCommunities: Community[], interests: string[]): Community[] => {
    if (interests.length === 0) {
      // No interests selected, show top communities by member count
      return [...allCommunities]
        .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
        .slice(0, 10);
    }

    // Score and sort communities by relevance
    const scoredCommunities = allCommunities.map(c => ({
      community: c,
      score: calculateRelevanceScore(c, interests),
    }));

    // Sort by score (descending), then by member count for ties
    scoredCommunities.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.community.memberCount || 0) - (a.community.memberCount || 0);
    });

    // Take top matches
    const matched = scoredCommunities
      .filter(s => s.score > 0)
      .slice(0, 8)
      .map(s => s.community);

    // If we don't have enough matches, add popular communities
    if (matched.length < 5) {
      const remaining = allCommunities
        .filter(c => !matched.find(m => m.id === c.id))
        .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
        .slice(0, 10 - matched.length);
      matched.push(...remaining);
    }

    return matched.slice(0, 10);
  };

  const loadCommunities = async () => {
    try {
      setIsLoading(true);

      // Get user's interests from the previous step
      const faithData = await SecureStore.getItemAsync('onboarding_faith');
      let interests: string[] = [];
      if (faithData) {
        const parsed = JSON.parse(faithData);
        interests = parsed.interests || [];
        setUserInterests(interests);
      }

      const data = await communitiesAPI.getAll();

      // Filter communities based on user's interests
      const personalized = filterCommunitiesByInterests(data, interests);

      setCommunities(personalized);
    } catch (error) {
      console.error('Error loading communities:', error);
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
      console.error('Error toggling community:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update membership');
    }
  };

  const completeOnboarding = async () => {
    setIsCompleting(true);
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
      });

      // Mark onboarding as completed
      await apiClient.post('/api/user/onboarding', {
        onboardingCompleted: true,
        interests: faith.interests || [],
      });

      // Refresh user context to get updated onboardingCompleted status
      await refresh();

      // Clean up secure storage
      await SecureStore.deleteItemAsync('onboarding_profile');
      await SecureStore.deleteItemAsync('onboarding_faith');

      // Navigate to feed
      router.replace('/(tabs)/feed');

      // Show success message
      setTimeout(() => {
        Alert.alert(
          'Welcome to The Connection! 🙏',
          'Your profile has been set up. Start exploring communities and connecting with believers.'
        );
      }, 500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete setup. You can finish it later in settings.');
      router.replace('/(tabs)/feed');
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
        borderColor: colors.border
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
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '100%' }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step 3 of 3
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {userInterests.length > 0
            ? 'Based on your interests, here are communities you might enjoy. You can always discover more later.'
            : 'Join communities that align with your faith and interests. You can always discover more later.'}
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading communities...
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
          onPress={completeOnboarding}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Complete Setup</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
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
