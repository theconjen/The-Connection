/**
 * Ask for Advice Screen - Anonymous question posting
 * Pre-configured with QUESTION topic for advice/support requests
 * Supports photo and link attachments
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
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { microblogsAPI } from '../../src/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

export default function CreateAdviceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState('');
  const [city, setCity] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const MAX_LENGTH = 5000; // Extended limit for detailed advice questions
  const MAX_NICKNAME_LENGTH = 30;
  const MAX_IMAGES = 4;

  // Image picker function
  const pickImages = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images per post`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - selectedImages.length,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets
        .filter(asset => asset.base64)
        .map(asset => {
          const extension = asset.uri.split('.').pop()?.toLowerCase() || 'jpeg';
          const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
          return `data:${mimeType};base64,${asset.base64}`;
        });
      setSelectedImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Validate URL format
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => microblogsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      queryClient.invalidateQueries({ queryKey: ['advice-feed'] });
      queryClient.invalidateQueries({ queryKey: ['advice-list'] });
      Alert.alert('Posted', 'Your question has been shared with the community.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
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

    // Validate URL if provided
    if (sourceUrl.trim() && !isValidUrl(sourceUrl.trim())) {
      Alert.alert('Error', 'Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    // Create microblog with QUESTION topic
    createMutation.mutate({
      content: content.trim(),
      topic: 'QUESTION',
      anonymousNickname: nickname.trim() || undefined,
      anonymousCity: city.trim() || undefined,
      imageUrls: selectedImages.length > 0 ? selectedImages : undefined,
      sourceUrl: sourceUrl.trim() || undefined,
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
              Share your question with the community. Attach photos of sermons, articles, or anything you'd like advice on.
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
              autoFocus
            />
          </View>

          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <View style={styles.imagesContainer}>
              <View style={styles.imagesGrid}>
                {selectedImages.map((imageUri, index) => (
                  <View key={imageUri} style={[
                    styles.imageWrapper,
                    selectedImages.length === 1 && styles.singleImageWrapper,
                    selectedImages.length === 2 && styles.doubleImageWrapper,
                  ]}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Attachment Buttons */}
          <View style={styles.attachmentRow}>
            <TouchableOpacity
              style={[styles.attachButton, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              onPress={pickImages}
            >
              <Ionicons name="image-outline" size={20} color={colors.primary} />
              <Text style={[styles.attachButtonText, { color: colors.primary }]}>
                {selectedImages.length > 0 ? `Photos (${selectedImages.length}/${MAX_IMAGES})` : 'Add Photo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attachButton,
                { backgroundColor: colors.surface, borderColor: showLinkInput || sourceUrl ? colors.primary : colors.borderSubtle }
              ]}
              onPress={() => setShowLinkInput(!showLinkInput)}
            >
              <Ionicons name="link-outline" size={20} color={sourceUrl ? colors.primary : colors.textSecondary} />
              <Text style={[styles.attachButtonText, { color: sourceUrl ? colors.primary : colors.textSecondary }]}>
                {sourceUrl ? 'Link Added' : 'Add Link'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Link Input - appears below Add Link button */}
          {showLinkInput && (
            <View style={styles.linkInputContainer}>
              <View style={[styles.linkInputWrapper, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                <Ionicons name="link" size={18} color={colors.primary} />
                <TextInput
                  style={[styles.linkInput, { color: colors.textPrimary }]}
                  placeholder="Paste a link here..."
                  placeholderTextColor={colors.textMuted}
                  value={sourceUrl}
                  onChangeText={setSourceUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  autoFocus
                />
                {sourceUrl ? (
                  <TouchableOpacity onPress={() => setSourceUrl('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {sourceUrl && isValidUrl(sourceUrl) && (
                <TouchableOpacity
                  style={styles.previewLink}
                  onPress={() => Linking.openURL(sourceUrl)}
                >
                  <Ionicons name="open-outline" size={14} color={colors.primary} />
                  <Text style={[styles.previewLinkText, { color: colors.primary }]} numberOfLines={1}>
                    {sourceUrl}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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
              <Text style={[styles.tipText, { color: colors.textMuted }]}>Attach photos of sermons or content you're asking about</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
              <Text style={[styles.tipText, { color: colors.textMuted }]}>Include links to articles or videos for context</Text>
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
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  linkInputContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  linkInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  linkInput: {
    flex: 1,
    fontSize: 15,
  },
  previewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingLeft: 4,
  },
  previewLinkText: {
    fontSize: 13,
    flex: 1,
  },
  imagesContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageWrapper: {
    width: '48%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  singleImageWrapper: {
    width: '100%',
    height: 200,
  },
  doubleImageWrapper: {
    width: '48%',
    height: 150,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  attachmentRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
    paddingBottom: 40,
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
