/**
 * Edit Advice Screen - Edit an existing advice request
 * Allows users to update their anonymous advice questions
 */

import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../src/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditAdviceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState('');
  const [city, setCity] = useState('');

  const MAX_LENGTH = 5000; // Extended limit for detailed advice questions
  const MAX_NICKNAME_LENGTH = 30;

  const adviceId = parseInt(id || '0');

  // Fetch existing advice post
  const { data: advicePost, isLoading } = useQuery({
    queryKey: ['advice', adviceId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/microblogs/${adviceId}`);
      return response.data;
    },
    enabled: !!adviceId,
  });

  // Set initial values when data loads
  useEffect(() => {
    if (advicePost) {
      setContent(advicePost.content || '');
      setNickname(advicePost.anonymousNickname || '');
      setCity(advicePost.anonymousCity || '');
    }
  }, [advicePost]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.patch(`/api/microblogs/${adviceId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      queryClient.invalidateQueries({ queryKey: ['advice-feed'] });
      queryClient.invalidateQueries({ queryKey: ['advice', adviceId] });
      Alert.alert('Updated', 'Your advice request has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      console.error('Advice update error:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to update advice request';
      Alert.alert('Error', errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/microblogs/${adviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      queryClient.invalidateQueries({ queryKey: ['advice-feed'] });
      Alert.alert('Deleted', 'Your advice request has been deleted.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/profile' as any) },
      ]);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete advice request');
    },
  });

  const handleUpdate = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write your question');
      return;
    }

    if (content.length > MAX_LENGTH) {
      Alert.alert('Error', `Question cannot exceed ${MAX_LENGTH} characters`);
      return;
    }

    updateMutation.mutate({
      content: content.trim(),
      anonymousNickname: nickname.trim() || null,
      anonymousCity: city.trim() || null,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Advice Request',
      'Are you sure you want to delete this advice request? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const remainingChars = MAX_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 100 && remainingChars > 0;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Advice Request</Text>
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={updateMutation.isPending || !content.trim() || isOverLimit}
            style={[
              styles.saveButton,
              {
                backgroundColor: (!content.trim() || isOverLimit) ? colors.borderSubtle : colors.primary,
              },
            ]}
          >
            {updateMutation.isPending ? (
              <Text style={styles.saveButtonText}>...</Text>
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Info Banner */}
          <View style={[styles.infoBanner, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Update your advice request. Changes will be saved immediately.
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
              maxLength={MAX_LENGTH + 50}
              value={content}
              onChangeText={setContent}
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

          {/* Delete Button */}
          <View style={[styles.deleteSection, { borderTopColor: colors.borderSubtle }]}>
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: '#EF4444' }]}
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={styles.deleteButtonText}>
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Advice Request'}
              </Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
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
    minHeight: 200,
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
  deleteSection: {
    marginTop: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 15,
  },
});
