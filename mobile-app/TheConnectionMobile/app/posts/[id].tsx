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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors } from '../../src/shared/colors';

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const postId = parseInt(id || '0');

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await apiClient.get(`/posts/${postId}`);
      return response.data;
    },
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const response = await apiClient.get(`/posts/${postId}/comments`);
      return response.data;
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(`/posts/${postId}/comments`, { content });
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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {post && (
          <View style={styles.postSection}>
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {post.authorName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>{post.authorName}</Text>
              </View>
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
          </View>
        )}

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

          {commentsLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
          ) : comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet</Text>
          ) : (
            comments.map((comment: any) => (
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backIcon: { fontSize: 24, color: Colors.primary },
  title: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  content: { flex: 1 },
  postSection: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 8, borderBottomColor: '#f3f4f6' },
  postHeader: { flexDirection: 'row', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  authorName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  postContent: { fontSize: 15, color: '#374151', lineHeight: 22 },
  commentsSection: { padding: 16 },
  commentsTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 16 },
  noComments: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 20 },
  commentCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  smallAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  smallAvatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  commentContent: { fontSize: 14, color: '#374151', lineHeight: 20 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, maxHeight: 80, marginRight: 8 },
  postButton: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
