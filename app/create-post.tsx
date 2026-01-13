/**
 * Create Post Modal - Enhanced with media, tagging, and location
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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { postsAPI } from '../src/lib/apiClient';
import apiClient from '../src/lib/apiClient';
import { Colors } from '../src/shared/colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function CreatePostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [taggedUsers, setTaggedUsers] = useState<number[]>([]);
  const [showTagSearch, setShowTagSearch] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Search users for tagging
  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/search', tagSearchQuery],
    queryFn: async () => {
      if (!tagSearchQuery || tagSearchQuery.length < 2) return [];
      const response = await apiClient.get('/api/search', {
        params: { q: tagSearchQuery, filter: 'accounts' },
      });
      return response.data;
    },
    enabled: showTagSearch && tagSearchQuery.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => postsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
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

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedVideo(null);
    }
  };

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60, // 60 seconds max
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedVideo(result.assets[0].uri);
      setSelectedImage(null);
    }
  };

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant location permissions');
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address[0]) {
        const locationString = `${address[0].city || ''}, ${address[0].region || ''}, ${address[0].country || ''}`.trim();
        setLocation(locationString);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const handleTagUser = (userId: number) => {
    if (!taggedUsers.includes(userId)) {
      setTaggedUsers([...taggedUsers, userId]);
    }
    setShowTagSearch(false);
    setTagSearchQuery('');
  };

  const handleRemoveTag = (userId: number) => {
    setTaggedUsers(taggedUsers.filter(id => id !== userId));
  };

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Post cannot be empty');
      return;
    }

    const postData: any = {
      text: content.trim(),
    };

    if (selectedImage) {
      // In production, upload image to cloud storage first
      postData.imageUrl = selectedImage;
    }

    if (selectedVideo) {
      // In production, upload video to cloud storage first
      postData.videoUrl = selectedVideo;
    }

    if (location) {
      postData.location = location;
    }

    if (taggedUsers.length > 0) {
      postData.taggedUserIds = taggedUsers;
    }

    // Add anonymous flag
    postData.isAnonymous = isAnonymous;

    createMutation.mutate(postData);
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

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="What's on your mind?"
          multiline
          autoFocus
          maxLength={10000}
        />

        {/* Selected Media Preview */}
        {selectedImage && (
          <View style={styles.mediaPreview}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeMediaButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {selectedVideo && (
          <View style={styles.mediaPreview}>
            <View style={styles.videoPreview}>
              <Ionicons name="videocam" size={48} color={Colors.primary} />
              <Text style={styles.videoText}>Video selected</Text>
            </View>
            <TouchableOpacity
              style={styles.removeMediaButton}
              onPress={() => setSelectedVideo(null)}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Location Display */}
        {location && (
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.locationText}>{location}</Text>
            <TouchableOpacity onPress={() => setLocation(null)}>
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Tagged Users */}
        {taggedUsers.length > 0 && (
          <View style={styles.taggedUsersContainer}>
            <Text style={styles.taggedLabel}>Tagged:</Text>
            {taggedUsers.map((userId) => (
              <View key={userId} style={styles.tagBadge}>
                <Text style={styles.tagText}>User #{userId}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(userId)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Tag Search */}
        {showTagSearch && (
          <View style={styles.tagSearchContainer}>
            <TextInput
              style={styles.tagSearchInput}
              value={tagSearchQuery}
              onChangeText={setTagSearchQuery}
              placeholder="Search users to tag..."
              autoFocus
            />
            {searchResults.length > 0 && (
              <View style={styles.tagSearchResults}>
                {searchResults.map((user: any) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.tagSearchResult}
                    onPress={() => handleTagUser(user.id)}
                  >
                    <Text style={styles.tagSearchResultText}>
                      {user.displayName || user.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <Text style={styles.charCount}>{content.length}/10,000</Text>

        {/* Anonymous Toggle */}
        <TouchableOpacity
          style={styles.anonymousToggle}
          onPress={() => setIsAnonymous(!isAnonymous)}
        >
          <View style={[
            styles.anonymousCheckbox,
            isAnonymous && styles.anonymousCheckboxChecked
          ]}>
            {isAnonymous && <Ionicons name="checkmark" size={18} color="#fff" />}
          </View>
          <Text style={styles.anonymousText}>Post anonymously</Text>
          <Ionicons name="help-circle-outline" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePickImage}>
          <Ionicons name="image" size={24} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handlePickVideo}>
          <Ionicons name="videocam" size={24} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowTagSearch(!showTagSearch)}
        >
          <Ionicons name="people" size={24} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Tag</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleGetLocation}>
          <Ionicons name="location" size={24} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Location</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelText: { color: '#6b7280', fontSize: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  postText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  postTextDisabled: { opacity: 0.5 },
  content: { flex: 1, padding: 16 },
  input: { fontSize: 16, minHeight: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 8 },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  actionButton: { alignItems: 'center', gap: 4 },
  actionButtonText: { fontSize: 12, color: '#6b7280' },
  mediaPreview: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: { marginTop: 8, color: '#6b7280' },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  locationText: { fontSize: 14, color: '#374151', flex: 1 },
  taggedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  taggedLabel: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 16,
  },
  tagText: { fontSize: 14, color: '#fff' },
  tagSearchContainer: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tagSearchInput: {
    padding: 12,
    fontSize: 14,
  },
  tagSearchResults: {
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tagSearchResult: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tagSearchResultText: { fontSize: 14, color: '#374151' },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  anonymousCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  anonymousCheckboxChecked: {
    backgroundColor: Colors.primary,
  },
  anonymousText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
