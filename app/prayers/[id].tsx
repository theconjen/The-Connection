/**
 * Prayer Request Detail with Comments
 */

import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function PrayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const { user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const prayerId = parseInt(id || '0');

  const { data: prayer, isLoading: prayerLoading } = useQuery({
    queryKey: ['prayer', prayerId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/prayer-requests/${prayerId}`);
      return response.data;
    },
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['prayer-comments', prayerId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/prayer-requests/${prayerId}/comments`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        return [];
      }
    },
  });

  const prayMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/prayer-requests/${prayerId}/pray`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer', prayerId] });
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(`/api/prayer-requests/${prayerId}/comments`, { content });
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

  const styles = getStyles(colors);

  if (prayerLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={styles.commentsTitle}>Prayer Updates & Encouragement ({comments?.length || 0})</Text>

          {commentsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : !comments || comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first to encourage!</Text>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item: comment }) => (
                <View style={styles.commentCard}>
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
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
            />
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

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  backIcon: { fontSize: 24, color: colors.primary },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  content: { flex: 1 },
  prayerSection: { backgroundColor: colors.surface, padding: 20, borderBottomWidth: 8, borderBottomColor: colors.surfaceMuted },
  prayerHeader: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: colors.primaryForeground, fontSize: 20, fontWeight: '600' },
  authorName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  date: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  prayerContent: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 20 },
  prayButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, padding: 14, borderRadius: 8, marginBottom: 12 },
  prayButtonPrayed: { backgroundColor: colors.success },
  prayButtonIcon: { fontSize: 20, marginRight: 8 },
  prayButtonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  prayCount: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  commentsSection: { padding: 16 },
  commentsTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
  noComments: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  commentCard: { backgroundColor: colors.surface, padding: 14, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: colors.borderSubtle },
  commentHeader: { flexDirection: 'row', marginBottom: 10 },
  smallAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  smallAvatarText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  commentDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  commentContent: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderSubtle, alignItems: 'center' },
  input: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, maxHeight: 80, marginRight: 8, color: colors.textPrimary },
  postButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
});
