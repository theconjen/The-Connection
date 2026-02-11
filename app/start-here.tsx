/**
 * Start Here Onboarding Screen
 * A low-friction onboarding flow for new users:
 * 1. Location (optional) - Enable to see nearby communities
 * 2. Categories (required) - Choose 3-5 categories
 * 3. Starter Communities - Join a few to get started
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { useTheme } from '../src/contexts/ThemeContext';
import { communitiesAPI } from '../src/lib/apiClient';
import {
  AVAILABLE_CATEGORIES,
  saveLocationPermissionGranted,
  saveLastKnownCoords,
  saveSelectedTopics,
  setStartHereCompleted,
  getLocationPermissionGranted,
} from '../src/utils/onboardingPrefs';
import {
  requestLocationPermission,
  getCurrentLocation,
  hasLocationPermission,
} from '../src/services/locationService';

// Category to server-side filter mapping
// Maps user-friendly categories to the actual database filter fields
const CATEGORY_TO_FILTERS: Record<string, { field: string; values: string[] }[]> = {
  // Life Stage
  'College Life': [
    { field: 'lifeStages', values: ['Students'] },
    { field: 'ageGroup', values: ['Young Adult'] },
  ],
  'Young Professional': [
    { field: 'lifeStages', values: ['Young Professionals'] },
    { field: 'ageGroup', values: ['Young Adult', 'Adult'] },
  ],
  'Single': [
    { field: 'lifeStages', values: ['Singles'] },
  ],
  'Dating & Relationships': [
    { field: 'lifeStages', values: ['Singles', 'Married'] },
  ],
  'Newlywed': [
    { field: 'lifeStages', values: ['Married'] },
  ],
  // Gender
  'Men': [
    { field: 'gender', values: ["Men's Only"] },
  ],
  'Women': [
    { field: 'gender', values: ["Women's Only"] },
  ],
  // Faith & Growth
  'New to Faith': [
    { field: 'lifeStages', values: ['New Believers'] },
    { field: 'ministry', values: ['Discipleship'] },
  ],
  'Bible Study': [
    { field: 'ministry', values: ['Bible Study'] },
  ],
  'Prayer': [
    { field: 'ministry', values: ['Prayer'] },
  ],
  'Worship & Music': [
    { field: 'ministry', values: ['Worship'] },
    { field: 'activities', values: ['Music', 'Worship Music'] },
  ],
  'Apologetics': [
    { field: 'ministry', values: ['Apologetics'] },
  ],
  'Missions & Outreach': [
    { field: 'ministry', values: ['Missions', 'Evangelism'] },
    { field: 'activities', values: ['Service Projects', 'Volunteering'] },
  ],
  // Interests & Lifestyle
  'Mental Health': [
    { field: 'recovery', values: ['Mental Health'] },
  ],
  'Career & Purpose': [
    { field: 'professions', values: ['Business', 'Entrepreneurs'] },
    { field: 'lifeStages', values: ['Young Professionals'] },
  ],
  'Creative Arts': [
    { field: 'activities', values: ['Arts & Crafts', 'Music', 'Photography', 'Writing', 'Theater/Drama'] },
  ],
  'Fitness & Sports': [
    { field: 'activities', values: ['Sports', 'Fitness', 'Running', 'Hiking', 'Basketball', 'Soccer', 'Cycling', 'Swimming'] },
  ],
  'Social Events': [
    { field: 'activities', values: ['Social Events', 'Coffee & Conversations', 'Board Games', 'Movies'] },
  ],
  'Small Groups': [
    { field: 'ministry', values: ['Discipleship', 'Bible Study'] },
    { field: 'meetingType', values: ['In-Person', 'Hybrid'] },
  ],
};

// Legacy keyword mapping for fallback text-based matching
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'College Life': ['college', 'university', 'student', 'campus', 'dorm', 'grad'],
  'Young Professional': ['professional', 'career', 'workplace', 'young adult', '20s', 'millennial'],
  'Single': ['single', 'singles', 'unmarried'],
  'Dating & Relationships': ['dating', 'relationship', 'couples', 'love', 'engaged'],
  'Newlywed': ['newlywed', 'married', 'marriage', 'spouse', 'wedding'],
  'Men': ['men', 'man', 'brotherhood', 'guys', 'bros'],
  'Women': ['women', 'woman', 'sisterhood', 'ladies', 'girls'],
  'New to Faith': ['new believer', 'new to faith', 'seeker', 'exploring', 'beginner', 'basics'],
  'Bible Study': ['bible', 'study', 'scripture', 'word', 'reading', 'devotional'],
  'Prayer': ['prayer', 'intercession', 'praying', 'devotion'],
  'Worship & Music': ['worship', 'praise', 'music', 'singing', 'band', 'choir'],
  'Apologetics': ['apologetics', 'defense', 'reason', 'evidence', 'questions', 'theology', 'doctrine'],
  'Missions & Outreach': ['missions', 'outreach', 'evangelism', 'serve', 'volunteer', 'global'],
  'Mental Health': ['mental health', 'wellness', 'anxiety', 'support', 'healing', 'recovery'],
  'Career & Purpose': ['career', 'purpose', 'calling', 'work', 'vocation', 'business'],
  'Creative Arts': ['creative', 'art', 'music', 'writing', 'film', 'media', 'design'],
  'Fitness & Sports': ['fitness', 'sports', 'gym', 'running', 'workout', 'health', 'active'],
  'Social Events': ['social', 'events', 'meetup', 'gathering', 'hangout', 'fun', 'fellowship'],
  'Small Groups': ['small group', 'home group', 'life group', 'community', 'connect'],
};

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount?: number;
  iconName?: string;
  iconColor?: string;
  slug?: string;
  // Filter fields from the database
  ageGroup?: string;
  gender?: string;
  ministryTypes?: string[];
  activities?: string[];
  professions?: string[];
  recoverySupport?: string[];
  meetingType?: string;
  frequency?: string;
  lifeStages?: string[];
  parentCategories?: string[];
}

export default function StartHereScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Location state
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Categories state - always start fresh, don't load saved preferences
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const MIN_CATEGORIES = 3;
  const MAX_CATEGORIES = 5;

  // Communities state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Set<number>>(new Set());
  const [joiningCommunityId, setJoiningCommunityId] = useState<number | null>(null);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

  // Store all communities for filtering
  const [allCommunitiesData, setAllCommunitiesData] = useState<Community[]>([]);

  // Load initial state
  useEffect(() => {
    loadInitialState();
    loadAllCommunities();
  }, []);

  // Re-filter communities when categories change
  useEffect(() => {
    if (allCommunitiesData.length > 0) {
      filterCommunitiesByCategories(allCommunitiesData, selectedCategories);
    }
  }, [selectedCategories, allCommunitiesData]);

  const loadInitialState = async () => {
    // Only check location permission status, don't load saved categories
    // User should select categories fresh each time they visit Start Here
    const locationGranted = await getLocationPermissionGranted();

    if (locationGranted) {
      const hasPermission = await hasLocationPermission();
      setLocationEnabled(hasPermission);
    }
  };

  // Calculate relevance score for a community based on selected categories
  // Uses both filter field matching and keyword fallback
  const calculateRelevanceScore = (community: any, categories: string[]): number => {
    if (categories.length === 0) return 0;

    let score = 0;
    const communityText = `${community.name} ${community.description || ''}`.toLowerCase();

    for (const category of categories) {
      // First, try filter field matching (more accurate)
      const filterMappings = CATEGORY_TO_FILTERS[category] || [];
      for (const mapping of filterMappings) {
        const communityFieldValue = community[mapping.field === 'ministry' ? 'ministryTypes' :
                                              mapping.field === 'recovery' ? 'recoverySupport' :
                                              mapping.field];
        if (communityFieldValue) {
          // Check if any of the filter values match
          if (Array.isArray(communityFieldValue)) {
            const hasMatch = mapping.values.some(v =>
              communityFieldValue.some((cv: string) =>
                cv.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(cv.toLowerCase())
              )
            );
            if (hasMatch) {
              score += 20; // Strong match via filter fields
            }
          } else if (typeof communityFieldValue === 'string') {
            const hasMatch = mapping.values.some(v =>
              communityFieldValue.toLowerCase().includes(v.toLowerCase()) ||
              v.toLowerCase().includes(communityFieldValue.toLowerCase())
            );
            if (hasMatch) {
              score += 20; // Strong match via filter fields
            }
          }
        }
      }

      // Fallback to keyword matching for communities without filter data
      const keywords = CATEGORY_KEYWORDS[category] || [];
      for (const keyword of keywords) {
        if (communityText.includes(keyword.toLowerCase())) {
          score += 10; // Base keyword match
          // Bonus for name match (more relevant)
          if (community.name.toLowerCase().includes(keyword.toLowerCase())) {
            score += 5;
          }
        }
      }
    }

    return score;
  };

  // Check if a community should be excluded based on gender selection
  const shouldExcludeByGender = (community: Community, categories: string[]): boolean => {
    const communityGender = community.gender?.toLowerCase() || '';
    const communityName = community.name.toLowerCase();
    const communityDesc = (community.description || '').toLowerCase();

    // Check if user selected Women
    if (categories.includes('Women')) {
      // Exclude men's only communities
      if (communityGender.includes("men's only") || communityGender.includes('men only')) {
        return true;
      }
      // Also check name/description for men's groups
      if ((communityName.includes("men's") || communityName.includes('mens ') || communityName.includes(' men ')) &&
          !communityName.includes("women")) {
        return true;
      }
    }

    // Check if user selected Men
    if (categories.includes('Men')) {
      // Exclude women's only communities
      if (communityGender.includes("women's only") || communityGender.includes('women only')) {
        return true;
      }
      // Also check name/description for women's groups
      if ((communityName.includes("women's") || communityName.includes('womens ') ||
           communityName.includes(' women ') || communityName.includes('moms') || communityName.includes('ladies')) &&
          !communityName.includes("men")) {
        return true;
      }
    }

    return false;
  };

  const filterCommunitiesByCategories = (allCommunities: Community[], categories: string[]) => {
    if (categories.length === 0) {
      // No categories selected, show top communities by member count
      const sorted = [...allCommunities]
        .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
        .slice(0, 8);
      setCommunities(sorted);
      return;
    }

    // First, filter out communities that conflict with gender selection
    const filteredByGender = allCommunities.filter(c => !shouldExcludeByGender(c, categories));

    // Score and sort communities by relevance to selected categories
    const scoredCommunities = filteredByGender.map(c => ({
      community: c,
      score: calculateRelevanceScore(c, categories),
    }));

    // Sort by score (descending), then by member count for ties
    scoredCommunities.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.community.memberCount || 0) - (a.community.memberCount || 0);
    });

    // Take top matches, but include some variety
    const matched = scoredCommunities
      .filter(s => s.score > 0)
      .slice(0, 6)
      .map(s => s.community);

    // If we don't have enough matches, add popular communities (still respecting gender filter)
    if (matched.length < 4) {
      const remaining = filteredByGender
        .filter(c => !matched.find(m => m.id === c.id))
        .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
        .slice(0, 6 - matched.length);
      matched.push(...remaining);
    }

    setCommunities(matched.slice(0, 8));
  };

  const loadAllCommunities = async () => {
    try {
      setIsLoadingCommunities(true);
      const allCommunities = await communitiesAPI.getAll();

      setAllCommunitiesData(allCommunities);

      // Mark already joined communities
      const joined = new Set<number>();
      allCommunities.forEach((c: any) => {
        if (c.isMember) joined.add(c.id);
      });
      setJoinedCommunities(joined);

      // Initial filter
      filterCommunitiesByCategories(allCommunities, selectedCategories);
    } catch (error) {
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  // Location handlers
  const handleEnableLocation = async () => {
    setLocationLoading(true);
    try {
      const granted = await requestLocationPermission();
      if (granted) {
        const location = await getCurrentLocation();
        if (location) {
          await saveLastKnownCoords({
            latitude: location.latitude,
            longitude: location.longitude,
          });
          await saveLocationPermissionGranted(true);
          setLocationEnabled(true);
        }
      }
    } catch (error) {
    } finally {
      setLocationLoading(false);
    }
  };

  // Category handlers
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      if (prev.length >= MAX_CATEGORIES) {
        Alert.alert('Maximum Categories', `You can select up to ${MAX_CATEGORIES} categories.`);
        return prev;
      }
      return [...prev, category];
    });
  };

  // Show welcome message for new admins/owners
  const showAdminWelcome = (communityName: string) => {
    Alert.alert(
      'You\'re the Community Admin!',
      `As the first member of "${communityName}", you're now the Admin. Here's what that means:\n\n` +
      '• You can manage members and assign moderators\n' +
      '• You control community settings and privacy\n' +
      '• You can remove inappropriate content\n\n' +
      'Important: Update your community\'s location in Settings so people nearby can discover and join what God is building through this community!',
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  // Show welcome message for new moderators
  const showModeratorWelcome = (communityName: string) => {
    Alert.alert(
      'You\'re Now a Moderator!',
      `You've been made a moderator of "${communityName}". Here's your role:\n\n` +
      '• Help maintain a positive, Christ-centered environment\n' +
      '• Review and remove inappropriate content\n' +
      '• Welcome new members and encourage participation\n' +
      '• Support the Admin in growing the community\n\n' +
      'Tip: Encourage the Admin to set the community location so nearby believers can find and join!',
      [{ text: 'Let\'s go!', style: 'default' }]
    );
  };

  // Community handlers
  const toggleJoinCommunity = async (communityId: number) => {
    const isJoined = joinedCommunities.has(communityId);

    // Prevent double-tap
    if (joiningCommunityId === communityId) return;

    setJoiningCommunityId(communityId);

    try {
      if (isJoined) {
        await communitiesAPI.leave(communityId);
        setJoinedCommunities(prev => {
          const next = new Set(prev);
          next.delete(communityId);
          return next;
        });
      } else {
        const response = await communitiesAPI.join(communityId);

        // Check if join was successful or pending (for private communities)
        if (response?.isPending) {
          Alert.alert('Request Sent', 'Your join request has been sent to the community admins.');
        } else {
          // Join was successful
          setJoinedCommunities(prev => new Set(prev).add(communityId));

          // Check if user became an admin (first to join)
          const community = communities.find(c => c.id === communityId);
          if (response?.role === 'owner') {
            showAdminWelcome(community?.name || 'this community');
          } else if (response?.role === 'moderator') {
            showModeratorWelcome(community?.name || 'this community');
          }
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to update membership';

      // If already a member, update the UI accordingly
      if (error.response?.data?.isMember) {
        setJoinedCommunities(prev => new Set(prev).add(communityId));
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setJoiningCommunityId(null);
    }
  };

  // Finish handler
  const handleFinish = async () => {
    if (selectedCategories.length < MIN_CATEGORIES) {
      Alert.alert('Select Categories', `Please select at least ${MIN_CATEGORIES} categories to continue.`);
      return;
    }

    setIsFinishing(true);
    try {
      // Save categories (using existing saveSelectedTopics for backwards compatibility)
      await saveSelectedTopics(selectedCategories);

      // Mark Start Here as completed
      await setStartHereCompleted(true);

      // Navigate back to communities
      router.replace('/(tabs)/communities');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsFinishing(false);
    }
  };

  const canFinish = selectedCategories.length >= MIN_CATEGORIES;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Get Started
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Location (Optional) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Show communities near you
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Enable location to see nearby communities. Optional.
              </Text>
            </View>
          </View>

          {locationEnabled ? (
            <View style={[styles.locationEnabled, { backgroundColor: colors.sage + '20', borderColor: colors.sage }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.sage} />
              <Text style={[styles.locationEnabledText, { color: colors.sage }]}>
                Location enabled
              </Text>
            </View>
          ) : (
            <View style={styles.locationButtons}>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleEnableLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="navigate" size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>Enable location</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.borderSubtle }]}
                onPress={() => setLocationEnabled(false)}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                  Not now
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Section 2: Categories (Required) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Choose a Few Categories
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Select {MIN_CATEGORIES}-{MAX_CATEGORIES} categories that describe you.
              </Text>
            </View>
          </View>

          <View style={styles.topicsContainer}>
            {AVAILABLE_CATEGORIES.map(category => {
              const isSelected = selectedCategories.includes(category);
              return (
                <Pressable
                  key={category}
                  style={[
                    styles.topicChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text
                    style={[
                      styles.topicChipText,
                      { color: isSelected ? '#fff' : colors.textPrimary },
                    ]}
                  >
                    {category}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.topicCount, { color: colors.textMuted }]}>
            {selectedCategories.length} of {MIN_CATEGORIES} minimum selected
          </Text>
        </View>

        {/* Section 3: Starter Communities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Join a few communities
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Follow communities to see their content in your feed.
              </Text>
            </View>
          </View>

          {isLoadingCommunities ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Loading communities...
              </Text>
            </View>
          ) : communities.length > 0 ? (
            <View style={styles.communitiesContainer}>
              {communities.map(community => {
                const isJoined = joinedCommunities.has(community.id);
                return (
                  <View
                    key={community.id}
                    style={[
                      styles.communityCard,
                      {
                        backgroundColor: isDark ? '#1a2a4a' : colors.surface,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <View style={styles.communityInfo}>
                      <View
                        style={[
                          styles.communityIcon,
                          { backgroundColor: (community.iconColor || colors.primary) + '20' },
                        ]}
                      >
                        <Ionicons
                          name={(community.iconName as any) || 'people'}
                          size={18}
                          color={community.iconColor || colors.primary}
                        />
                      </View>
                      <View style={styles.communityDetails}>
                        <Text
                          style={[styles.communityName, { color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {community.name}
                        </Text>
                        <Text
                          style={[styles.communityMembers, { color: colors.textMuted }]}
                        >
                          {community.memberCount || 0} members
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      style={[
                        styles.joinButton,
                        {
                          backgroundColor: isJoined ? 'transparent' : colors.primary,
                          borderColor: isJoined ? colors.borderSubtle : colors.primary,
                        },
                      ]}
                      onPress={() => toggleJoinCommunity(community.id)}
                      disabled={joiningCommunityId === community.id}
                    >
                      {joiningCommunityId === community.id ? (
                        <ActivityIndicator size="small" color={isJoined ? colors.textPrimary : '#fff'} />
                      ) : (
                        <Text
                          style={[
                            styles.joinButtonText,
                            { color: isJoined ? colors.textPrimary : '#fff' },
                          ]}
                        >
                          {isJoined ? 'Joined' : 'Join'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noCommunitiesContainer}>
              <View style={[styles.inspireIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="sparkles" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.inspireTitle, { color: colors.textPrimary }]}>
                Be the First to Start Something
              </Text>
              <Text style={[styles.inspireText, { color: colors.textMuted }]}>
                We don't have a community that matches yet, but maybe that's not a coincidence.
                Perhaps God is calling you to start something new in your area.
              </Text>
              <Text style={[styles.inspireVerse, { color: colors.textSecondary }]}>
                "For we are God's handiwork, created in Christ Jesus to do good works,
                which God prepared in advance for us to do." — Ephesians 2:10
              </Text>
              <Pressable
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/create/community')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create a Community</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Finish Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
        <Pressable
          style={[
            styles.finishButton,
            {
              backgroundColor: canFinish ? colors.primary : colors.surfaceMuted,
            },
          ]}
          onPress={handleFinish}
          disabled={!canFinish || isFinishing}
        >
          {isFinishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text
                style={[
                  styles.finishButtonText,
                  { color: canFinish ? '#fff' : colors.textMuted },
                ]}
              >
                Finish
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={canFinish ? '#fff' : colors.textMuted}
              />
            </>
          )}
        </Pressable>
        {!canFinish && (
          <Text style={[styles.finishHint, { color: colors.textMuted }]}>
            Select at least {MIN_CATEGORIES} categories to continue
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Location styles
  locationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    flex: 1,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  locationEnabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  locationEnabledText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Topics styles
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  topicChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  topicCount: {
    marginTop: 12,
    fontSize: 13,
    textAlign: 'center',
  },
  // Communities styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
  },
  communitiesContainer: {
    gap: 10,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  communityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityDetails: {
    flex: 1,
  },
  communityName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  communityMembers: {
    fontSize: 13,
  },
  joinButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noCommunities: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  noCommunitiesContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  inspireIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  inspireTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  inspireText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  inspireVerse: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  finishHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
