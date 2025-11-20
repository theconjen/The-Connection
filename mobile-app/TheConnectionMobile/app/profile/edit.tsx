/**
 * Edit Profile Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import apiClient from '../../src/lib/apiClient';
import { Colors } from '../../src/shared/colors';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiClient.put('/user/profile', {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      Alert.alert('Success', 'Profile updated!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
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
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          <Text style={[styles.saveText, isLoading && styles.saveTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.username}
              editable={false}
            />
            <Text style={styles.hint}>Username cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={styles.hint}>{bio.length}/200 characters</Text>
          </View>
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="Colors.primary" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  cancelText: { color: 'Colors.primary', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  saveText: { color: 'Colors.primary', fontSize: 16, fontWeight: '600' },
  saveTextDisabled: { opacity: 0.5 },
  content: { flex: 1 },
  avatarSection: { backgroundColor: '#fff', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'Colors.primary', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  changePhotoText: { color: 'Colors.primary', fontSize: 14, fontWeight: '600' },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#d1d5db' },
  inputDisabled: { backgroundColor: '#f3f4f6', color: '#9ca3af' },
  textArea: { minHeight: 100, paddingTop: 12 },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
});
