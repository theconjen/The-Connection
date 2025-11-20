/**
 * Community Detail Screen
 * Shows community info, wall posts, and member list
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesAPI } from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors } from '../../src/shared/colors';

interface WallPost {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
}

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  isPrivate?: boolean;
  isMember?: boolean;
}

export default function CommunityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'wall' | 'members'>('wall');
  const [newPostContent, setNewPostContent] = useState('');
  const [isPostInputVisible, setIsPostInputVisible] = useState(false);

  const communityId = parseInt(id || '0');

  // Fetch community details
  const { data: community, isLoading: communityLoading } = useQuery<Community>({
    queryKey: ['community', communityId],
    queryFn: () => communitiesAPI.getById(communityId),
    enabled: !!communityId,
  });

  // Fetch wall posts
  const { data: wallPosts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery<WallPost[]>({
    queryKey: ['community-wall', communityId],
    queryFn: () => communitiesAPI.getWallPosts(communityId),
    enabled: !!communityId && activeTab === 'wall',
  });

  // Fetch members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => communitiesAPI.getMembers(communityId),
    enabled: !!communityId && activeTab === 'members',
  });

  // Join/Leave mutations
  const joinMutation = useMutation({
    mutationFn: () => communitiesAPI.join(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      Alert.alert('Success', 'You have joined the community!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to join community');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => communitiesAPI.leave(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      Alert.alert('Success', 'You have left the community');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to leave community');
    },
  });

  // Create wall post mutation
  const createPostMutation = useMutation({
    mutationFn: (content: string) => communitiesAPI.createWallPost(communityId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-wall', communityId] });
      setNewPostContent('');
      setIsPostInputVisible(false);
      Alert.alert('Success', 'Your post has been shared!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create post');
    },
  });

  const handleJoinLeave = () => {
    if (community?.isMember) {
      Alert.alert(
        'Leave Community',
        `Are you sure you want to leave ${community.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => leaveMutation.mutate(),
          },
        ]
      );
    } else {
      joinMutation.mutate();
    }
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }

    if (newPostContent.trim().length < 5) {
      Alert.alert('Error', 'Post must be at least 5 characters long');
      return;
    }

    createPostMutation.mutate(newPostContent.trim());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (communityLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="Colors.primary" />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Community not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.communityName}>{community.name}</Text>
          <Text style={styles.memberCount}>{community.memberCount} members</Text>
        </View>
      </View>

      {/* Community Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.description} numberOfLines={2}>
          {community.description}
        </Text>
        <TouchableOpacity
          style={[
            styles.joinButton,
            community.isMember && styles.joinedButton,
          ]}
          onPress={handleJoinLeave}
          disabled={joinMutation.isPending || leaveMutation.isPending}
        >
          {joinMutation.isPending || leaveMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.joinButtonText}>
              {community.isMember ? 'Joined' : 'Join'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wall' && styles.activeTab]}
          onPress={() => setActiveTab('wall')}
        >
          <Text style={[styles.tabText, activeTab === 'wall' && styles.activeTabText]}>
            Wall
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Members
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={postsLoading || membersLoading}
            onRefresh={refetchPosts}
          />
        }
      >
        {activeTab === 'wall' && (
          <View style={styles.wallContent}>
            {/* Create Post Section */}
            {community.isMember && (
              <View style={styles.createPostSection}>
                {!isPostInputVisible ? (
                  <TouchableOpacity
                    style={styles.createPostPrompt}
                    onPress={() => setIsPostInputVisible(true)}
                  >
                    <Text style={styles.createPostPromptText}>
                      Share something with the community...
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.createPostForm}>
                    <TextInput
                      style={styles.postInput}
                      value={newPostContent}
                      onChangeText={setNewPostContent}
                      placeholder="What's on your mind?"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      autoFocus
                    />
                    <View style={styles.postActions}>
                      <TouchableOpacity
                        style={styles.cancelPostButton}
                        onPress={() => {
                          setIsPostInputVisible(false);
                          setNewPostContent('');
                        }}
                        disabled={createPostMutation.isPending}
                      >
                        <Text style={styles.cancelPostButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.submitPostButton,
                          createPostMutation.isPending && styles.submitPostButtonDisabled,
                        ]}
                        onPress={handleCreatePost}
                        disabled={createPostMutation.isPending}
                      >
                        {createPostMutation.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.submitPostButtonText}>Post</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Wall Posts */}
            {postsLoading ? (
              <ActivityIndicator size="large" color="Colors.primary" style={{ marginTop: 20 }} />
            ) : wallPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No posts yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  {community.isMember
                    ? 'Be the first to share something!'
                    : 'Join the community to see posts'}
                </Text>
              </View>
            ) : (
              wallPosts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={styles.authorInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {post.authorName?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.authorName}>{post.authorName}</Text>
                        <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.postContent}>{post.content}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'members' && (
          <View style={styles.membersContent}>
            {membersLoading ? (
              <ActivityIndicator size="large" color="Colors.primary" style={{ marginTop: 20 }} />
            ) : members.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No members yet</Text>
              </View>
            ) : (
              members.map((member: any) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {member.displayName?.charAt(0).toUpperCase() || member.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.displayName || member.username}
                    </Text>
                    {member.role && (
                      <Text style={styles.memberRole}>{member.role}</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backIcon: {
    padding: 8,
    marginRight: 12,
  },
  backIconText: {
    fontSize: 24,
    color: 'Colors.primary',
  },
  headerContent: {
    flex: 1,
  },
  communityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  memberCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  infoBanner: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: 'Colors.primary',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinedButton: {
    backgroundColor: '#10b981',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'Colors.primary',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: 'Colors.primary',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  wallContent: {
    padding: 16,
  },
  createPostSection: {
    marginBottom: 16,
  },
  createPostPrompt: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  createPostPromptText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  createPostForm: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  postInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelPostButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelPostButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  submitPostButton: {
    backgroundColor: 'Colors.primary',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  submitPostButtonDisabled: {
    opacity: 0.6,
  },
  submitPostButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  postHeader: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'Colors.primary',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  postTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  membersContent: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  memberRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: 'Colors.primary',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
