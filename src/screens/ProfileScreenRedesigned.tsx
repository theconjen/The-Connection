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
import * as FileSystem from 'expo-file-system';
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
  const { colors, spacing, radii } = useTheme();
  const { user: currentUser } = useAuth();
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
      console.log('[ProfileScreen] Profile data received:', JSON.stringify(profile, null, 2));
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
    await refetch();
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
          encoding: FileSystem.EncodingType.Base64,
        });

        // Get the file extension to determine mime type
        const extension = asset.uri.split('.').pop()?.toLowerCase();
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
        const base64data = `data:${mimeType};base64,${base64}`;

        // Show loading indicator
        Alert.alert('Uploading', 'Updating profile picture...');

        // Upload to server using apiClient
        const apiClient = (await import('../lib/apiClient')).default;
        const response = await apiClient.patch('/user/profile', {
          avatarUrl: base64data,
        });

        // Refresh profile data
        await refetch();
        Alert.alert('Success', 'Profile picture updated!');
      } catch (error) {
        console.error('Error updating avatar:', error);
        Alert.alert('Error', 'Failed to update profile picture. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="dark-content" />
        <PageHeader title="Profile" onBackPress={onBackPress} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="dark-content" />
        <PageHeader title="Profile" onBackPress={onBackPress} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { user, stats, communities, recentPosts } = profile;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

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
              <Ionicons name="settings-outline" size={24} color={colors.foreground} />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Header - Instagram Style */}
        <View style={styles.header}>
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
                  <Text style={styles.avatarText}>
                    {getInitials(user.displayName || user.username)}
                  </Text>
                </View>
              )}
              {viewingOwnProfile && (
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              )}
            </Pressable>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.postsCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <Pressable style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </Pressable>
              <Pressable style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </Pressable>
            </View>
          </View>

          {/* Name and Username */}
          <View style={styles.infoSection}>
            {/* Name with denomination badge */}
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>
                {user.displayName || user.username}
              </Text>
              {user.denomination && (
                <View style={styles.denominationBadge}>
                  <Text style={styles.denominationText}>{user.denomination}</Text>
                </View>
              )}
            </View>

            <Text style={styles.username}>@{user.username}</Text>

            {/* Compact location & church info */}
            {(user.location || user.homeChurch) && (
              <View style={styles.compactInfoRow}>
                {user.location && (
                  <>
                    <Ionicons name="location" size={12} color="#6b7280" />
                    <Text style={styles.compactInfoText}>{user.location}</Text>
                  </>
                )}
                {user.location && user.homeChurch && (
                  <Text style={styles.separator}> | </Text>
                )}
                {user.homeChurch && (
                  <>
                    <Ionicons name="business" size={12} color="#6b7280" />
                    <Text style={styles.compactInfoText}>{user.homeChurch}</Text>
                  </>
                )}
              </View>
            )}

            {/* Bio */}
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

            {/* Bible Verse - Compact version */}
            {user.favoriteBibleVerse && (
              <View style={styles.bibleVerseCompact}>
                <Ionicons name="book" size={14} color={Colors.primary} />
                <Text style={styles.bibleVerseText}>{user.favoriteBibleVerse}</Text>
              </View>
            )}

            {/* Interests as tags */}
            {user.interests && (
              <View style={styles.interestTags}>
                {user.interests.split(',').slice(0, 5).map((interest: string, index: number) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestTagText}>{interest.trim()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {viewingOwnProfile ? (
              <Pressable
                style={styles.editProfileButton}
                onPress={() => router.push('/edit-profile')}
              >
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleFollow}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                style={[
                  styles.followButton,
                  followStatus?.isFollowing && styles.followingButton,
                ]}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    followStatus?.isFollowing && styles.followingButtonText,
                  ]}
                >
                  {followStatus?.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={activeTab === 'posts' ? Colors.primary : '#6b7280'}
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
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
              color={activeTab === 'communities' ? Colors.primary : '#6b7280'}
            />
            <Text
              style={[styles.tabText, activeTab === 'communities' && styles.activeTabText]}
            >
              Communities
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'posts' && (
            <View style={styles.postsContainer}>
              {recentPosts && recentPosts.length > 0 ? (
                recentPosts.map((post: any) => (
                  <View key={post.id} style={styles.postCard}>
                    <Text style={styles.postTitle}>{post.title}</Text>
                    <Text style={styles.postContent} numberOfLines={3}>
                      {post.content}
                    </Text>
                    <View style={styles.postFooter}>
                      <Text style={styles.postMeta}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Text>
                      <Text style={styles.postMeta}>•</Text>
                      <Text style={styles.postMeta}>{post.upvotes || 0} upvotes</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyText}>No posts yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'communities' && (
            <View style={styles.communitiesContainer}>
              {communities && communities.length > 0 ? (
                <View style={styles.communitiesGrid}>
                  {communities.map((community: any) => (
                    <Pressable key={community.id} style={styles.storyCircle}>
                      <View style={styles.storyImageContainer}>
                        <View style={styles.storyIconCircle}>
                          <Ionicons
                            name={community.iconName as any}
                            size={32}
                            color={Colors.primary}
                          />
                        </View>
                      </View>
                      <Text style={styles.storyLabel} numberOfLines={1}>
                        {community.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyText}>No communities yet</Text>
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
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    backgroundColor: '#f3f4f6',
  },
  avatarText: {
    color: '#fff',
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
    borderColor: '#fff',
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
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
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
    color: '#1f2937',
  },
  denominationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  denominationText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  username: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#6b7280',
    marginLeft: 3,
  },
  separator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 4,
  },
  bio: {
    fontSize: 14,
    color: '#374151',
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
    backgroundColor: '#FEFCE8',
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#EAB308',
  },
  bibleVerseText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    color: '#713F12',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  interestTagText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  actionButtons: {
    gap: 8,
  },
  editProfileButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#1f2937',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
    color: '#1f2937',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    backgroundColor: '#f9fafb',
    minHeight: 400,
  },
  postsContainer: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#9ca3af',
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
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 6,
  },
  storyIconCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: {
    fontSize: 12,
    color: '#374151',
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
    color: '#9ca3af',
    marginTop: 12,
  },
});

export default ProfileScreenRedesigned;
