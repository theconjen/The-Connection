/**
 * Create Post Modal
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI } from '../src/lib/apiClient';
import { Colors } from '../../src/shared/colors';

export default function CreatePostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const createMutation = useMutation({
    mutationFn: (content: string) => postsAPI.create({ content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      Alert.alert('Success', 'Post created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => Alert.alert('Error', 'Failed to create post'),
  });

  const handlePost = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Post cannot be empty');
      return;
    }
    createMutation.mutate(content.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Post</Text>
        <TouchableOpacity onPress={handlePost} disabled={createMutation.isPending}>
          <Text style={[styles.postText, createMutation.isPending && styles.postTextDisabled]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="What's on your mind?"
          multiline
          autoFocus
          maxLength={500}
        />
        <Text style={styles.charCount}>{content.length}/500</Text>
      </View>

      {createMutation.isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  cancelText: { color: '#6b7280', fontSize: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  postText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  postTextDisabled: { opacity: 0.5 },
  content: { flex: 1, padding: 16 },
  input: { flex: 1, fontSize: 16, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 8 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
});
