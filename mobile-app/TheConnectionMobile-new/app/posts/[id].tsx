/**
 * Post Detail with Comments
 * Matches feed card styling for consistency
 */

import React, { useState } from 'react';
import {
  View,
  Text,
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

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();
  const styles = getStyles(colors, colorScheme);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const postId = parseInt(id || '0');

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/posts/${postId}`);
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
    return postData?.author?.username || 'unknown';
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
                    {!post.isAnonymous && (
                      <>
                        <Text style={styles.postUsername}>
                          @{getAuthorUsername(post)}
                        </Text>
                        <Text style={styles.postDot}>·</Text>
                      </>
                    )}
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

                  {/* Post Actions */}
                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.postAction}>
                      <Ionicons name="heart-outline" size={20} color={colors.icon} />
                      <Text style={styles.postActionText}>{post.likeCount || 0}</Text>
                    </TouchableOpacity>
                    <View style={styles.postAction}>
                      <Ionicons name="chatbubble-outline" size={18} color={colors.icon} />
                      <Text style={styles.postActionText}>{comments?.length || 0}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Comments ({comments?.length || 0})</Text>

            {commentsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : !comments || comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.mutedForeground} />
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
                <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
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
                      {comment.author?.username && (
                        <>
                          <Text style={styles.postUsername}>@{comment.author.username}</Text>
                          <Text style={styles.postDot}>·</Text>
                        </>
                      )}
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
            placeholder="Write a comment..."
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
      backgroundColor: colors.surface
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 60,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
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
      color: colors.text
    },
    content: {
      flex: 1
    },
    postSection: {
      backgroundColor: colors.surface,
      borderBottomWidth: 8,
      borderBottomColor: colors.muted
    },
    postContainer: {
      flexDirection: 'row',
      padding: 16,
    },
    postAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.borderLight,
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
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginRight: 4,
    },
    postUsername: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 4,
    },
    postDot: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 4,
    },
    postTime: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    postTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
      marginBottom: 8,
      lineHeight: 24,
    },
    postContent: {
      fontSize: 15,
      color: colors.text,
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
      borderTopColor: colors.border,
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
      backgroundColor: colors.surface
    },
    commentsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16
    },
    emptyComments: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyCommentsText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    emptyCommentsSubtext: {
      marginTop: 4,
      fontSize: 14,
      color: colors.textSecondary,
    },
    commentCard: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.borderLight,
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
      color: colors.text,
      marginRight: 4,
    },
    commentContent: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 12,
      paddingBottom: Platform.OS === 'ios' ? 34 : 12,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'flex-end',
    },
    inputAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.borderLight,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      maxHeight: 100,
      marginHorizontal: 12,
      color: colors.text,
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
