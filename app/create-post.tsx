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
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { microblogsAPI, MicroblogTopic } from '../src/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

// Topic configuration matching the feed filter chips
const TOPIC_CONFIG: Record<MicroblogTopic, { label: string; icon: string; color: string }> = {
  OBSERVATION: { label: 'Observation', icon: 'eye', color: '#8B5CF6' },
  QUESTION: { label: 'Question', icon: 'help-circle', color: '#EC4899' },
  NEWS: { label: 'News', icon: 'newspaper', color: '#3B82F6' },
  CULTURE: { label: 'Culture', icon: 'globe', color: '#10B981' },
  ENTERTAINMENT: { label: 'Entertainment', icon: 'film', color: '#F59E0B' },
  SCRIPTURE: { label: 'Scripture', icon: 'book', color: '#8B5CF6' },
  TESTIMONY: { label: 'Testimony', icon: 'heart', color: '#EF4444' },
  PRAYER: { label: 'Prayer', icon: 'hand-left', color: '#6366F1' },
  OTHER: { label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
};

export default function CreatePostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, colorScheme } = useTheme();
  const [content, setContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<MicroblogTopic>('OTHER');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const MAX_LENGTH = 280; // Twitter-style character limit
  const MAX_IMAGES = 4; // Like Twitter

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
      allowsEditing: false, // Full images without forced cropping
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

  // Move image left (earlier in order)
  const moveImageLeft = (index: number) => {
    if (index === 0) return;
    setSelectedImages(prev => {
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return newImages;
    });
  };

  // Move image right (later in order)
  const moveImageRight = (index: number) => {
    if (index === selectedImages.length - 1) return;
    setSelectedImages(prev => {
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return newImages;
    });
  };

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

    createMutation.mutate({
      content: content.trim(),
      topic: selectedTopic,
      imageUrls: selectedImages.length > 0 ? selectedImages : undefined,
    });
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
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>New Post</Text>
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

      {/* Category Picker */}
      <View style={[styles.topicContainer, { borderBottomColor: colors.borderSubtle }]}>
        <Text style={[styles.topicLabel, { color: colors.textSecondary }]}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicScroll}
        >
          {(Object.entries(TOPIC_CONFIG) as [MicroblogTopic, typeof TOPIC_CONFIG[MicroblogTopic]][]).map(([key, config]) => {
            const isSelected = selectedTopic === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.topicChip,
                  {
                    backgroundColor: isSelected ? config.color + '20' : colors.surfaceMuted,
                    borderColor: isSelected ? config.color : colors.borderSubtle,
                  }
                ]}
                onPress={() => setSelectedTopic(key)}
              >
                <Ionicons
                  name={config.icon as any}
                  size={14}
                  color={isSelected ? config.color : colors.textSecondary}
                />
                <Text style={[
                  styles.topicChipText,
                  { color: isSelected ? config.color : colors.textSecondary }
                ]}>
                  {config.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
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

        {/* Image Previews */}
        {selectedImages.length > 0 && (
          <View style={styles.imagesContainer}>
            {selectedImages.length > 1 && (
              <Text style={[styles.reorderHint, { color: colors.textSecondary }]}>
                Tap arrows to reorder images
              </Text>
            )}
            <View style={styles.imagesGrid}>
              {selectedImages.map((imageUri, index) => (
                <View key={index} style={[
                  styles.imageWrapper,
                  selectedImages.length === 1 && styles.singleImageWrapper,
                  selectedImages.length === 2 && styles.doubleImageWrapper,
                ]}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />

                  {/* Order badge */}
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>{index + 1}</Text>
                  </View>

                  {/* Remove button */}
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>

                  {/* Reorder buttons - only show when multiple images */}
                  {selectedImages.length > 1 && (
                    <View style={styles.reorderButtons}>
                      <TouchableOpacity
                        style={[
                          styles.reorderButton,
                          index === 0 && styles.reorderButtonDisabled
                        ]}
                        onPress={() => moveImageLeft(index)}
                        disabled={index === 0}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={18}
                          color={index === 0 ? 'rgba(255,255,255,0.3)' : '#fff'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.reorderButton,
                          index === selectedImages.length - 1 && styles.reorderButtonDisabled
                        ]}
                        onPress={() => moveImageRight(index)}
                        disabled={index === selectedImages.length - 1}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={index === selectedImages.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.imageButton, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}
            onPress={pickImages}
          >
            <Ionicons name="image-outline" size={20} color={colors.primary} />
            <Text style={[styles.imageButtonText, { color: colors.primary }]}>
              {selectedImages.length > 0 ? `${selectedImages.length}/${MAX_IMAGES}` : 'Add Photos'}
            </Text>
          </TouchableOpacity>
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagesContainer: {
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
    height: 250,
  },
  doubleImageWrapper: {
    width: '48%',
    height: 180,
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
  reorderHint: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  orderBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  reorderButtons: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  reorderButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonDisabled: {
    opacity: 0.5,
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
  topicContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  topicLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  topicScroll: {
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
