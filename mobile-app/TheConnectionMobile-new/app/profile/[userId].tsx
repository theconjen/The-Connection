/**
 * User Profile Screen - View other users' profiles and follow/unfollow
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';

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
    interests?: string[];
  };
  stats: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
    communitiesCount: number;
  };
  communities?: any[];
  recentPosts?: any[];
  recentMicroblogs?: any[];
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'communities'>('posts');

  const userIdNum = parseInt(userId || '0');
  const isOwnProfile = currentUser?.id === userIdNum;

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['userProfile', userIdNum],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${userIdNum}/profile`);
      return response.data;
    },
    enabled: !!userIdNum,
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
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { user, stats } = profile;
  const displayName = user.displayName || user.username;
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          {user.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
          )}

          {/* Name and Username */}
          <Text style={[styles.displayName, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>@{user.username}</Text>

          {/* Bio */}
          {user.bio && (
            <Text style={[styles.bio, { color: colors.textPrimary }]}>{user.bio}</Text>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.followersCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.postsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.communitiesCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Communities</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  {
                    backgroundColor: followStatus?.isFollowing ? colors.surface : colors.primary,
                    borderColor: colors.borderSubtle,
                    borderWidth: followStatus?.isFollowing ? 1 : 0,
                  },
                ]}
                onPress={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
              >
                {followMutation.isPending || unfollowMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      { color: followStatus?.isFollowing ? colors.textPrimary : '#fff' },
                    ]}
                  >
                    {followStatus?.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                onPress={handleMessage}
              >
                <Ionicons name="mail-outline" size={20} color={colors.textPrimary} />
                <Text style={[styles.messageButtonText, { color: colors.textPrimary }]}>Message</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Additional Info */}
          {(user.location || user.denomination || user.homeChurch) && (
            <View style={[styles.infoSection, { borderTopColor: colors.borderSubtle }]}>
              {user.location && (
                <View style={styles.infoItem}>
                  <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textPrimary }]}>{user.location}</Text>
                </View>
              )}
              {user.denomination && (
                <View style={styles.infoItem}>
                  <Ionicons name="book-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textPrimary }]}>{user.denomination}</Text>
                </View>
              )}
              {user.homeChurch && (
                <View style={styles.infoItem}>
                  <Ionicons name="business-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textPrimary }]}>{user.homeChurch}</Text>
                </View>
              )}
            </View>
          )}

          {/* Favorite Bible Verse */}
          {user.favoriteBibleVerse && (
            <View style={[styles.verseContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <Ionicons name="book" size={20} color={colors.primary} />
              <Text style={[styles.verseText, { color: colors.textPrimary }]}>"{user.favoriteBibleVerse}"</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'posts' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('posts')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'posts' ? colors.primary : colors.textSecondary },
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'communities' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('communities')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'communities' ? colors.primary : colors.textSecondary },
              ]}
            >
              Communities
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'posts' ? (
            profile.recentPosts && profile.recentPosts.length > 0 ? (
              profile.recentPosts.map((post: any) => (
                <View
                  key={post.id}
                  style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                >
                  <Text style={[styles.postTitle, { color: colors.textPrimary }]}>{post.title}</Text>
                  <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={3}>
                    {post.content}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts yet</Text>
              </View>
            )
          ) : (
            profile.communities && profile.communities.length > 0 ? (
              profile.communities.map((community: any) => (
                <View
                  key={community.id}
                  style={[styles.communityCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                >
                  <Ionicons name="people" size={24} color={colors.primary} />
                  <View style={styles.communityInfo}>
                    <Text style={[styles.communityName, { color: colors.textPrimary }]}>{community.name}</Text>
                    <Text style={[styles.communityMembers, { color: colors.textSecondary }]}>
                      {community.memberCount} members
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No communities yet</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
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
  backButton: {
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
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '600',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  followButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 15,
  },
  verseContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  verseText: {
    flex: 1,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  postCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  communityMembers: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
