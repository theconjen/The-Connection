/**
 * EDIT PROFILE SCREEN - The Connection Mobile App
 * -----------------------------------------------
 * Edit user profile with Christian-focused fields
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '../src/queries/follow';
import apiClient from '../src/lib/apiClient';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // Fetch full profile data including Christian fields
  const { data: profileData, isLoading: isLoadingProfile } = useUserProfile(user?.id || 0);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    birthday: null as Date | null,
    denomination: '',
    homeChurch: '',
    favoriteBibleVerse: '',
    testimony: '',
    interests: '',
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update form data when profile data is loaded
  useEffect(() => {
    if (profileData?.user) {
      const userData = profileData.user;
      setFormData({
        displayName: userData.displayName || '',
        bio: userData.bio || '',
        location: userData.location || '',
        birthday: userData.birthday ? new Date(userData.birthday) : null,
        denomination: userData.denomination || '',
        homeChurch: userData.homeChurch || '',
        favoriteBibleVerse: userData.favoriteBibleVerse || '',
        testimony: userData.testimony || '',
        interests: userData.interests || '',
      });
      setProfileImage(userData.profileImageUrl || null);
    }
  }, [profileData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.patch('/user/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    },
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);

      // Upload image to server
      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri,
          name: filename,
          type,
        } as any);

        const response = await apiClient.post('/api/upload/profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data?.url) {
          setProfileImage(response.data.url);
          // Update profile with new image URL
          await apiClient.patch('/user/profile', { avatarUrl: response.data.url });
          queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          queryClient.invalidateQueries({ queryKey: ['user-profile'] });
          Alert.alert('Success', 'Profile picture updated!');
        }
      } catch (error: any) {
        console.error('Error uploading image:', error);
        Alert.alert('Upload Failed', error.response?.data?.error || 'Failed to upload profile picture');
        // Revert to previous image
        setProfileImage(profileData?.user?.profileImageUrl || null);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleSave = () => {
    if (!formData.displayName.trim()) {
      Alert.alert('Required Field', 'Please enter your display name');
      return;
    }

    // Format birthday as ISO string for API
    const dataToSend = {
      ...formData,
      birthday: formData.birthday ? formData.birthday.toISOString().split('T')[0] : null,
    };

    updateProfileMutation.mutate(dataToSend);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFormData(prev => ({ ...prev, birthday: selectedDate }));
    }
  };

  const formatBirthday = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const styles = getStyles(colors);

  // Show loading state while fetching profile
  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.hint, { marginTop: 16 }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable
          onPress={handleSave}
          style={styles.headerButton}
          disabled={updateProfileMutation.isPending}
        >
          <Text style={[styles.saveText, updateProfileMutation.isPending && styles.saveTextDisabled]}>
            {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <Pressable onPress={handlePickImage} style={styles.photoContainer} disabled={isUploadingImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={48} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.photoOverlay}>
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={24} color="#fff" />
              )}
            </View>
          </Pressable>
          <Text style={styles.photoLabel}>{isUploadingImage ? 'Uploading...' : 'Change Photo'}</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={formData.displayName}
              onChangeText={(text) => updateField('displayName', text)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={formData.bio}
              onChangeText={(text) => updateField('bio', text)}
              maxLength={200}
            />
            <Text style={styles.hint}>{formData.bio.length}/200 characters</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="City, State"
              placeholderTextColor={colors.textMuted}
              value={formData.location}
              onChangeText={(text) => updateField('location', text)}
            />
            <Text style={styles.hint}>Help others connect with you locally</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Birthday</Text>
            <Pressable
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={formData.birthday ? { color: colors.textPrimary, fontSize: 15 } : { color: colors.textMuted, fontSize: 15 }}>
                {formData.birthday ? formatBirthday(formData.birthday) : 'Select your birthday'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Date Picker Modal for iOS */}
        {Platform.OS === 'ios' && showDatePicker && (
          <Modal
            transparent
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <Pressable
              style={styles.datePickerOverlay}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Text style={[styles.datePickerButton, { color: colors.textMuted }]}>Cancel</Text>
                  </Pressable>
                  <Text style={[styles.datePickerTitle, { color: colors.textPrimary }]}>Select Birthday</Text>
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Text style={[styles.datePickerButton, { color: colors.primary }]}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={formData.birthday || new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              </View>
            </Pressable>
          </Modal>
        )}

        {/* Date Picker for Android */}
        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            value={formData.birthday || new Date(2000, 0, 1)}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}

        {/* Faith Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faith Journey</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Denomination/Tradition</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Baptist, Presbyterian, Non-denominational"
              placeholderTextColor={colors.textMuted}
              value={formData.denomination}
              onChangeText={(text) => updateField('denomination', text)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Home Church</Text>
            <TextInput
              style={styles.input}
              placeholder="Your local church"
              placeholderTextColor={colors.textMuted}
              value={formData.homeChurch}
              onChangeText={(text) => updateField('homeChurch', text)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Favorite Bible Verse</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., John 3:16"
              placeholderTextColor={colors.textMuted}
              value={formData.favoriteBibleVerse}
              onChangeText={(text) => updateField('favoriteBibleVerse', text)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Brief Testimony</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share your faith journey..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={formData.testimony}
              onChangeText={(text) => updateField('testimony', text)}
              maxLength={500}
            />
            <Text style={styles.hint}>{formData.testimony.length}/500 characters</Text>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests & Hobbies</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Interests</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Bible study, worship, missions, hiking"
              placeholderTextColor={colors.textMuted}
              value={formData.interests}
              onChangeText={(text) => updateField('interests', text)}
            />
            <Text style={styles.hint}>Separate with commas</Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your profile helps other believers find and connect with you for fellowship, prayer, and service.
            All fields except Display Name are optional.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
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
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    headerButton: {
      minWidth: 60,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cancelText: {
      fontSize: 16,
      color: colors.textMuted,
    },
    saveText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'right',
    },
    saveTextDisabled: {
      color: colors.textMuted,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    photoSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    photoContainer: {
      position: 'relative',
    },
    photo: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    photoPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },
    photoLabel: {
      marginTop: 8,
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    field: {
      marginBottom: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    infoBox: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: colors.surfaceMuted,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    datePickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    datePickerContainer: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 40,
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    datePickerTitle: {
      fontSize: 17,
      fontWeight: '600',
    },
    datePickerButton: {
      fontSize: 16,
      fontWeight: '500',
    },
  });
