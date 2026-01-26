/**
 * Start Here Onboarding Screen
 * A low-friction onboarding flow for new users:
 * 1. Location (optional) - Enable to see nearby communities
 * 2. Topics (required) - Pick 3-5 interests
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
  AVAILABLE_TOPICS,
  saveLocationPermissionGranted,
  saveLastKnownCoords,
  saveSelectedTopics,
  setStartHereCompleted,
  getSelectedTopics,
  getLocationPermissionGranted,
} from '../src/utils/onboardingPrefs';
import {
  requestLocationPermission,
  getCurrentLocation,
  hasLocationPermission,
} from '../src/services/locationService';

// Starter community IDs - these are known good communities for new users
// Can be configured without backend changes
const STARTER_COMMUNITY_SLUGS = [
  'the-connection-community',
  'bible-study',
  'prayer-warriors',
  'young-adults',
  'new-believers',
  'apologetics',
];

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount?: number;
  iconName?: string;
  iconColor?: string;
  slug?: string;
}

export default function StartHereScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Location state
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Topics state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const MIN_TOPICS = 3;
  const MAX_TOPICS = 5;

  // Communities state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Set<number>>(new Set());
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

  // Load initial state
  useEffect(() => {
    loadInitialState();
    loadCommunities();
  }, []);

  const loadInitialState = async () => {
    const [topics, locationGranted] = await Promise.all([
      getSelectedTopics(),
      getLocationPermissionGranted(),
    ]);
    if (topics.length > 0) setSelectedTopics(topics);
    if (locationGranted) {
      const hasPermission = await hasLocationPermission();
      setLocationEnabled(hasPermission);
    }
  };

  const loadCommunities = async () => {
    try {
      setIsLoadingCommunities(true);
      const allCommunities = await communitiesAPI.getAll();

      // Filter to starter communities or top communities
      let starterCommunities = allCommunities.filter((c: Community) =>
        STARTER_COMMUNITY_SLUGS.includes(c.slug || '')
      );

      // If no starter communities found, use top communities by member count
      if (starterCommunities.length < 3) {
        starterCommunities = allCommunities
          .sort((a: Community, b: Community) => (b.memberCount || 0) - (a.memberCount || 0))
          .slice(0, 6);
      }

      setCommunities(starterCommunities.slice(0, 6));

      // Mark already joined communities
      const joined = new Set<number>();
      allCommunities.forEach((c: any) => {
        if (c.isMember) joined.add(c.id);
      });
      setJoinedCommunities(joined);
    } catch (error) {
      console.error('Error loading communities:', error);
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
      console.error('Error enabling location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  // Topic handlers
  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      }
      if (prev.length >= MAX_TOPICS) {
        Alert.alert('Maximum Topics', `You can select up to ${MAX_TOPICS} topics.`);
        return prev;
      }
      return [...prev, topic];
    });
  };

  // Community handlers
  const toggleJoinCommunity = async (communityId: number) => {
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

  // Finish handler
  const handleFinish = async () => {
    if (selectedTopics.length < MIN_TOPICS) {
      Alert.alert('Select Topics', `Please select at least ${MIN_TOPICS} topics to continue.`);
      return;
    }

    setIsFinishing(true);
    try {
      // Save topics
      await saveSelectedTopics(selectedTopics);

      // Mark Start Here as completed
      await setStartHereCompleted(true);

      // Navigate back to communities
      router.replace('/(tabs)/communities');
    } catch (error) {
      console.error('Error finishing onboarding:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsFinishing(false);
    }
  };

  const canFinish = selectedTopics.length >= MIN_TOPICS;

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

        {/* Section 2: Topics (Required) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Pick a few topics
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Select {MIN_TOPICS}-{MAX_TOPICS} topics that interest you.
              </Text>
            </View>
          </View>

          <View style={styles.topicsContainer}>
            {AVAILABLE_TOPICS.map(topic => {
              const isSelected = selectedTopics.includes(topic);
              return (
                <Pressable
                  key={topic}
                  style={[
                    styles.topicChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => toggleTopic(topic)}
                >
                  <Text
                    style={[
                      styles.topicChipText,
                      { color: isSelected ? '#fff' : colors.textPrimary },
                    ]}
                  >
                    {topic}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.topicCount, { color: colors.textMuted }]}>
            {selectedTopics.length} of {MIN_TOPICS} minimum selected
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
                    >
                      <Text
                        style={[
                          styles.joinButtonText,
                          { color: isJoined ? colors.textPrimary : '#fff' },
                        ]}
                      >
                        {isJoined ? 'Joined' : 'Join'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.noCommunities, { color: colors.textMuted }]}>
              No communities available yet.
            </Text>
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
            Select at least {MIN_TOPICS} topics to continue
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
