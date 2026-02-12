/**
 * User Profile Screen - View other users' profiles (Instagram-adjacent style)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { fetchBiblePassage, looksLikeBibleReference } from '../../src/lib/bibleApi';
import { formatDistanceToNow } from 'date-fns';

// Helper to format activity dates
const formatActivityDate = (date: Date) => {
  try {
    return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
  } catch {
    return '';
  }
};

// Custom church icon
const ChurchIcon = require('../../assets/church-icon.png');

interface UserProfile {
  user: {
    id: number;
    username: string;
    displayName?: string;
    bio?: string;
    profileImageUrl?: string;
    location?: string;
    denomination?: string;
    homeChurch?: string;
    favoriteBibleVerse?: string;
    testimony?: string;
    interests?: string;
    isVerifiedClergy?: boolean;
    isVerifiedApologeticsAnswerer?: boolean;
  };
  stats: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
    communitiesCount: number;
    eventsCount?: number;
  };
  communities?: any[];
  recentPosts?: any[];
  recentMicroblogs?: any[];
  isPrivate?: boolean;
  isTopContributor?: boolean;
  topContributorContexts?: string[];
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colors, colorScheme } = useTheme();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'activity' | 'communities'>('communities');
  const [refreshing, setRefreshing] = useState(false);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [versePassage, setVersePassage] = useState<{ reference: string; text: string; translation: string } | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userIdNum = parseInt(userId || '0');
  const isOwnProfile = currentUser?.id === userIdNum;

  // Fetch user profile
  const { data: profile, isLoading, refetch } = useQuery<UserProfile>({
    queryKey: ['userProfile', userIdNum],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${userIdNum}/profile`);
      return response.data;
    },
    enabled: !!userIdNum,
  });

  // Fetch user activity (respects privacy)
  const { data: activityData, isLoading: isActivityLoading, refetch: refetchActivity } = useQuery({
    queryKey: ['userActivity', userIdNum],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${userIdNum}/activity`);
      return response.data;
    },
    enabled: !!userIdNum && activeTab === 'activity',
  });

  // Check follow status
  const { data: followStatus } = useQuery({
    queryKey: ['followStatus', userIdNum],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${userIdNum}/follow-status`);
      return response.data;
    },
    enabled: !!userIdNum && !isOwnProfile,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/api/users/${userIdNum}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus', userIdNum] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', userIdNum] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to follow user');
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/users/${userIdNum}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus', userIdNum] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', userIdNum] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to unfollow user');
    },
  });

  const handleFollowToggle = () => {
    if (followStatus?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const handleMessage = () => {
    router.push(`/messages/${userIdNum}`);
  };

  const handleBlockUser = () => {
    setShowUserMenu(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${profile?.user?.displayName || profile?.user?.username}? They won't be able to see your profile or message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post(`/api/users/${userIdNum}/block`);
              Alert.alert('Blocked', 'User has been blocked.');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const handleReportUser = () => {
    setShowUserMenu(false);
    Alert.alert(
      'Report User',
      'Are you sure you want to report this user for inappropriate behavior?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post(`/api/users/${userIdNum}/report`, {
                reason: 'Reported from profile screen',
              });
              Alert.alert('Reported', 'Thank you for your report. We will review it shortly.');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to report user');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchActivity()]);
    setRefreshing(false);
  };

  const handleVersePress = async () => {
    const verseText = profile?.user?.favoriteBibleVerse;
    if (!verseText) return;

    setShowVerseModal(true);
    setVerseLoading(true);

    if (looksLikeBibleReference(verseText)) {
      const result = await fetchBiblePassage(verseText);
      setVersePassage({
        reference: result.reference,
        text: result.text,
        translation: result.translation || 'WEB',
      });
    } else {
      setVersePassage({
        reference: '',
        text: verseText,
        translation: '',
      });
    }

    setVerseLoading(false);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>User not found</Text>
          <Pressable
            style={[styles.backButtonLarge, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { user, stats, communities } = profile;
  const displayName = user.displayName || user.username;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Profile Header - Instagram Style */}
        <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
          {/* Top Row: Avatar + Stats */}
          <View style={styles.topRow}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {user.profileImageUrl ? (
                <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                    {getInitials(displayName)}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.eventsCount || 0}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Events</Text>
              </View>
              <Pressable
                style={styles.statItem}
                onPress={() => router.push(`/profile/followers?userId=${userIdNum}&tab=followers`)}
              >
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.followersCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Connections</Text>
              </Pressable>
              <Pressable
                style={styles.statItem}
                onPress={() => router.push(`/profile/followers?userId=${userIdNum}&tab=following`)}
              >
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.followingCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Connected</Text>
              </Pressable>
            </View>
          </View>

          {/* Name and Username */}
          <View style={styles.infoSection}>
            {/* Name with denomination badge */}
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: colors.textPrimary }]}>{displayName}</Text>
              {user.isVerifiedClergy && (
                <Image
                  source={require('../../assets/clergy-shield.png')}
                  style={{ width: 18, height: 18, marginLeft: 2 }}
                  resizeMode="contain"
                />
              )}
              {user.isVerifiedApologeticsAnswerer && (
                <Image
                  source={require('../../assets/apologist-shield.png')}
                  style={{ width: 18, height: 18, marginLeft: 2 }}
                  resizeMode="contain"
                />
              )}
              {profile.isTopContributor && (
                <View style={styles.topContributorRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success || '#22C55E'} />
                  <Text style={[styles.topContributorLabel, { color: colors.textMuted }]}>Top Contributor</Text>
                </View>
              )}
              {user.denomination && (
                <View style={[styles.denominationBadge, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.denominationText, { color: colors.primary }]}>{user.denomination}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.username, { color: colors.textSecondary }]}>@{user.username}</Text>

            {/* Compact location & church info */}
            {(user.location || user.homeChurch) && (
              <View style={styles.compactInfoRow}>
                {user.location && (
                  <>
                    <Ionicons name="location" size={12} color={colors.textSecondary} />
                    <Text style={[styles.compactInfoText, { color: colors.textSecondary }]}>{user.location}</Text>
                  </>
                )}
                {user.location && user.homeChurch && (
                  <Text style={[styles.separator, { color: colors.textSecondary }]}> | </Text>
                )}
                {user.homeChurch && (
                  <>
                    <Image
                      source={ChurchIcon}
                      style={{ width: 14, height: 14, tintColor: colors.textSecondary }}
                      resizeMode="contain"
                    />
                    <Text style={[styles.compactInfoText, { color: colors.textSecondary }]}>{user.homeChurch}</Text>
                  </>
                )}
              </View>
            )}

            {/* Bio */}
            {user.bio && <Text style={[styles.bio, { color: colors.textPrimary }]}>{user.bio}</Text>}

            {/* Bible Verse - Tappable */}
            {user.favoriteBibleVerse && (
              <Pressable
                onPress={handleVersePress}
                style={({ pressed }) => [
                  styles.bibleVerseCompact,
                  { backgroundColor: `${colors.surfaceMuted}80`, borderLeftColor: `${colors.primary}60` },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="book-outline" size={12} color={colors.textMuted} style={{ opacity: 0.7 }} />
                <Text style={[styles.bibleVerseText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {user.favoriteBibleVerse}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ opacity: 0.5 }} />
              </Pressable>
            )}

          </View>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <Pressable
                onPress={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                style={[
                  styles.followButton,
                  { backgroundColor: colors.primary },
                  followStatus?.isFollowing && [styles.followingButton, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }],
                ]}
              >
                {followMutation.isPending || unfollowMutation.isPending ? (
                  <ActivityIndicator size="small" color={followStatus?.isFollowing ? colors.textPrimary : colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      { color: colors.primaryForeground },
                      followStatus?.isFollowing && { color: colors.textPrimary },
                    ]}
                  >
                    {followStatus?.isFollowing ? 'Connected' : 'Connect'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.messageButton, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                onPress={handleMessage}
              >
                <Ionicons name="mail-outline" size={18} color={colors.textPrimary} />
              </Pressable>

              <Pressable
                style={[styles.messageButton, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                onPress={() => setShowUserMenu(true)}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
          <Pressable
            style={[styles.tab, activeTab === 'communities' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('communities')}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={activeTab === 'communities' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'communities' ? colors.primary : colors.textSecondary }]}>
              Communities
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'activity' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('activity')}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={activeTab === 'activity' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'activity' ? colors.primary : colors.textSecondary }]}>
              Activity
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {activeTab === 'communities' ? (
            <View style={styles.communitiesContainer}>
              {communities && communities.length > 0 ? (
                <View style={styles.communitiesGrid}>
                  {communities.map((community: any) => (
                    <Pressable
                      key={community.id}
                      style={styles.storyCircle}
                      onPress={() => router.push(`/communities/${community.id}`)}
                    >
                      <View style={[styles.storyImageContainer, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                        <View style={[styles.storyIconCircle, { backgroundColor: colors.surfaceMuted }]}>
                          <Ionicons
                            name={(community.iconName || 'people') as any}
                            size={32}
                            color={colors.primary}
                          />
                        </View>
                      </View>
                      <Text style={[styles.storyLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                        {community.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No communities yet</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.activityContainer}>
              {/* Loading state */}
              {isActivityLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : /* Check if activity is hidden by user preference */
              activityData?.activityHidden ? (
                <View style={styles.emptyState}>
                  <Ionicons name="eye-off-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Activity is hidden</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                    This user has chosen to hide their activity
                  </Text>
                </View>
              ) : /* Privacy check - show message if activity is private */
              activityData?.isPrivate && !activityData?.canViewActivity ? (
                <View style={styles.emptyState}>
                  <Ionicons name="lock-closed-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>This profile is private</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                    Connect with this user to see their activity
                  </Text>
                </View>
              ) : activityData?.activities && activityData.activities.length > 0 ? (
                activityData.activities.map((activity: any) => (
                  <Pressable
                    key={activity.id}
                    style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                    onPress={() => {
                      // Navigate to related content
                      if (activity.type === 'community_join' && activity.communityId) {
                        router.push(`/communities/${activity.communityId}`);
                      } else if (activity.type === 'event_rsvp' && activity.eventId) {
                        router.push(`/events/${activity.eventId}`);
                      } else if (activity.type === 'follow' && activity.userId) {
                        router.push(`/profile/${activity.userId}`);
                      }
                    }}
                  >
                    <View style={[styles.activityIconCircle, { backgroundColor: `${activity.iconColor}15` }]}>
                      <Ionicons name={activity.icon as any} size={18} color={activity.iconColor} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={[styles.activityText, { color: colors.textPrimary }]}>{activity.text}</Text>
                      <Text style={[styles.activityDate, { color: colors.textMuted }]}>
                        {formatActivityDate(new Date(activity.date))}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ opacity: 0.5 }} />
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent activity</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bible Verse Modal */}
      <Modal
        visible={showVerseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerseModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowVerseModal(false)}>
          <View
            style={[styles.verseModalContent, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.verseModalHeader}>
              <Ionicons name="book" size={20} color={colors.primary} />
              <Text style={[styles.verseModalTitle, { color: colors.textPrimary }]}>
                {versePassage?.reference || 'Favorite Verse'}
              </Text>
              <Pressable onPress={() => setShowVerseModal(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {verseLoading ? (
              <View style={styles.verseModalLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.verseModalLoadingText, { color: colors.textMuted }]}>Loading passage...</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.verseModalScroll} showsVerticalScrollIndicator nestedScrollEnabled>
                  <Text style={[styles.verseModalText, { color: colors.textPrimary }]}>
                    {versePassage?.text || user?.favoriteBibleVerse}
                  </Text>
                </ScrollView>
                {versePassage?.translation && (
                  <Text style={[styles.verseModalAttribution, { color: colors.textMuted }]}>
                    {versePassage.translation}
                  </Text>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* User Menu Modal (Block/Report) */}
      <Modal
        visible={showUserMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowUserMenu(false)}>
          <View
            style={[styles.userMenuContent, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <Pressable style={styles.userMenuItem} onPress={handleBlockUser}>
              <Ionicons name="ban-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.userMenuItemText, { color: colors.textPrimary }]}>Block User</Text>
            </Pressable>
            <View style={[styles.userMenuDivider, { backgroundColor: colors.borderSubtle }]} />
            <Pressable style={styles.userMenuItem} onPress={handleReportUser}>
              <Ionicons name="flag-outline" size={20} color="#EF4444" />
              <Text style={[styles.userMenuItemText, { color: '#EF4444' }]}>Report User</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  backButtonLarge: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 32,
  },
  profileHeader: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 24,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
  },
  denominationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  denominationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  topContributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  topContributorLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  compactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  compactInfoText: {
    fontSize: 12,
    marginLeft: 3,
  },
  separator: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  bio: {
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
  bibleVerseCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderLeftWidth: 1.5,
  },
  bibleVerseText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    opacity: 0.85,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  interestTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  interestTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  followButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  followingButton: {
    borderWidth: 1,
  },
  followButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  messageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    minHeight: 400,
  },
  communitiesContainer: {
    padding: 16,
  },
  communitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
  },
  storyCircle: {
    width: 80,
    alignItems: 'center',
    marginBottom: 8,
  },
  storyImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    borderWidth: 2,
    marginBottom: 6,
  },
  storyIconCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: {
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  activityContainer: {
    padding: 16,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  activityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  verseModalContent: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  verseModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  verseModalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  verseModalScroll: {
    maxHeight: 300,
  },
  verseModalText: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  verseModalAttribution: {
    fontSize: 12,
    marginTop: 16,
    textAlign: 'right',
    fontWeight: '500',
  },
  verseModalLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  verseModalLoadingText: {
    fontSize: 14,
  },
  // User menu styles
  userMenuContent: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  userMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  userMenuDivider: {
    height: 1,
    marginHorizontal: 8,
  },
});
