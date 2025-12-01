import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/shared/ThemeProvider';
import { Picker } from '@react-native-picker/picker';

type ProfileVisibility = 'public' | 'friends' | 'private';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public');
  const [showLocation, setShowLocation] = useState(false);
  const [showInterests, setShowInterests] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      setProfileVisibility(data.profileVisibility || 'public');
      setShowLocation(data.showLocation || false);
      setShowInterests(data.showInterests || false);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          profileVisibility,
          showLocation,
          showInterests,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      Alert.alert('Success', 'Privacy settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 60,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    backIcon: {
      fontSize: 24,
      color: colors.text,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.surface,
      marginTop: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 24,
      backgroundColor: colors.surfaceSecondary,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    pickerContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    pickerLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    picker: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      color: colors.text,
    },
    saveButton: {
      backgroundColor: colors.primary,
      margin: 16,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Privacy Settings</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Visibility */}
        <Text style={styles.sectionHeader}>PROFILE VISIBILITY</Text>
        <View style={styles.section}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Who can see your profile?</Text>
            <Picker
              selectedValue={profileVisibility}
              onValueChange={(value) => setProfileVisibility(value as ProfileVisibility)}
              style={styles.picker}
            >
              <Picker.Item label="Everyone (Public)" value="public" />
              <Picker.Item label="Friends Only" value="friends" />
              <Picker.Item label="Only Me (Private)" value="private" />
            </Picker>
          </View>
        </View>

        {/* Location & Interests */}
        <Text style={styles.sectionHeader}>PERSONAL INFORMATION</Text>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Show Location</Text>
              <Text style={styles.settingSubtitle}>
                Display your city/state on your profile
              </Text>
            </View>
            <Switch
              value={showLocation}
              onValueChange={setShowLocation}
              trackColor={{ false: colors.muted, true: colors.accent }}
              thumbColor={showLocation ? colors.primary : colors.surface}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Show Interests</Text>
              <Text style={styles.settingSubtitle}>
                Display your interests on your profile
              </Text>
            </View>
            <Switch
              value={showInterests}
              onValueChange={setShowInterests}
              trackColor={{ false: colors.muted, true: colors.accent }}
              thumbColor={showInterests ? colors.primary : colors.surface}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
