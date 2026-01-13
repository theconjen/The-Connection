/**
 * CHANGE PASSWORD SCREEN - The Connection Mobile App
 * --------------------------------------------------
 * Allow authenticated users to change their password
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../src/lib/apiClient';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiClient.post('/user/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert(
        'Success',
        'Your password has been changed successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      Alert.alert('Error', errorMessage);
    },
  });

  const validatePassword = (password: string): string | null => {
    if (password.length < 12) {
      return 'Password must be at least 12 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSave = () => {
    // Validate all fields are filled
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      Alert.alert('Required Fields', 'Please fill in all password fields');
      return;
    }

    // Validate new password strength
    const validationError = validatePassword(formData.newPassword);
    if (validationError) {
      Alert.alert('Invalid Password', validationError);
      return;
    }

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match');
      return;
    }

    // Submit password change
    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color="#2563EB" />
          <Text style={styles.infoText}>
            Choose a strong password to keep your account secure.
          </Text>
        </View>

        {/* Current Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter current password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showCurrentPassword}
              value={formData.currentPassword}
              onChangeText={(text) => updateField('currentPassword', text)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter new password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showNewPassword}
              value={formData.newPassword}
              onChangeText={(text) => updateField('newPassword', text)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
        </View>

        {/* Password Requirements */}
        <View style={styles.requirementsBox}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          <View style={styles.requirement}>
            <Ionicons
              name={formData.newPassword.length >= 12 ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={formData.newPassword.length >= 12 ? '#10B981' : colors.mutedForeground}
            />
            <Text style={styles.requirementText}>At least 12 characters</Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name={/[A-Z]/.test(formData.newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={/[A-Z]/.test(formData.newPassword) ? '#10B981' : colors.mutedForeground}
            />
            <Text style={styles.requirementText}>One uppercase letter</Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name={/[a-z]/.test(formData.newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={/[a-z]/.test(formData.newPassword) ? '#10B981' : colors.mutedForeground}
            />
            <Text style={styles.requirementText}>One lowercase letter</Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name={/[0-9]/.test(formData.newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={/[0-9]/.test(formData.newPassword) ? '#10B981' : colors.mutedForeground}
            />
            <Text style={styles.requirementText}>One number</Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name={/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? '#10B981' : colors.mutedForeground}
            />
            <Text style={styles.requirementText}>One special character</Text>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
          {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}
        </View>

        {/* Save Button */}
        <Pressable
          style={[
            styles.saveButton,
            changePasswordMutation.isPending && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={changePasswordMutation.isPending}
        >
          <Text style={styles.saveButtonText}>
            {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
          </Text>
        </Pressable>

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
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
    },
    placeholder: {
      width: 32,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    infoBox: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      backgroundColor: '#EFF6FF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#BFDBFE',
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: '#1E40AF',
      lineHeight: 20,
    },
    field: {
      marginBottom: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 8,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
    },
    eyeButton: {
      padding: 12,
    },
    requirementsBox: {
      backgroundColor: colors.muted,
      padding: 16,
      borderRadius: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 12,
    },
    requirement: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    requirementText: {
      fontSize: 13,
      color: colors.mutedForeground,
    },
    errorText: {
      fontSize: 13,
      color: '#DC2626',
      marginTop: 4,
    },
    saveButton: {
      backgroundColor: '#222D99',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });
