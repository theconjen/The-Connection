/**
 * Post Detail with Comments
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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

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
      console.log('[Post Detail] API response:', response.data);
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
        {post && (
          <View style={styles.postSection}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.channelIcon}>
                <Text style={styles.channelIconText}>🏛️</Text>
              </View>
              <View style={styles.postMeta}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={styles.channelName}>
                    {post.communityId ? `Community ${post.communityId}` : 'General'}
                  </Text>
                  <Text style={styles.metaSeparator}> • </Text>
                  <Text style={styles.authorName}>
                    {post.isAnonymous
                      ? 'Anonymous'
                      : (post.authorName || post.author?.displayName || post.author?.username || 'User')}
                  </Text>
                  <Text style={styles.metaSeparator}> • </Text>
                  <Text style={styles.timeAgo}>
                    {post.createdAt
                      ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                      : 'Recently'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Post Title */}
            {post.title ? (
              <Text style={styles.postTitle}>{post.title}</Text>
            ) : null}

            {/* Post Content */}
            {post.content ? (
              <Text style={styles.postContent}>{post.content}</Text>
            ) : null}

            {/* Flair Badge */}
            {post.isAnonymous && (
              <View style={styles.flairContainer}>
                <View style={styles.flairBadge}>
                  <Text style={styles.flairText}>Anonymous</Text>
                </View>
              </View>
            )}

            {/* Engagement Section */}
            <View style={styles.engagementSection}>
              <TouchableOpacity style={styles.likeButton}>
                <Ionicons name="heart-outline" size={20} color="#536471" />
                <Text style={styles.likeCount}>{post.likeCount || 0}</Text>
              </TouchableOpacity>
              <View style={styles.commentIndicator}>
                <Ionicons name="chatbubble-outline" size={16} color="#536471" />
                <Text style={styles.commentCount}>{comments?.length || 0} comments</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments?.length || 0})</Text>

          {commentsLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
          ) : !comments || comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet</Text>
          ) : (
            Array.isArray(comments) && comments.map((comment: any) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.smallAvatar}>
                    <Text style={styles.smallAvatarText}>
                      {comment.authorName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
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
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backIcon: { fontSize: 24, color: colors.primary },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  content: { flex: 1 },
  postSection: { backgroundColor: colors.card, padding: 16, borderBottomWidth: 8, borderBottomColor: colors.surfaceMuted },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  channelIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  channelIconText: { fontSize: 20 },
  postMeta: { flex: 1 },
  channelName: { fontSize: 14, fontWeight: '700', color: colors.text },
  metaSeparator: { fontSize: 14, color: colors.textSecondary, marginHorizontal: 2 },
  authorName: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  timeAgo: { fontSize: 13, color: colors.textSecondary },
  postTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12, lineHeight: 28 },
  postContent: { fontSize: 16, color: colors.text, lineHeight: 24, marginBottom: 16 },
  flairContainer: { marginBottom: 12 },
  flairBadge: { backgroundColor: colors.pillInactiveBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.pillInactiveBorder },
  flairText: { fontSize: 12, fontWeight: '600', color: colors.accent },
  engagementSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  likeCount: { fontSize: 16, fontWeight: '600', color: colors.text },
  commentIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentCount: { fontSize: 14, color: colors.textSecondary },
  commentsSection: { padding: 16, backgroundColor: colors.card },
  commentsTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 },
  noComments: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', marginTop: 20 },
  commentCard: { backgroundColor: colors.cardNested, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  smallAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  smallAvatarText: { color: colors.primaryForeground, fontSize: 12, fontWeight: '600' },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: colors.text },
  commentContent: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' },
  input: { flex: 1, backgroundColor: colors.input, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, maxHeight: 80, marginRight: 8, color: colors.text, borderWidth: 1, borderColor: colors.border },
  postButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
});
