/**
 * Ask for Advice Screen - Anonymous question posting
 * Pre-configured with QUESTION topic for advice/support requests
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { microblogsAPI } from '../../src/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateAdviceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState('');
  const [city, setCity] = useState('');

  const MAX_LENGTH = 5000; // Extended limit for detailed advice questions
  const MAX_NICKNAME_LENGTH = 30;

  const createMutation = useMutation({
    mutationFn: (data: any) => microblogsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      queryClient.invalidateQueries({ queryKey: ['advice-feed'] });
      Alert.alert('Posted', 'Your question has been shared with the community.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      console.error('Advice post error:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to post question';
      Alert.alert('Error', errorMessage);
    },
  });

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write your question');
      return;
    }

    if (content.length > MAX_LENGTH) {
      Alert.alert('Error', `Question cannot exceed ${MAX_LENGTH} characters`);
      return;
    }

    // Create microblog with QUESTION topic
    createMutation.mutate({
      content: content.trim(),
      topic: 'QUESTION',
      anonymousNickname: nickname.trim() || undefined,
      anonymousCity: city.trim() || undefined,
    });
  };

  const remainingChars = MAX_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 200 && remainingChars > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Ask for Advice</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={createMutation.isPending || !content.trim() || isOverLimit}
            style={[
              styles.postButton,
              {
                backgroundColor: (!content.trim() || isOverLimit) ? colors.borderSubtle : colors.primary,
              },
            ]}
          >
            {createMutation.isPending ? (
              <Text style={styles.postButtonText}>...</Text>
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Info Banner */}
          <View style={[styles.infoBanner, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Share your question with the community. Your post will appear in the Advice section.
            </Text>
          </View>

          {/* Nickname & City Fields */}
          <View style={styles.fieldsContainer}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nickname (optional)</Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: colors.textPrimary,
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  placeholder="Display name"
                  placeholderTextColor={colors.textMuted}
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={MAX_NICKNAME_LENGTH}
                />
              </View>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>City (optional)</Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: colors.textPrimary,
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  placeholder="Your city"
                  placeholderTextColor={colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                  maxLength={50}
                />
              </View>
            </View>
            <Text style={[styles.fieldHint, { color: colors.textMuted }]}>
              <Ionicons name="information-circle-outline" size={12} /> These help others relate to your situation
            </Text>
          </View>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.borderSubtle,
                },
              ]}
              placeholder="What would you like advice on? Share your situation or question..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={MAX_LENGTH + 50} // Allow typing over to show warning
              value={content}
              onChangeText={setContent}
              autoFocus
            />
          </View>

          {/* Character Count */}
          <View style={styles.footer}>
            <Text
              style={[
                styles.charCount,
                {
                  color: isOverLimit
                    ? '#EF4444'
                    : isNearLimit
                    ? '#F59E0B'
                    : colors.textMuted,
                },
              ]}
            >
              {remainingChars}
            </Text>
          </View>

          {/* Tips */}
          <View style={[styles.tipsContainer, { borderTopColor: colors.borderSubtle }]}>
            <Text style={[styles.tipsTitle, { color: colors.textSecondary }]}>Tips for getting helpful advice:</Text>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
              <Text style={[styles.tipText, { color: colors.textMuted }]}>Be specific about your situation</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
              <Text style={[styles.tipText, { color: colors.textMuted }]}>Share relevant context</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
              <Text style={[styles.tipText, { color: colors.textMuted }]}>Ask a clear question</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldWrapper: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  fieldHint: {
    fontSize: 11,
    marginTop: 8,
  },
  inputContainer: {
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 17,
    lineHeight: 24,
    minHeight: 150,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  charCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipsContainer: {
    marginTop: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 13,
  },
});
