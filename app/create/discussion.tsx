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
import { postsAPI, communitiesAPI } from '../../src/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function CreateForumPostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();
  const styles = getThemedStyles(colors, colorScheme);

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
      Alert.alert('Error', 'Failed to prepare media. Please try again.');
    }
  };

  const selectedCommunity = communities.find((c: any) => c.id === selectedCommunityId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Forum Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={createMutation.isPending || !title.trim() || !content.trim()}
        >
          <Text
            style={[
              styles.postText,
              (createMutation.isPending || !title.trim() || !content.trim()) && styles.postTextDisabled
            ]}
          >
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your post a title..."
            placeholderTextColor={colors.textTertiary}
            maxLength={300}
            autoFocus
          />
          <Text style={styles.charCount}>
            {title.length}/300
          </Text>
        </View>

        {/* Content Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Content</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {content.length} characters
          </Text>
        </View>

        {/* Media Upload Section */}
        <View style={styles.mediaSection}>
          <Text style={styles.label}>Media</Text>

          {/* Media Buttons Row */}
          <View style={styles.mediaButtonsRow}>
            <Pressable
              onPress={handlePickImage}
              style={styles.mediaActionButton}
            >
              <Ionicons name="image-outline" size={20} color={colors.accent} />
              <Text style={styles.mediaActionButtonText}>Gallery</Text>
            </Pressable>
            <Pressable
              onPress={handleTakePhoto}
              style={styles.mediaActionButton}
            >
              <Ionicons name="camera-outline" size={20} color={colors.accent} />
              <Text style={styles.mediaActionButtonText}>Camera</Text>
            </Pressable>
            <Pressable
              onPress={handlePickVideo}
              style={styles.mediaActionButton}
            >
              <Ionicons name="videocam-outline" size={20} color={colors.accent} />
              <Text style={styles.mediaActionButtonText}>Video</Text>
            </Pressable>
            <Pressable
              onPress={handleTakeVideo}
              style={styles.mediaActionButton}
            >
              <Ionicons name="film-outline" size={20} color={colors.accent} />
              <Text style={styles.mediaActionButtonText}>Record</Text>
            </Pressable>
          </View>

          {/* Media Counter */}
          {selectedImages.length > 0 && (
            <Text style={styles.mediaCounterText}>
              {selectedImages.length}/10 images selected
            </Text>
          )}
          {selectedVideo && (
            <Text style={styles.mediaCounterText}>
              1 video selected (max 2 min, 50MB)
            </Text>
          )}
        </View>

        {/* Multiple Images Grid Preview */}
        {selectedImages.length > 0 && (
          <View style={styles.imagesGridContainer}>
            <View style={styles.imagesGrid}>
              {selectedImages.map((imageUri, index) => (
                <View key={imageUri} style={[
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
          <View style={styles.videoPreviewContainer}>
            <View style={styles.videoPreview}>
              <Ionicons name="videocam" size={64} color={colors.textTertiary} />
              <Text style={styles.videoPreviewText}>
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
              <Ionicons name="close-circle" size={28} color={colors.textPrimary} />
            </Pressable>
          </View>
        )}

        {/* Community Selection */}
        <View style={styles.optionContainer}>
          <View style={styles.optionRow}>
            <Ionicons name="people-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.optionLabel}>Community</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCommunityPicker(!showCommunityPicker)}
            style={styles.communitySelector}
          >
            <Text style={[styles.communitySelectorText, { color: selectedCommunity ? colors.textPrimary : colors.textSecondary }]}>
              {selectedCommunity ? selectedCommunity.name : 'None (General)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Community Picker */}
        {showCommunityPicker && (
          <View style={styles.communityPicker}>
            <TouchableOpacity
              onPress={() => {
                setSelectedCommunityId(null);
                setShowCommunityPicker(false);
              }}
              style={styles.communityOption}
            >
              <Text style={styles.communityOptionText}>General (No community)</Text>
            </TouchableOpacity>
            {communities.map((community: any) => (
              <TouchableOpacity
                key={community.id}
                onPress={() => {
                  setSelectedCommunityId(community.id);
                  setShowCommunityPicker(false);
                }}
                style={styles.communityOption}
              >
                <Text style={styles.communityOptionText}>{community.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Anonymous Toggle */}
        <View style={styles.optionContainer}>
          <View style={styles.optionRow}>
            <Ionicons name="eye-off-outline" size={20} color={colors.textPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>Post Anonymously</Text>
              <Text style={styles.optionDescription}>
                Your username will not be shown
              </Text>
            </View>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: colors.borderSoft, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.infoText}>
            Forum posts support markdown formatting and can be upvoted by the community.
          </Text>
        </View>

        {/* Loading indicator */}
        {createMutation.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Creating post...</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getThemedStyles = (colors: any, colorScheme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 70,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  postText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
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
    color: colors.textSecondary,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    color: colors.textPrimary,
  },
  contentInput: {
    fontSize: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 150,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    color: colors.textPrimary,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    color: colors.textSecondary,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
    color: colors.textPrimary,
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 2,
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
  },
  communityOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  communityOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    backgroundColor: colorScheme === 'dark' ? colors.surfaceRaised : '#F0F4FF',
    borderColor: colors.borderSubtle,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
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
    borderBottomColor: colors.borderSubtle,
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
  // Media Section Styles
  mediaSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
    backgroundColor: colorScheme === 'dark' ? colors.surfaceRaised : colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  mediaActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  mediaCounterText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    color: colors.textSecondary,
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
    width: '32%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surface,
  },
  singleImageWrapper: {
    width: '100%',
    height: 300,
  },
  doubleImageWrapper: {
    width: '49%',
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
    borderBottomColor: colors.borderSubtle,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  videoPreviewText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
