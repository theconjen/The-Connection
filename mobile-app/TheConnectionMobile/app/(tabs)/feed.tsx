/**
 * Feed Screen - Microblogs/Posts
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI } from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';

interface Post {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  upvotesCount: number;
  isUpvoted?: boolean;
  commentsCount?: number;
}

export default function FeedScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState('');
  const [isPostInputVisible, setIsPostInputVisible] = useState(false);

  const { data: posts = [], isLoading, refetch } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: postsAPI.getAll,
  });

  const createPostMutation = useMutation({
    mutationFn: (content: string) => postsAPI.create({ content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setNewPostContent('');
      setIsPostInputVisible(false);
      Alert.alert('Success', 'Post shared!');
    },
    onError: () => Alert.alert('Error', 'Failed to create post'),
  });

  const upvoteMutation = useMutation({
    mutationFn: (postId: number) => postsAPI.upvote(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Post cannot be empty');
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
    if (diffInMins < 60) return `${diffInMins}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Create Post */}
        <View style={styles.createSection}>
          {!isPostInputVisible ? (
            <TouchableOpacity
              style={styles.createPrompt}
              onPress={() => setIsPostInputVisible(true)}
            >
              <Text style={styles.createPromptText}>Share something...</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.createForm}>
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
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsPostInputVisible(false);
                    setNewPostContent('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCreatePost}
                  disabled={createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No posts yet</Text>
            <Text style={styles.emptyStateSubtext}>Be the first to share!</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {post.authorName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.postMeta}>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              <View style={styles.postFooter}>
                <TouchableOpacity
                  style={styles.upvoteButton}
                  onPress={() => upvoteMutation.mutate(post.id)}
                  disabled={upvoteMutation.isPending}
                >
                  <Text style={[styles.upvoteIcon, post.isUpvoted && styles.upvoted]}>
                    {post.isUpvoted ? '▲' : '△'}
                  </Text>
                  <Text style={styles.upvoteCount}>{post.upvotesCount || 0}</Text>
                </TouchableOpacity>
                {post.commentsCount !== undefined && (
                  <Text style={styles.commentsCount}>
                    {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
                  </Text>
                )}
              </View>
            </View>
          ))
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
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  createSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  createPrompt: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
  },
  createPromptText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  createForm: {
    backgroundColor: '#fff',
  },
  postInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postMeta: {
    flex: 1,
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
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  upvoteIcon: {
    fontSize: 16,
    color: '#9ca3af',
    marginRight: 4,
  },
  upvoted: {
    color: '#8b5cf6',
  },
  upvoteCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  commentsCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
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
  },
});
