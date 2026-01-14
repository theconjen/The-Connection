/**
 * Create Post Modal - Twitter-style microblog posting
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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { microblogsAPI } from '../src/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';

export default function CreatePostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, colorScheme } = useTheme();
  const [content, setContent] = useState('');

  const MAX_LENGTH = 280; // Twitter-style character limit

  const createMutation = useMutation({
    mutationFn: (data: any) => microblogsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
      Alert.alert('Success', 'Post created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      console.error('Post creation error:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create post';
      Alert.alert('Error', errorMessage);
    },
  });

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Post cannot be empty');
      return;
    }

    if (content.length > MAX_LENGTH) {
      Alert.alert('Error', `Post cannot exceed ${MAX_LENGTH} characters`);
      return;
    }

    createMutation.mutate({ content: content.trim() });
  };

  const remainingChars = MAX_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 20 && remainingChars > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={createMutation.isPending || !content.trim() || isOverLimit}
        >
          <Text
            style={[
              styles.postText,
              { color: colors.primary },
              (createMutation.isPending || !content.trim() || isOverLimit) && styles.postTextDisabled
            ]}
          >
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.background,
            }
          ]}
          value={content}
          onChangeText={setContent}
          placeholder="What's happening?"
          placeholderTextColor={colors.textSecondary}
          multiline
          autoFocus
          maxLength={MAX_LENGTH + 50} // Allow typing past limit to show error
        />

        {/* Character Count */}
        <View style={styles.charCountContainer}>
          <Text
            style={[
              styles.charCount,
              { color: isOverLimit ? '#EF4444' : isNearLimit ? '#F59E0B' : colors.textSecondary }
            ]}
          >
            {remainingChars < 0 ? `${remainingChars}` : `${content.length}/${MAX_LENGTH}`}
          </Text>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#1E3A5F' : '#EFF6FF', borderColor: colorScheme === 'dark' ? '#2563EB' : '#DBEAFE' }]}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colorScheme === 'dark' ? '#60A5FA' : '#1E40AF'}
          />
          <Text style={[styles.infoText, { color: colorScheme === 'dark' ? '#93C5FD' : '#1E40AF' }]}>
            Posts are public and show your profile
          </Text>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {createMutation.isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  cancelText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  postText: {
    fontSize: 16,
    fontWeight: '600',
  },
  postTextDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    fontSize: 18,
    minHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  charCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
