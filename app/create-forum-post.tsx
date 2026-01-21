/**
 * Create Forum Post Screen - Reddit-style forum posts
 * Features: Title, long-form content, anonymous toggle, community selection
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
  Switch,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postsAPI, communitiesAPI } from '../src/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

// Hardcoded dark mode colors - single source of truth
const COLORS = {
  background: '#0A0A0C',
  surface: '#151518',
  surfaceElevated: '#1A1A1E',
  surfaceMuted: '#1E1E24',
  textPrimary: '#FFFFFF',
  textSecondary: '#E8E4DC',
  textMuted: '#9A9A9A',
  textPlaceholder: '#6A6A6A',
  borderSubtle: '#2A2A30',
  borderVisible: '#3A3A42',
  // Primary button - gold/amber accent
  primary: '#D4A860',
  primaryForeground: '#1A1A1E',
  // Accent button - muted gold
  accent: '#4A3D28',
  accentForeground: '#E8E4DC',
  // For icons
  icon: '#9A9A9A',
  // Toggle
  toggleTrackOff: '#3A3A42',
  toggleThumb: '#FFFFFF',
};

export default function CreateForumPostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(null);
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'images' | 'video' | null>(null);

  // Fetch user's communities for selection
  const { data: communities = [] } = useQuery({
    queryKey: ['/api/communities', user?.id],
    queryFn: async () => {
      const response = await communitiesAPI.getAll();
      // Filter to communities user is a member of
      return response.filter((c: any) => c.isMember);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => postsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      Alert.alert('Success', 'Forum post created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      console.error('Forum post creation error:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create forum post';
      Alert.alert('Error', errorMessage);
    },
  });

  const handlePickImage = async () => {
    // Check limit
    if (selectedImages.length >= 10) {
      Alert.alert('Limit Reached', 'You can only add up to 10 images per post');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photo library permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10 - selectedImages.length,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 10));
      setSelectedVideo(null);
      setMediaType('images');
    }
  };

  const handleTakePhoto = async () => {
    if (selectedImages.length >= 10) {
      Alert.alert('Limit Reached', 'You can only add up to 10 images per post');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9] as [number, number],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImages(prev => [...prev, result.assets[0].uri].slice(0, 10));
      setSelectedVideo(null);
      setMediaType('images');
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    if (selectedImages.length === 1) {
      setMediaType(null);
    }
  };

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photo library permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
      videoMaxDuration: 120,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Video must be under 50MB');
        return;
      }
      setSelectedVideo(asset.uri);
      setSelectedImages([]);
      setMediaType('video');
    }
  };

  const handleTakeVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
      videoMaxDuration: 120,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Video must be under 50MB');
        return;
      }
      setSelectedVideo(asset.uri);
      setSelectedImages([]);
      setMediaType('video');
    }
  };

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Content cannot be empty');
      return;
    }

    if (title.length < 5) {
      Alert.alert('Error', 'Title must be at least 5 characters');
      return;
    }

    if (content.length < 10) {
      Alert.alert('Error', 'Content must be at least 10 characters');
      return;
    }

    try {
      let mediaUrls: string[] = [];
      let videoUrl: string | null = null;

      // Convert multiple images to base64
      if (selectedImages.length > 0) {
        for (const imageUri of selectedImages) {
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
          });
          const extension = imageUri.split('.').pop()?.toLowerCase();
          const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
          mediaUrls.push(`data:${mimeType};base64,${base64}`);
        }
      }

      // Convert video to base64 if selected
      if (selectedVideo) {
        const base64 = await FileSystem.readAsStringAsync(selectedVideo, {
          encoding: 'base64',
        });
        const extension = selectedVideo.split('.').pop()?.toLowerCase();
        const mimeType = `video/${extension || 'mp4'}`;
        videoUrl = `data:${mimeType};base64,${base64}`;
      }

      createMutation.mutate({
        title: title.trim(),
        text: content.trim(),
        communityId: selectedCommunityId,
        isAnonymous,
        imageUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        videoUrl: videoUrl || undefined,
      });
    } catch (error) {
      console.error('Error preparing post:', error);
      Alert.alert('Error', 'Failed to prepare media. Please try again.');
    }
  };

  const selectedCommunity = communities.find((c: any) => c.id === selectedCommunityId);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: COLORS.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: COLORS.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>New Forum Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={createMutation.isPending || !title.trim() || !content.trim()}
        >
          <Text
            style={[
              styles.postText,
              { color: COLORS.primary },
              (createMutation.isPending || !title.trim() || !content.trim()) && styles.postTextDisabled
            ]}
          >
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title Input */}
        <View style={[styles.inputContainer, { borderBottomColor: COLORS.borderSubtle }]}>
          <Text style={[styles.label, { color: COLORS.textSecondary }]}>Title</Text>
          <TextInput
            style={[
              styles.titleInput,
              {
                backgroundColor: COLORS.surface,
                borderColor: COLORS.borderVisible,
                color: COLORS.textPrimary,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your post a title..."
            placeholderTextColor={COLORS.textPlaceholder}
            maxLength={300}
            autoFocus
          />
          <Text style={[styles.charCount, { color: COLORS.textSecondary }]}>
            {title.length}/300
          </Text>
        </View>

        {/* Content Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: COLORS.textSecondary }]}>Content</Text>
          <TextInput
            style={[
              styles.contentInput,
              {
                backgroundColor: COLORS.surface,
                borderColor: COLORS.borderVisible,
                color: COLORS.textPrimary,
              },
            ]}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor={COLORS.textPlaceholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: COLORS.textSecondary }]}>
            {content.length} characters
          </Text>
        </View>

        {/* Media Upload Section */}
        <View style={[styles.mediaSection, { borderBottomColor: COLORS.borderSubtle }]}>
          <Text style={[styles.label, { color: COLORS.textSecondary }]}>Media</Text>

          {/* Media Buttons Row - Dark mode styled pills */}
          <View style={styles.mediaButtonsRow}>
            <Pressable
              onPress={handlePickImage}
              style={[styles.mediaActionButton, { backgroundColor: COLORS.accent }]}
            >
              <Ionicons name="image-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.mediaActionButtonText, { color: COLORS.primary }]}>Gallery</Text>
            </Pressable>
            <Pressable
              onPress={handleTakePhoto}
              style={[styles.mediaActionButton, { backgroundColor: COLORS.accent }]}
            >
              <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.mediaActionButtonText, { color: COLORS.primary }]}>Camera</Text>
            </Pressable>
            <Pressable
              onPress={handlePickVideo}
              style={[styles.mediaActionButton, { backgroundColor: COLORS.accent }]}
            >
              <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.mediaActionButtonText, { color: COLORS.primary }]}>Video</Text>
            </Pressable>
            <Pressable
              onPress={handleTakeVideo}
              style={[styles.mediaActionButton, { backgroundColor: COLORS.accent }]}
            >
              <Ionicons name="film-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.mediaActionButtonText, { color: COLORS.primary }]}>Record</Text>
            </Pressable>
          </View>

          {/* Media Counter */}
          {selectedImages.length > 0 && (
            <Text style={[styles.mediaCounterText, { color: COLORS.textSecondary }]}>
              {selectedImages.length}/10 images selected
            </Text>
          )}
          {selectedVideo && (
            <Text style={[styles.mediaCounterText, { color: COLORS.textSecondary }]}>
              1 video selected (max 2 min, 50MB)
            </Text>
          )}
        </View>

        {/* Multiple Images Grid Preview */}
        {selectedImages.length > 0 && (
          <View style={styles.imagesGridContainer}>
            <View style={styles.imagesGrid}>
              {selectedImages.map((imageUri, index) => (
                <View key={index} style={[
                  styles.gridImageWrapper,
                  selectedImages.length === 1 && styles.singleImageWrapper,
                  selectedImages.length === 2 && styles.doubleImageWrapper,
                  selectedImages.length >= 3 && styles.gridImageWrapper,
                ]}>
                  <Image source={{ uri: imageUri }} style={styles.gridImage} />
                  <Pressable
                    onPress={() => handleRemoveImage(index)}
                    style={styles.gridImageRemove}
                  >
                    <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                  </Pressable>
                  {selectedImages.length > 1 && (
                    <View style={styles.gridImageCounter}>
                      <Text style={styles.gridImageCounterText}>{index + 1}/{selectedImages.length}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Video Preview */}
        {selectedVideo && (
          <View style={[styles.videoPreviewContainer, { borderBottomColor: COLORS.borderSubtle }]}>
            <View style={[styles.videoPreview, { backgroundColor: COLORS.surfaceMuted }]}>
              <Ionicons name="videocam" size={64} color={COLORS.icon} />
              <Text style={[styles.videoPreviewText, { color: COLORS.textSecondary }]}>
                Video selected
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setSelectedVideo(null);
                setMediaType(null);
              }}
              style={styles.removeImageButton}
            >
              <Ionicons name="close-circle" size={28} color={COLORS.textPrimary} />
            </Pressable>
          </View>
        )}

        {/* Community Selection */}
        <View style={[styles.optionContainer, { borderBottomColor: COLORS.borderSubtle }]}>
          <View style={styles.optionRow}>
            <Ionicons name="people-outline" size={20} color={COLORS.textPrimary} />
            <Text style={[styles.optionLabel, { color: COLORS.textPrimary }]}>Community</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCommunityPicker(!showCommunityPicker)}
            style={styles.communitySelector}
          >
            <Text style={[styles.communitySelectorText, { color: selectedCommunity ? COLORS.textPrimary : COLORS.textSecondary }]}>
              {selectedCommunity ? selectedCommunity.name : 'None (General)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Community Picker */}
        {showCommunityPicker && (
          <View style={[styles.communityPicker, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.borderVisible }]}>
            <TouchableOpacity
              onPress={() => {
                setSelectedCommunityId(null);
                setShowCommunityPicker(false);
              }}
              style={[styles.communityOption, { borderBottomColor: COLORS.borderSubtle }]}
            >
              <Text style={[styles.communityOptionText, { color: COLORS.textPrimary }]}>General (No community)</Text>
            </TouchableOpacity>
            {communities.map((community: any) => (
              <TouchableOpacity
                key={community.id}
                onPress={() => {
                  setSelectedCommunityId(community.id);
                  setShowCommunityPicker(false);
                }}
                style={[styles.communityOption, { borderBottomColor: COLORS.borderSubtle }]}
              >
                <Text style={[styles.communityOptionText, { color: COLORS.textPrimary }]}>{community.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Anonymous Toggle */}
        <View style={[styles.optionContainer, { borderBottomColor: COLORS.borderSubtle }]}>
          <View style={styles.optionRow}>
            <Ionicons name="eye-off-outline" size={20} color={COLORS.textPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, { color: COLORS.textPrimary }]}>Post Anonymously</Text>
              <Text style={[styles.optionDescription, { color: COLORS.textSecondary }]}>
                Your username will not be shown
              </Text>
            </View>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: COLORS.toggleTrackOff, true: COLORS.primary }}
            thumbColor={COLORS.toggleThumb}
          />
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: COLORS.surfaceMuted, borderColor: COLORS.borderSubtle }]}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={[styles.infoText, { color: COLORS.textSecondary }]}>
            Forum posts support markdown formatting and can be upvoted by the community.
          </Text>
        </View>

        {/* Loading indicator */}
        {createMutation.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>Creating post...</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  postText: {
    fontSize: 16,
    fontWeight: '700',
  },
  postTextDisabled: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  contentInput: {
    fontSize: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 150,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  communitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  communitySelectorText: {
    fontSize: 15,
  },
  communityPicker: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  communityOption: {
    padding: 16,
    borderBottomWidth: 1,
  },
  communityOptionText: {
    fontSize: 15,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginVertical: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 14,
  },
  // New Media Section Styles
  mediaSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  mediaActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  mediaActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  mediaCounterText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  // Multiple Images Grid
  imagesGridContainer: {
    marginBottom: 16,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gridImageWrapper: {
    width: 'calc(33.33% - 3px)',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1A1A1E',
  },
  singleImageWrapper: {
    width: '100%',
    height: 300,
  },
  doubleImageWrapper: {
    width: 'calc(50% - 2px)',
    height: 200,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImageRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  gridImageCounter: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  gridImageCounterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  // Video Preview
  videoPreviewContainer: {
    marginVertical: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  videoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});
