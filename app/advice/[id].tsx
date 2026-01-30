/**
 * Advice Post Detail Screen
 * Shows community advice questions with responses (forum-like)
 * Uses upvote instead of like for community-driven engagement
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
  Pressable,
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
  const content = (post?.content || '').toLowerCase();

  if (content.includes('how do you') || content.includes('tips for') || content.includes('any advice')) {
    return 'Share your experience or advice';
  }
  if (content.includes('pray') || content.includes('prayer')) {
    return 'How can you encourage?';
  }
  if (content.includes('?')) {
    return 'What are your thoughts on this?';
  }
  if (content.includes('struggl') || content.includes('challeng') || content.includes('difficult')) {
    return 'Have you experienced something similar?';
  }

  const defaults = [
    'Share your perspective',
    'How would you respond?',
    'What wisdom would you offer?',
  ];
  return defaults[(post?.id || 0) % defaults.length];
}

export default function AdviceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const adviceId = parseInt(id || '0');

  // Fetch advice post (stored as microblog with topic=QUESTION)
  const { data: advicePost, isLoading: adviceLoading } = useQuery({
    queryKey: ['advice', adviceId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/microblogs/${adviceId}`);
      return response.data;
    },
  });

  // Fetch responses
  const { data: responses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ['advice-responses', adviceId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/microblogs/${adviceId}/comments`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching advice responses:', error);
        return [];
      }
    },
  });

  // Add response mutation
  const responseMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(`/api/microblogs/${adviceId}/comments`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advice-responses', adviceId] });
      queryClient.invalidateQueries({ queryKey: ['advice', adviceId] });
      queryClient.invalidateQueries({ queryKey: ['advice-posts'] });
      setCommentText('');
    },
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const isUpvoted = advicePost?.isLiked;
      if (isUpvoted) {
        await apiClient.delete(`/api/microblogs/${adviceId}/like`);
      } else {
        await apiClient.post(`/api/microblogs/${adviceId}/like`);
      }
      return !isUpvoted;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['advice', adviceId] });
      const previous = queryClient.getQueryData(['advice', adviceId]);
      queryClient.setQueryData(['advice', adviceId], (old: any) => ({
        ...old,
        isLiked: !old?.isLiked,
        likeCount: (old?.likeCount || 0) + (old?.isLiked ? -1 : 1),
      }));
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['advice', adviceId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['advice', adviceId] });
      queryClient.invalidateQueries({ queryKey: ['advice-posts'] });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const isBookmarked = advicePost?.isBookmarked;
      if (isBookmarked) {
        await apiClient.delete(`/api/microblogs/${adviceId}/bookmark`);
      } else {
        await apiClient.post(`/api/microblogs/${adviceId}/bookmark`);
      }
      return !isBookmarked;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['advice', adviceId] });
      const previous = queryClient.getQueryData(['advice', adviceId]);
      queryClient.setQueryData(['advice', adviceId], (old: any) => ({
        ...old,
        isBookmarked: !old?.isBookmarked,
      }));
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['advice', adviceId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['advice', adviceId] });
    },
  });

  const handleSubmitResponse = () => {
    if (!commentText.trim()) return;
    responseMutation.mutate(commentText.trim());
  };

  const formatTime = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getAuthorName = (data: any): string => {
    if (data?.isAnonymous) return 'Anonymous';
    return data?.author?.displayName ||
           data?.author?.username ||
           data?.authorName ||
           'Unknown User';
  };

  if (adviceLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isUpvoted = advicePost?.isLiked || false;
  const isBookmarked = advicePost?.isBookmarked || false;
  const upvoteCount = advicePost?.likeCount || 0;
  const responseCount = responses?.length || advicePost?.commentCount || 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/advice')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Advice</Text>
          <Pressable onPress={() => bookmarkMutation.mutate()} hitSlop={8} style={styles.headerBookmark}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isBookmarked ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {advicePost && (
            <View style={styles.postSection}>
              {/* Question Card - Anonymous with optional nickname */}
              <View style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <View style={[styles.anonymousAvatar, { backgroundColor: colors.surfaceMuted }]}>
                    <Ionicons name="person" size={20} color={colors.textMuted} />
                  </View>
                  <View style={styles.authorInfo}>
                    <Text style={[styles.postAuthorName, { color: colors.textSecondary }]}>
                      {advicePost.anonymousNickname || 'Anonymous'}
                    </Text>
                    <Text style={styles.postTime}>
                      {advicePost.createdAt ? formatTime(advicePost.createdAt) : 'Recently'}
                    </Text>
                  </View>
                </View>

                {/* Topic Badge */}
                <View style={styles.topicBadge}>
                  <Ionicons name="help-circle" size={14} color="#EC4899" />
                  <Text style={styles.topicBadgeText}>Seeking Advice</Text>
                </View>

                {/* Content */}
                <Text style={styles.postContent}>{advicePost.content}</Text>

                {/* Tags */}
                {advicePost.tags && advicePost.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {advicePost.tags.map((tag: string, index: number) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Actions */}
                <View style={styles.postActions}>
                  <Pressable
                    style={styles.postAction}
                    onPress={() => upvoteMutation.mutate()}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={isUpvoted ? "arrow-up" : "arrow-up-outline"}
                      size={22}
                      color={isUpvoted ? colors.primary : colors.textSecondary}
                    />
                    {upvoteCount > 0 && (
                      <Text style={[styles.postActionText, isUpvoted && { color: colors.primary }]}>
                        {upvoteCount}
                      </Text>
                    )}
                  </Pressable>
                  <View style={styles.postAction}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                    {responseCount > 0 && (
                      <Text style={styles.postActionText}>{responseCount}</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Responses Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              {responseCount > 0 ? `Responses (${responseCount})` : 'Share your wisdom'}
            </Text>

            {responsesLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : !responses || responses.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={40}
                  color={colors.textMuted || colors.textSecondary}
                  style={{ opacity: 0.6 }}
                />
                <Text style={styles.emptyCommentsPrompt}>
                  {getContextualPrompt(advicePost)}
                </Text>
                <Text style={styles.emptyCommentsSubtext}>
                  Your perspective matters here.
                </Text>
              </View>
            ) : (
              responses.map((response: any) => (
                <View key={response.id} style={styles.commentCard}>
                  <Image
                    source={{ uri: getAvatarUrl(response.author) }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentMain}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthorName}>
                        {response.author?.displayName || response.author?.username || 'User'}
                      </Text>
                      <Text style={styles.postDot}>·</Text>
                      {response.createdAt && (
                        <Text style={styles.postTime}>{formatTime(response.createdAt)}</Text>
                      )}
                    </View>
                    <Text style={styles.commentContent}>{response.content}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Response Input */}
        <View style={styles.inputContainer}>
          <Image source={{ uri: getAvatarUrl(user) }} style={styles.inputAvatar} />
          <TextInput
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Share your advice..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}
            onPress={handleSubmitResponse}
            disabled={!commentText.trim() || responseMutation.isPending}
          >
            {responseMutation.isPending ? (
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
    headerBookmark: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1
    },
    postSection: {
      backgroundColor: colors.surface || colors.background,
      borderBottomWidth: 8,
      borderBottomColor: colors.surfaceMuted || colors.muted
    },
    questionCard: {
      padding: 16,
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    anonymousAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    authorInfo: {
      marginLeft: 12,
    },
    postAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.borderLight || colors.muted,
    },
    postAuthorName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary || colors.text,
    },
    postTime: {
      fontSize: 12,
      color: colors.textMuted || colors.textSecondary,
      marginTop: 2,
    },
    topicBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    topicBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#EC4899',
    },
    postContent: {
      fontSize: 17,
      color: colors.textPrimary || colors.text,
      lineHeight: 26,
      marginTop: 8,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      gap: 8,
    },
    tag: {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 13,
      color: '#6366F1',
      fontWeight: '500',
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
      fontSize: 15,
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
    emptyCommentsPrompt: {
      marginTop: 16,
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
      width: 36,
      height: 36,
      borderRadius: 18,
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
      fontSize: 15,
      color: colors.textPrimary || colors.text,
      lineHeight: 22,
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
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.borderLight || colors.muted,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceMuted || colors.muted,
      borderRadius: 20,
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
