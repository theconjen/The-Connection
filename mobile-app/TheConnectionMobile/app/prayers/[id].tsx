/**
 * Prayer Request Detail with Comments
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

export default function PrayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const prayerId = parseInt(id || '0');

  const { data: prayer, isLoading: prayerLoading } = useQuery({
    queryKey: ['prayer', prayerId],
    queryFn: async () => {
      const response = await apiClient.get(`/prayer-requests/${prayerId}`);
      return response.data;
    },
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['prayer-comments', prayerId],
    queryFn: async () => {
      const response = await apiClient.get(`/prayer-requests/${prayerId}/comments`);
      return response.data;
    },
  });

  const prayMutation = useMutation({
    mutationFn: () => apiClient.post(`/prayer-requests/${prayerId}/pray`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer', prayerId] });
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(`/prayer-requests/${prayerId}/comments`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-comments', prayerId] });
      setCommentText('');
      Alert.alert('Success', 'Comment added!');
    },
  });

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (prayerLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="Colors.primary" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Prayer Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {prayer && (
          <View style={styles.prayerSection}>
            <View style={styles.prayerHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {prayer.authorName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>{prayer.authorName}</Text>
                <Text style={styles.date}>{formatDate(prayer.createdAt)}</Text>
              </View>
            </View>
            <Text style={styles.prayerContent}>{prayer.content}</Text>
            
            <TouchableOpacity
              style={[styles.prayButton, prayer.isPrayed && styles.prayButtonPrayed]}
              onPress={() => prayMutation.mutate()}
              disabled={prayMutation.isPending}
            >
              <Text style={styles.prayButtonIcon}>🙏</Text>
              <Text style={styles.prayButtonText}>
                {prayer.isPrayed ? 'Prayed' : 'Pray for this'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.prayCount}>
              {prayer.prayerCount || 0} {prayer.prayerCount === 1 ? 'person has' : 'people have'} prayed
            </Text>
          </View>
        )}

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Prayer Updates & Encouragement ({comments.length})</Text>
          
          {commentsLoading ? (
            <ActivityIndicator size="small" color="Colors.primary" style={{ marginTop: 20 }} />
          ) : comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first to encourage!</Text>
          ) : (
            comments.map((comment: any) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.smallAvatar}>
                    <Text style={styles.smallAvatarText}>
                      {comment.authorName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                    <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                  </View>
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
          placeholder="Add encouragement or update..."
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
  backIcon: { fontSize: 24, color: 'Colors.primary' },
  title: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  content: { flex: 1 },
  prayerSection: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 8, borderBottomColor: '#f3f4f6' },
  prayerHeader: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'Colors.primary', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  authorName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  date: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  prayerContent: { fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 20 },
  prayButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'Colors.primary', padding: 14, borderRadius: 8, marginBottom: 12 },
  prayButtonPrayed: { backgroundColor: '#10b981' },
  prayButtonIcon: { fontSize: 20, marginRight: 8 },
  prayButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  prayCount: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  commentsSection: { padding: 16 },
  commentsTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 16 },
  noComments: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  commentCard: { backgroundColor: '#fff', padding: 14, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  commentHeader: { flexDirection: 'row', marginBottom: 10 },
  smallAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'Colors.primary', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  smallAvatarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  commentDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  commentContent: { fontSize: 14, color: '#374151', lineHeight: 20 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, maxHeight: 80, marginRight: 8 },
  postButton: { backgroundColor: 'Colors.primary', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
