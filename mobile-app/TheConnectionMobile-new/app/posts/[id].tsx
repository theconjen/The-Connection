/**
 * Post Detail with Comments
 * Matches feed card styling for consistency
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import apiClient from '../../src/lib/apiClient';
import { Text } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

// Get avatar URL with fallback to UI Avatars
function getAvatarUrl(author?: any): string {
  if (!author) return 'https://ui-avatars.com/api/?name=U&background=222D99&color=fff';
  const url = author.profileImageUrl || author.avatarUrl;
  if (url) return url;
  const name = author.displayName || author.username || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=222D99&color=fff`;
}

// Generate contextual prompt for empty comments based on post content
function getContextualPrompt(post: any): string {
  const content = (post?.content || post?.title || '').toLowerCase();

  // Check for common themes and return invitational prompts
  if (content.includes('forgiv') || content.includes('grudge')) {
    return 'How have you wrestled with forgiveness?';
  }
  if (content.includes('pray') || content.includes('prayer')) {
    return 'How can you encourage?';
  }
  if (content.includes('question') || content.includes('?')) {
    return 'What are your thoughts on this?';
  }
  if (content.includes('struggl') || content.includes('challeng') || content.includes('difficult')) {
    return 'Have you experienced something similar?';
  }
  if (content.includes('grateful') || content.includes('thankful') || content.includes('bless')) {
    return 'What are you grateful for today?';
  }
  if (content.includes('sermon') || content.includes('pastor') || content.includes('preach') || content.includes('service')) {
    return 'What stood out to you from this message?';
  }
  if (content.includes('scripture') || content.includes('verse') || content.includes('bible')) {
    return 'How has this passage spoken to you?';
  }

  // Default invitational prompts
  const defaults = [
    'What thoughts does this bring to mind?',
    'How does this resonate with you?',
    'What would you add to this conversation?',
  ];
  // Use post id to deterministically pick a default
  return defaults[(post?.id || 0) % defaults.length];
}

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const postId = parseInt(id || '0');

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/posts/${postId}`);
      console.info('[Post Detail] API response:', response.data);
      return response.data;
    },
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/posts/${postId}/comments`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching post comments:', error);
        return [];
      }
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(`/api/posts/${postId}/comments`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      setCommentText('');
      Alert.alert('Success', 'Comment added!');
    },
  });

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  const formatTime = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getAuthorName = (postData: any): string => {
    if (postData?.isAnonymous) return 'Anonymous';
    return postData?.author?.displayName ||
           postData?.author?.username ||
           postData?.authorName ||
           'Unknown User';
  };

  const getAuthorUsername = (postData: any): string => {
    return postData?.author?.username || '';
  };

  if (postLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {post && (
            <View style={styles.postSection}>
              {/* Post Header - Matches Feed Card Style */}
              <View style={styles.postContainer}>
                <Image
                  source={{ uri: getAvatarUrl(post.author) }}
                  style={styles.postAvatar}
                />
                <View style={styles.postMain}>
                  <View style={styles.postHeaderRow}>
                    <Text style={styles.postAuthorName}>
                      {getAuthorName(post)}
                    </Text>
                    <Text style={styles.postDot}>·</Text>
                    <Text style={styles.postTime}>
                      {post.createdAt ? formatTime(post.createdAt) : 'Recently'}
                    </Text>
                  </View>

                  {/* Post Title */}
                  {post.title && (
                    <Text style={styles.postTitle}>{post.title}</Text>
                  )}

                  {/* Post Content */}
                  {post.content && (
                    <Text style={styles.postContent}>{post.content}</Text>
                  )}

                  {/* Anonymous Badge */}
                  {post.isAnonymous && (
                    <View style={styles.anonymousBadge}>
                      <Text style={styles.anonymousBadgeText}>Anonymous</Text>
                    </View>
                  )}

                  {/* Post Actions - hide zeros */}
                  <View style={styles.postActions}>
                    <TouchableOpacity style={[styles.postAction, (post.likeCount || post.upvotes || 0) === 0 && { opacity: 0.5 }]}>
                      <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
                      {(post.likeCount || post.upvotes || 0) > 0 && (
                        <Text style={styles.postActionText}>{post.likeCount || post.upvotes}</Text>
                      )}
                    </TouchableOpacity>
                    <View style={[styles.postAction, (comments?.length || 0) === 0 && { opacity: 0.5 }]}>
                      <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
                      {(comments?.length || 0) > 0 && (
                        <Text style={styles.postActionText}>{comments?.length}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              {(comments?.length || 0) > 0 ? `Responses (${comments.length})` : 'Join the discussion'}
            </Text>

            {commentsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : !comments || comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.textMuted || colors.textSecondary} style={{ opacity: 0.6 }} />
                {/* Author context */}
                {post && !post.isAnonymous && getAuthorName(post) !== 'Unknown User' && (
                  <Text style={styles.emptyCommentsAuthor}>
                    {getAuthorName(post)} shared:
                  </Text>
                )}
                {/* Contextual prompt */}
                <Text style={styles.emptyCommentsPrompt}>
                  {getContextualPrompt(post)}
                </Text>
                <Text style={styles.emptyCommentsSubtext}>
                  Your perspective matters here.
                </Text>
              </View>
            ) : (
              comments.map((comment: any) => (
                <View key={comment.id} style={styles.commentCard}>
                  <Image
                    source={{ uri: getAvatarUrl(comment.author) }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentMain}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthorName}>
                        {comment.author?.displayName || comment.author?.username || comment.authorName || 'User'}
                      </Text>
                      <Text style={styles.postDot}>·</Text>
                      {comment.createdAt && (
                        <Text style={styles.postTime}>{formatTime(comment.createdAt)}</Text>
                      )}
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <Image source={{ uri: getAvatarUrl(user) }} style={styles.inputAvatar} />
          <TextInput
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Share a thought..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}
            onPress={handleComment}
            disabled={!commentText.trim() || commentMutation.isPending}
          >
            {commentMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, theme: string) => {
  const isDark = theme === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface || colors.background
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface || colors.background
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 60,
      backgroundColor: colors.surface || colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle || colors.border
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary || colors.text
    },
    content: {
      flex: 1
    },
    postSection: {
      backgroundColor: colors.surface || colors.background,
      borderBottomWidth: 8,
      borderBottomColor: colors.surfaceMuted || colors.muted
    },
    postContainer: {
      flexDirection: 'row',
      padding: 16,
    },
    postAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.borderLight || colors.muted,
    },
    postMain: {
      flex: 1,
      marginLeft: 12,
    },
    postHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 4,
    },
    postAuthorName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary || colors.text,
      marginRight: 4,
    },
    postUsername: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 4,
    },
    postUsernameSecondary: {
      fontSize: 13,
      color: colors.textMuted || colors.textSecondary,
      marginTop: 2,
      marginBottom: 4,
    },
    postDot: {
      fontSize: 12,
      color: colors.textMuted || colors.textSecondary,
      marginHorizontal: 4,
      opacity: 0.6,
    },
    postTime: {
      fontSize: 12,
      color: colors.textMuted || colors.textSecondary,
      opacity: 0.7,
    },
    postTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary || colors.text,
      marginTop: 8,
      marginBottom: 8,
      lineHeight: 24,
    },
    postContent: {
      fontSize: 15,
      color: colors.textPrimary || colors.text,
      lineHeight: 22,
      marginTop: 4,
    },
    anonymousBadge: {
      backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginTop: 12,
      borderWidth: 1,
      borderColor: isDark ? '#2563EB' : '#BFDBFE',
    },
    anonymousBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#60A5FA' : '#1E40AF',
    },
    postActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle || colors.border,
    },
    postAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    postActionText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    commentsSection: {
      padding: 16,
      backgroundColor: colors.surface || colors.background
    },
    commentsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary || colors.text,
      marginBottom: 16
    },
    emptyComments: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
    },
    emptyCommentsAuthor: {
      marginTop: 16,
      fontSize: 13,
      color: colors.textMuted || colors.textSecondary,
      fontWeight: '500',
    },
    emptyCommentsPrompt: {
      marginTop: 8,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary || colors.text,
      textAlign: 'center',
      lineHeight: 24,
    },
    emptyCommentsSubtext: {
      marginTop: 8,
      fontSize: 14,
      color: colors.textMuted || colors.textSecondary,
      fontStyle: 'italic',
    },
    commentCard: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle || colors.border,
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.borderLight || colors.muted,
    },
    commentMain: {
      flex: 1,
      marginLeft: 12,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 4,
    },
    commentAuthorName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary || colors.text,
      marginRight: 4,
    },
    commentContent: {
      fontSize: 14,
      color: colors.textPrimary || colors.text,
      lineHeight: 20,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 12,
      paddingBottom: Platform.OS === 'ios' ? 34 : 12,
      backgroundColor: colors.surface || colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle || colors.border,
      alignItems: 'flex-end',
    },
    inputAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.borderLight || colors.muted,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceMuted || colors.muted,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      maxHeight: 100,
      marginHorizontal: 12,
      color: colors.textPrimary || colors.text,
    },
    postButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    postButtonDisabled: {
      opacity: 0.5,
    },
  });
};
