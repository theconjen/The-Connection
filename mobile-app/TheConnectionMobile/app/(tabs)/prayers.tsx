/**
 * Prayer Requests Screen
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
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prayerRequestsAPI } from '../../src/lib/apiClient';

interface PrayerRequest {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  prayerCount: number;
  isPrayed?: boolean;
}

export default function PrayersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newPrayerContent, setNewPrayerContent] = useState('');
  const [isCreateVisible, setIsCreateVisible] = useState(false);

  const { data: prayers = [], isLoading, refetch } = useQuery<PrayerRequest[]>({
    queryKey: ['prayer-requests'],
    queryFn: prayerRequestsAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (content: string) => prayerRequestsAPI.create({ content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] });
      setNewPrayerContent('');
      setIsCreateVisible(false);
      Alert.alert('Success', 'Prayer request shared');
    },
    onError: () => Alert.alert('Error', 'Failed to create prayer request'),
  });

  const prayMutation = useMutation({
    mutationFn: (id: number) => prayerRequestsAPI.pray(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] });
    },
  });

  const handleCreate = () => {
    if (!newPrayerContent.trim()) {
      Alert.alert('Error', 'Prayer request cannot be empty');
      return;
    }
    createMutation.mutate(newPrayerContent.trim());
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
        <Text style={styles.title}>Prayer Requests</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View style={styles.createSection}>
          {!isCreateVisible ? (
            <TouchableOpacity
              style={styles.createPrompt}
              onPress={() => setIsCreateVisible(true)}
            >
              <Text style={styles.createPromptText}>Share a prayer request...</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.createForm}>
              <TextInput
                style={styles.prayerInput}
                value={newPrayerContent}
                onChangeText={setNewPrayerContent}
                placeholder="What would you like prayer for?"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsCreateVisible(false);
                    setNewPrayerContent('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Share</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {prayers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No prayer requests yet</Text>
            <Text style={styles.emptyStateSubtext}>Be the first to share one!</Text>
          </View>
        ) : (
          prayers.map((prayer) => (
            <TouchableOpacity
              key={prayer.id}
              style={styles.prayerCard}
              onPress={() => router.push(`/prayers/${prayer.id}`)}
            >
              <View style={styles.prayerHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {prayer.authorName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.prayerMeta}>
                  <Text style={styles.authorName}>{prayer.authorName}</Text>
                  <Text style={styles.prayerTime}>{formatDate(prayer.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.prayerContent}>{prayer.content}</Text>
              <View style={styles.prayerFooter}>
                <TouchableOpacity
                  style={[
                    styles.prayButton,
                    prayer.isPrayed && styles.prayButtonPrayed,
                  ]}
                  onPress={() => prayMutation.mutate(prayer.id)}
                  disabled={prayMutation.isPending}
                >
                  <Text style={styles.prayButtonIcon}>🙏</Text>
                  <Text style={styles.prayButtonText}>
                    {prayer.isPrayed ? 'Prayed' : 'Pray'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.prayCount}>
                  {prayer.prayerCount} {prayer.prayerCount === 1 ? 'person' : 'people'} prayed
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  content: { flex: 1 },
  createSection: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  createPrompt: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8 },
  createPromptText: { color: '#9ca3af', fontSize: 14 },
  createForm: { backgroundColor: '#fff' },
  prayerInput: { backgroundColor: '#f9fafb', borderRadius: 6, padding: 12, fontSize: 14, minHeight: 100, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelButton: { paddingVertical: 8, paddingHorizontal: 16 },
  cancelButtonText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  submitButton: { backgroundColor: '#8b5cf6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  prayerCard: { backgroundColor: '#fff', padding: 16, marginBottom: 1, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  prayerHeader: { flexDirection: 'row', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  prayerMeta: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  prayerTime: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  prayerContent: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 },
  prayerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prayButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8b5cf6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  prayButtonPrayed: { backgroundColor: '#10b981' },
  prayButtonIcon: { fontSize: 16, marginRight: 6 },
  prayButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  prayCount: { fontSize: 12, color: '#9ca3af' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateText: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  emptyStateSubtext: { fontSize: 14, color: '#9ca3af' },
});
