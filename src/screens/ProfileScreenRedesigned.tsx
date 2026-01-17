/**
 * Redesigned ProfileScreen - Modern profile with tabs, follow system, communities, and posts
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { Text } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from './AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  useUserProfile,
  useFollowUser,
  useUnfollowUser,
  useFollowStatus,
} from '../queries/follow';
import { Colors } from '../shared/colors';

interface ProfileScreenProps {
  onBackPress?: () => void;
  userId?: number; // If provided, show another user's profile; otherwise show current user's
}

export function ProfileScreenRedesigned({ onBackPress, userId }: ProfileScreenProps) {
  const { colors, spacing, radii, colorScheme } = useTheme();
  const { user: currentUser, refresh: refreshAuth } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'communities'>('posts');
  const [refreshing, setRefreshing] = useState(false);

  // Determine if viewing own profile
  const viewingOwnProfile = !userId || userId === currentUser?.id;
  const targetUserId = userId || currentUser?.id || 0;


  // Fetch user profile data
  const { data: profile, isLoading, error, refetch } = useUserProfile(targetUserId);
  const { data: followStatus } = useFollowStatus(targetUserId);

  // Debug logging
  React.useEffect(() => {
    if (profile) {
      console.log('[ProfileScreen] User fields:', {
        location: profile.user?.location,
        denomination: profile.user?.denomination,
        homeChurch: profile.user?.homeChurch,
        favoriteBibleVerse: profile.user?.favoriteBibleVerse,
        testimony: profile.user?.testimony,
        interests: profile.user?.interests,
      });
    }
  }, [profile]);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleFollow = () => {
    if (followStatus?.isFollowing) {
      unfollowMutation.mutate(targetUserId);
    } else {
      followMutation.mutate(targetUserId);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),        // Refresh local profile query
      refreshAuth(),    // Refresh global user state
    ]);
    setRefreshing(false);
  };

  const handleAvatarChange = async () => {
    if (!viewingOwnProfile) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to change your avatar');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Reduce quality to keep file size manageable
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const asset = result.assets[0];

        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });

        // Get the file extension to determine mime type
        const extension = asset.uri.split('.').pop()?.toLowerCase();
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
        const base64data = `data:${mimeType};base64,${base64}`;

        // Show loading indicator
        Alert.alert('Uploading', 'Updating profile picture...');

        // Upload to server using apiClient
        const apiClient = (await import('../lib/apiClient')).default;
        const response = await apiClient.patch('/api/user/profile', {
          avatarUrl: base64data,
        });

        // Refresh both local profile data AND global auth context
        await Promise.all([
          refetch(),        // Refresh local profile query
          refreshAuth(),    // Refresh global user state (updates avatars everywhere)
        ]);
        Alert.alert('Success', 'Profile picture updated!');
      } catch (error) {
        console.error('Error updating avatar:', error);
        Alert.alert('Error', 'Failed to update profile picture. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }}>
        <StatusBar barStyle="light-content" />
        <PageHeader title="Profile" onBackPress={onBackPress} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }}>
        <StatusBar barStyle="light-content" />
        <PageHeader title="Profile" onBackPress={onBackPress} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { user, stats, communities, recentPosts, recentMicroblogs } = profile;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }}>
      <StatusBar barStyle="light-content" />

      <PageHeader
        title="Profile"
        onBackPress={onBackPress}
        rightElement={
          viewingOwnProfile ? (
            <Pressable
              onPress={() => {
                // Navigate to edit profile
              }}
              style={({ pressed }) => ({
                padding: spacing.sm,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Header - Instagram Style */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {/* Top Row: Avatar + Stats */}
          <View style={styles.topRow}>
            {/* Avatar */}
            <Pressable
              style={styles.avatarContainer}
              onPress={handleAvatarChange}
              disabled={!viewingOwnProfile}
            >
              {user.profileImageUrl ? (
                <Image
                  source={{ uri: user.profileImageUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                    {getInitials(user.displayName || user.username)}
                  </Text>
                </View>
              )}
              {viewingOwnProfile && (
                <View style={[styles.avatarEditBadge, { borderColor: colors.surface }]}>
                  <Ionicons name="camera" size={14} color={colors.primaryForeground} />
                </View>
              )}
            </Pressable>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.text }]}>{stats.postsCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
              </View>
              <Pressable style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.text }]}>{stats.followersCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
              </Pressable>
              <Pressable style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.text }]}>{stats.followingCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
              </Pressable>
            </View>
          </View>

          {/* Name and Username */}
          <View style={styles.infoSection}>
            {/* Name with denomination badge */}
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: colors.text }]}>
                {user.displayName || user.username}
              </Text>
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
                    <Ionicons name="business" size={12} color={colors.textSecondary} />
                    <Text style={[styles.compactInfoText, { color: colors.textSecondary }]}>{user.homeChurch}</Text>
                  </>
                )}
              </View>
            )}

            {/* Bio */}
            {user.bio && <Text style={[styles.bio, { color: colors.text }]}>{user.bio}</Text>}

            {/* Bible Verse - Compact version */}
            {user.favoriteBibleVerse && (
              <View style={[styles.bibleVerseCompact, { backgroundColor: `${Colors.primary}10`, borderLeftColor: Colors.primary }]}>
                <Ionicons name="book" size={14} color={Colors.primary} />
                <Text style={[styles.bibleVerseText, { color: colors.text }]}>{user.favoriteBibleVerse}</Text>
              </View>
            )}

            {/* Interests as tags */}
            {user.interests && (
              <View style={styles.interestTags}>
                {user.interests.split(',').slice(0, 5).map((interest: string, index: number) => (
                  <View key={index} style={[styles.interestTag, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.interestTagText, { color: colors.textSecondary }]}>{interest.trim()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {viewingOwnProfile ? (
              <Pressable
                style={[styles.editProfileButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push('/edit-profile')}
              >
                <Text style={[styles.editProfileButtonText, { color: colors.text }]}>Edit Profile</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleFollow}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                style={[
                  styles.followButton,
                  followStatus?.isFollowing && [styles.followingButton, { backgroundColor: colors.surface, borderColor: colors.border }],
                ]}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    { color: colors.primaryForeground },
                    followStatus?.isFollowing && [styles.followingButtonText, { color: colors.text }],
                  ]}
                >
                  {followStatus?.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={activeTab === 'posts' ? Colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'posts' && styles.activeTabText]}>
              Posts
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'communities' && styles.activeTab]}
            onPress={() => setActiveTab('communities')}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={activeTab === 'communities' ? Colors.primary : colors.textSecondary}
            />
            <Text
              style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'communities' && styles.activeTabText]}
            >
              Communities
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {activeTab === 'posts' && (
            <View style={styles.postsContainer}>
              {/* Show microblogs (feed posts) */}
              {recentMicroblogs && recentMicroblogs.length > 0 ? (
                recentMicroblogs.map((microblog: any) => (
                  <View key={`microblog-${microblog.id}`} style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.postContent, { color: colors.text }]} numberOfLines={4}>
                      {microblog.content}
                    </Text>
                    <View style={styles.postFooter}>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                        {new Date(microblog.createdAt).toLocaleDateString()}
                      </Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>•</Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                        {microblog.likeCount || 0} likes
                      </Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>•</Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                        {microblog.replyCount || 0} comments
                      </Text>
                    </View>
                  </View>
                ))
              ) : recentPosts && recentPosts.length > 0 ? (
                // Show forum posts if no microblogs
                recentPosts.map((post: any) => (
                  <View key={`post-${post.id}`} style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.postTitle, { color: colors.text }]}>{post.title}</Text>
                    <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={3}>
                      {post.content}
                    </Text>
                    <View style={styles.postFooter}>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>•</Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>{post.upvotes || 0} upvotes</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'communities' && (
            <View style={styles.communitiesContainer}>
              {communities && communities.length > 0 ? (
                <View style={styles.communitiesGrid}>
                  {communities.map((community: any) => (
                    <Pressable
                      key={community.id}
                      style={styles.storyCircle}
                      onPress={() => router.push(`/communities/${community.id}`)}
                    >
                      <View style={[styles.storyImageContainer, { backgroundColor: colors.surface }]}>
                        <View style={[styles.storyIconCircle, { backgroundColor: colors.muted }]}>
                          <Ionicons
                            name={community.iconName as any}
                            size={32}
                            color={Colors.primary}
                          />
                        </View>
                      </View>
                      <Text style={[styles.storyLabel, { color: colors.text }]} numberOfLines={1}>
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
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
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
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 86,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderLeftWidth: 2,
  },
  bibleVerseText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
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
    gap: 8,
  },
  editProfileButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  editProfileButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  followButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  followingButton: {
    borderWidth: 1,
  },
  followButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
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
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    minHeight: 400,
  },
  postsContainer: {
    padding: 16,
  },
  postCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postMeta: {
    fontSize: 12,
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
    borderColor: Colors.primary,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});

export default ProfileScreenRedesigned;
