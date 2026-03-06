/**
 * Wall Post Detail with Comments
 * Shows a community wall post and its comments
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { communitiesAPI } from '../../../src/lib/apiClient';
import { Text } from '../../../src/theme';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';

function getAvatarUrl(author?: any): string {
  if (!author) return 'https://ui-avatars.com/api/?name=U&background=222D99&color=fff';
  const url = author.profileImageUrl || author.avatarUrl;
  if (url) return url;
  const name = author.displayName || author.username || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=222D99&color=fff`;
}

export default function WallPostDetailScreen() {
  const router = useRouter();
  const { id, communityId } = useLocalSearchParams() as { id: string; communityId: string };
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const postId = parseInt(id || '0');
  const commId = parseInt(communityId || '0');

  // Fetch wall posts and find the one we need
  const { data: wallPosts = [], isLoading: postLoading } = useQuery({
    queryKey: ['wall-posts', commId],
    queryFn: () => communitiesAPI.getWallPosts(commId),
    enabled: !!commId,
  });

  const post = wallPosts.find((p: any) => p.id === postId);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['wall-post-comments', commId, postId],
    queryFn: () => communitiesAPI.getWallPostComments(commId, postId),
    enabled: !!commId && !!postId,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      communitiesAPI.createWallPostComment(commId, postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wall-post-comments', commId, postId] });
      queryClient.invalidateQueries({ queryKey: ['wall-posts', commId] });
      setCommentText('');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    },
  });

  const handleComment = useCallback(() => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  }, [commentText, commentMutation]);

  const formatTime = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getAuthorName = (data: any): string => {
    return data?.author?.displayName || data?.author?.username || data?.authorName || 'User';
  };

  const isDark = theme === 'dark';

  if (postLoading) {
    return (
      <View style={[s.centerContainer, { backgroundColor: colors.surface || colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[s.centerContainer, { backgroundColor: colors.surface || colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[s.container, { backgroundColor: colors.surface || colors.background }]}>
        {/* Header */}
        <View style={[s.header, { backgroundColor: colors.surface || colors.background, borderBottomColor: colors.borderSubtle || colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.textPrimary || colors.text }]}>Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Post */}
          <View style={[s.postSection, { backgroundColor: colors.surface || colors.background, borderBottomColor: colors.surfaceMuted || colors.muted }]}>
            <View style={s.postContainer}>
              <Image
                source={{ uri: post.authorAvatar || post.author?.profileImageUrl || getAvatarUrl(post.author || { username: post.authorName }) }}
                style={[s.postAvatar, { backgroundColor: colors.borderLight || colors.muted }]}
                cachePolicy="memory-disk"
              />
              <View style={s.postMain}>
                <View style={s.postHeaderRow}>
                  <Text style={[s.postAuthorName, { color: colors.textPrimary || colors.text }]}>
                    {getAuthorName(post)}
                  </Text>
                  <Text style={[s.postDot, { color: colors.textMuted || colors.textSecondary }]}>·</Text>
                  <Text style={[s.postTime, { color: colors.textMuted || colors.textSecondary }]}>
                    {post.createdAt ? formatTime(post.createdAt) : 'Recently'}
                  </Text>
                </View>
                <Text style={[s.postContent, { color: colors.textPrimary || colors.text }]}>{post.content}</Text>

                {post.imageUrl && (
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={s.postImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                )}

                <View style={[s.postActions, { borderTopColor: colors.borderSubtle || colors.border }]}>
                  <View style={s.postAction}>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
                    <Text style={[s.postActionText, { color: colors.textSecondary }]}>
                      {comments?.length || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View style={[s.commentsSection, { backgroundColor: colors.surface || colors.background }]}>
            <Text style={[s.commentsTitle, { color: colors.textPrimary || colors.text }]}>
              {(comments?.length || 0) > 0 ? `Comments (${comments.length})` : 'Be the first to comment'}
            </Text>

            {commentsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : !comments || comments.length === 0 ? (
              <View style={s.emptyComments}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.textMuted || colors.textSecondary} style={{ opacity: 0.6 }} />
                <Text style={[s.emptyCommentsPrompt, { color: colors.textPrimary || colors.text }]}>
                  What are your thoughts?
                </Text>
                <Text style={[s.emptyCommentsSubtext, { color: colors.textMuted || colors.textSecondary }]}>
                  Share your perspective with the community.
                </Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item: comment }) => (
                  <View style={[s.commentCard, { borderBottomColor: colors.borderSubtle || colors.border }]}>
                    <Image
                      source={{ uri: getAvatarUrl(comment.author) }}
                      style={[s.commentAvatar, { backgroundColor: colors.borderLight || colors.muted }]}
                      cachePolicy="memory-disk"
                    />
                    <View style={s.commentMain}>
                      <View style={s.commentHeader}>
                        <Text style={[s.commentAuthorName, { color: colors.textPrimary || colors.text }]}>
                          {comment.author?.displayName || comment.author?.username || 'User'}
                        </Text>
                        <Text style={[s.postDot, { color: colors.textMuted || colors.textSecondary }]}>·</Text>
                        {comment.createdAt && (
                          <Text style={[s.postTime, { color: colors.textMuted || colors.textSecondary }]}>
                            {formatTime(comment.createdAt)}
                          </Text>
                        )}
                      </View>
                      <Text style={[s.commentContent, { color: colors.textPrimary || colors.text }]}>
                        {comment.content}
                      </Text>
                    </View>
                  </View>
                )}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
              />
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={[s.inputContainer, { backgroundColor: colors.surface || colors.background, borderTopColor: colors.borderSubtle || colors.border }]}>
          <Image source={{ uri: getAvatarUrl(user) }} style={[s.inputAvatar, { backgroundColor: colors.borderLight || colors.muted }]} cachePolicy="memory-disk" />
          <TextInput
            style={[s.input, { backgroundColor: colors.surfaceMuted || colors.muted, color: colors.textPrimary || colors.text }]}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendButton, { backgroundColor: colors.primary }, !commentText.trim() && s.sendButtonDisabled]}
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

const s = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1 },
  postSection: { borderBottomWidth: 8 },
  postContainer: { flexDirection: 'row', padding: 16 },
  postAvatar: { width: 44, height: 44, borderRadius: 22 },
  postMain: { flex: 1, marginLeft: 12 },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  postAuthorName: { fontSize: 16, fontWeight: '700', marginRight: 4 },
  postDot: { fontSize: 12, marginHorizontal: 4, opacity: 0.6 },
  postTime: { fontSize: 12, opacity: 0.7 },
  postContent: { fontSize: 15, lineHeight: 22, marginTop: 4 },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 12 },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postActionText: { fontSize: 14, fontWeight: '500' },
  commentsSection: { padding: 16 },
  commentsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  emptyComments: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  emptyCommentsPrompt: { marginTop: 12, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  emptyCommentsSubtext: { marginTop: 8, fontSize: 14, fontStyle: 'italic' },
  commentCard: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentMain: { flex: 1, marginLeft: 12 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  commentAuthorName: { fontSize: 14, fontWeight: '600', marginRight: 4 },
  commentContent: { fontSize: 14, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  inputAvatar: { width: 32, height: 32, borderRadius: 16, marginBottom: 8 },
  input: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginHorizontal: 12,
  },
  sendButton: { borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  sendButtonDisabled: { opacity: 0.5 },
});
