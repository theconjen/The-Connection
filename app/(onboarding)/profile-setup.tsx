/**
 * PROFILE SETUP SCREEN - The Connection Onboarding
 * Step 2: Basic profile information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../src/lib/apiClient';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { user, refresh } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    location: '',
    bio: '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need permission to access your photos to set a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      // Mark onboarding as completed
      await apiClient.post('/api/user/onboarding', {
        onboardingCompleted: true,
      });

      // Refresh user context to get updated onboardingCompleted status
      await refresh();

      // Navigate to feed
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      Alert.alert('Error', 'Failed to skip onboarding. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  const handleContinue = async () => {
    // Validation
    if (!formData.displayName.trim()) {
      Alert.alert('Required', 'Please enter your display name');
      return;
    }

    setIsLoading(true);
    try {
      // Save to secure storage for use in next steps
      await SecureStore.setItemAsync('onboarding_profile', JSON.stringify({
        displayName: formData.displayName.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
        profileImage,
      }));

      router.push('/(onboarding)/faith-background');
    } catch (error) {
      console.error('Error saving profile data:', error);
      Alert.alert('Error', 'Failed to save profile data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Set Up Your Profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '33%' }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step 1 of 3
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Photo */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Profile Photo (Optional)
          </Text>
          <Pressable
            onPress={pickImage}
            style={[styles.photoButton, {
              backgroundColor: isDark ? '#1a2a4a' : '#f0f4f8',
              borderColor: colors.borderSubtle
            }]}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profilePhoto} />
            ) : (
              <>
                <Ionicons name="camera" size={32} color={colors.textSecondary} />
                <Text style={[styles.photoText, { color: colors.textSecondary }]}>
                  Add Photo
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Display Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Display Name <Text style={styles.required}>*</Text>
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            How you'll appear to others in the community
          </Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: isDark ? '#1a2a4a' : '#f0f4f8',
              color: colors.textPrimary,
              borderColor: colors.borderSubtle
            }]}
            value={formData.displayName}
            onChangeText={(text) => setFormData({ ...formData, displayName: text })}
            placeholder="Enter your name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            maxLength={50}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Location (Optional)
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Help find local communities and events
          </Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: isDark ? '#1a2a4a' : '#f0f4f8',
              color: colors.textPrimary,
              borderColor: colors.borderSubtle
            }]}
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
            placeholder="City, State"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            maxLength={100}
          />
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Bio (Optional)
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Share a bit about yourself and your faith journey
          </Text>
          <TextInput
            style={[styles.textArea, {
              backgroundColor: isDark ? '#1a2a4a' : '#f0f4f8',
              color: colors.textPrimary,
              borderColor: colors.borderSubtle
            }]}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder="Tell us about yourself..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {formData.bio.length}/500
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
        <Pressable
          style={[styles.button, {
            backgroundColor: formData.displayName.trim() ? colors.primary : colors.borderSubtle,
          }]}
          onPress={handleContinue}
          disabled={!formData.displayName.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={styles.skipButton}
          disabled={isSkipping}
        >
          {isSkipping ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              Skip for now
            </Text>
          )}
        </Pressable>
      </View>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 16,
    paddingTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoText: {
    fontSize: 14,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  required: {
    color: '#ef4444',
  },
  hint: {
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
  },
});
