/**
 * Create/Edit Library Post Screen
 * For authorized users to create and edit library posts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../src/lib/apiClient';
import { queryKeys } from '../../../../../packages/shared/src/api/queryKeys';
import type { Domain, CreateLibraryPostRequest } from '../../../../../packages/shared/src/api/types';

export default function CreateLibraryPostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const postId = id ? parseInt(id, 10) : undefined;
  const isEdit = !!postId;

  // Form state
  const [domain, setDomain] = useState<Domain>('apologetics');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [perspectivesInput, setPerspectivesInput] = useState('');
  const [sourcesInput, setSourcesInput] = useState('');

  // Fetch current user capabilities
  const { data: meData } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => apiClient.getMe(),
  });

  const canAuthor = meData?.capabilities.canAuthorApologeticsPosts || false;

  // Fetch existing post if editing
  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: queryKeys.libraryPosts.detail(postId!),
    queryFn: async () => {
      return await apiClient.getLibraryPost(postId!);
    },
    enabled: isEdit && !isNaN(postId!),
  });

  // Populate form when editing
  useEffect(() => {
    if (existingPost && isEdit) {
      setDomain(existingPost.domain);
      setTitle(existingPost.title);
      setSummary(existingPost.summary || '');
      setBodyMarkdown(existingPost.bodyMarkdown);
      setPerspectivesInput(existingPost.perspectives?.join(', ') || '');
      setSourcesInput(
        existingPost.sources
          ?.map((s) => `${s.title} | ${s.url} | ${s.author || ''} | ${s.date || ''}`)
          .join('\n') || ''
      );
    }
  }, [existingPost, isEdit]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateLibraryPostRequest) => {
      return await apiClient.createLibraryPost(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryPosts.all() });
      Alert.alert('Success', 'Library post created successfully!');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create library post');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CreateLibraryPostRequest>) => {
      return await apiClient.updateLibraryPost(postId!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryPosts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryPosts.detail(postId!) });
      Alert.alert('Success', 'Library post updated successfully!');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update library post');
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.publishLibraryPost(postId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryPosts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryPosts.detail(postId!) });
      Alert.alert('Success', 'Library post published successfully!');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to publish library post');
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return;
    }

    if (!bodyMarkdown.trim()) {
      Alert.alert('Validation Error', 'Body content is required');
      return;
    }

    // Parse perspectives (comma-separated)
    const perspectives = perspectivesInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Parse sources (line-separated, pipe-delimited)
    const sources = sourcesInput
      .split('\n')
      .map((line) => {
        const [title, url, author, date] = line.split('|').map((s) => s?.trim());
        if (title && url) {
          return { title, url, author, date };
        }
        return null;
      })
      .filter((s): s is { title: string; url: string; author?: string; date?: string } => s !== null);

    const data: CreateLibraryPostRequest = {
      domain,
      areaId: null,
      tagId: null,
      title: title.trim(),
      summary: summary.trim() || null,
      bodyMarkdown: bodyMarkdown.trim(),
      perspectives,
      sources,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePublish = () => {
    if (!postId) return;

    Alert.alert(
      'Publish Post',
      'Are you sure you want to publish this library post? Published posts are visible to all users.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish', onPress: () => publishMutation.mutate() },
      ]
    );
  };

  if (!canAuthor) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="lock-closed" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>
          You don't have permission to create library posts.
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoadingPost) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Edit Post' : 'Create Post'}
        </Text>
        <Pressable
          style={[styles.headerButton, isSubmitting && styles.headerButtonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Domain */}
        <View style={styles.field}>
          <Text style={styles.label}>Domain</Text>
          <View style={styles.domainButtons}>
            <Pressable
              style={[
                styles.domainButton,
                domain === 'apologetics' && styles.domainButtonActive,
              ]}
              onPress={() => setDomain('apologetics')}
            >
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={domain === 'apologetics' ? '#fff' : '#6B7280'}
              />
              <Text
                style={[
                  styles.domainButtonText,
                  domain === 'apologetics' && styles.domainButtonTextActive,
                ]}
              >
                Apologetics
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.domainButton,
                domain === 'polemics' && styles.domainButtonActive,
              ]}
              onPress={() => setDomain('polemics')}
            >
              <Ionicons
                name="flame"
                size={16}
                color={domain === 'polemics' ? '#fff' : '#6B7280'}
              />
              <Text
                style={[
                  styles.domainButtonText,
                  domain === 'polemics' && styles.domainButtonTextActive,
                ]}
              >
                Polemics
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter post title"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Summary */}
        <View style={styles.field}>
          <Text style={styles.label}>Summary</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={summary}
            onChangeText={setSummary}
            placeholder="Brief summary (optional)"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Body */}
        <View style={styles.field}>
          <Text style={styles.label}>Body (Markdown) *</Text>
          <TextInput
            style={[styles.input, styles.bodyTextArea]}
            value={bodyMarkdown}
            onChangeText={setBodyMarkdown}
            placeholder="# Markdown content&#10;&#10;Write your article here..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            Use Markdown formatting: # Headings, **bold**, *italic*, [link](url), etc.
          </Text>
        </View>

        {/* Perspectives */}
        <View style={styles.field}>
          <Text style={styles.label}>Perspectives (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={perspectivesInput}
            onChangeText={setPerspectivesInput}
            placeholder="Reformed, Catholic, Orthodox"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Sources */}
        <View style={styles.field}>
          <Text style={styles.label}>Sources (one per line)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={sourcesInput}
            onChangeText={setSourcesInput}
            placeholder="Title | URL | Author | Date&#10;Example: Book Name | https://example.com | John Doe | 2024"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            Format: Title | URL | Author (optional) | Date (optional)
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {isEdit && existingPost?.status === 'draft' && (
            <Pressable
              style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]}
              onPress={handlePublish}
              disabled={isSubmitting}
            >
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.publishButtonText}>Publish</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    padding: 4,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  bodyTextArea: {
    minHeight: 200,
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  domainButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  domainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  domainButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  domainButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  domainButtonTextActive: {
    color: '#fff',
  },
  actions: {
    marginTop: 8,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
