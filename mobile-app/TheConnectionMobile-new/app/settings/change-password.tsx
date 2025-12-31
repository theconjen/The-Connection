/**
 * Change Password Screen - The Connection App
 * 
 * Fixed version with:
 * - Proper API client usage
 * - Ionicons instead of broken emoji
 * - Better validation UI
 * - Password visibility toggle
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/shared/ThemeProvider';
import { apiClient } from '../../src/lib/apiClient';

interface PasswordRequirement {
  label: string;
  test: (pwd: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 12 characters', test: (pwd) => pwd.length >= 12 },
  { label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'One number', test: (pwd) => /[0-9]/.test(pwd) },
  { label: 'One special character (!@#$%^&*)', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
];

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    for (const req of PASSWORD_REQUIREMENTS) {
      if (!req.test(pwd)) {
        return `Password must have ${req.label.toLowerCase()}`;
      }
    }
    return null;
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Invalid Password', passwordError);
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/api/user/change-password', {
        currentPassword,
        newPassword,
      });

      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to change password';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

  const RequirementCheck = ({ requirement, password }: { requirement: PasswordRequirement; password: string }) => {
    const passed = password.length > 0 && requirement.test(password);
    return (
      <View style={styles.requirement}>
        <Ionicons 
          name={passed ? 'checkmark-circle' : 'ellipse-outline'} 
          size={16} 
          color={passed ? '#10B981' : colors.textSecondary} 
        />
        <Text style={[styles.requirementText, passed && styles.requirementTextPassed]}>
          {requirement.label}
        </Text>
      </View>
    );
  };

  const PasswordInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    showPassword,
    onToggleVisibility,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    showPassword: boolean;
    onToggleVisibility: () => void;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={styles.visibilityToggle}
          onPress={onToggleVisibility}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
            size={22} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={styles.infoBannerText}>
            Choose a strong password to keep your account secure
          </Text>
        </View>

        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter your current password"
          showPassword={showCurrent}
          onToggleVisibility={() => setShowCurrent(!showCurrent)}
        />

        <PasswordInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter your new password"
          showPassword={showNew}
          onToggleVisibility={() => setShowNew(!showNew)}
        />

        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter your new password"
          showPassword={showConfirm}
          onToggleVisibility={() => setShowConfirm(!showConfirm)}
        />

        {confirmPassword.length > 0 && (
          <View style={styles.matchIndicator}>
            <Ionicons 
              name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'} 
              size={16} 
              color={newPassword === confirmPassword ? '#10B981' : colors.destructive} 
            />
            <Text style={styles.matchText}>{newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}</Text>
          </View>
        )}

        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password Requirements</Text>
          {PASSWORD_REQUIREMENTS.map((r) => (
            <RequirementCheck key={r.label} requirement={r} password={newPassword} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.buttonText}>Change Password</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: 4 },
    title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    placeholder: { width: 40 },
    content: { flex: 1, padding: 16 },
    infoBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 20, backgroundColor: `${colors.primary}15`, borderRadius: 10, gap: 10 },
    infoBannerText: { flex: 1, fontSize: 13, color: colors.primary },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
    input: { flex: 1, padding: 16, fontSize: 16, color: colors.text },
    visibilityToggle: { padding: 12 },
    matchIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 16 },
    matchText: { fontSize: 13 },
    requirementsContainer: { backgroundColor: colors.surface, padding: 16, borderRadius: 10, marginBottom: 24 },
    requirementsTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 },
    requirement: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    requirementText: { fontSize: 13, color: colors.textSecondary },
    requirementTextPassed: { color: '#10B981' },
    button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 10, padding: 16, gap: 8 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  });
}
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/shared/ThemeProvider';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 12) {
      return 'Password must be at least 12 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Invalid Password', passwordError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
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
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.input,
      color: colors.text,
      marginBottom: 16,
    },
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: -12,
      marginBottom: 16,
    },
    requirements: {
      backgroundColor: colors.surfaceSecondary,
      padding: 12,
      borderRadius: 8,
      marginBottom: 24,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    requirement: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter your current password"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter your new password"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your new password"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          <Text style={styles.requirement}>• At least 12 characters</Text>
          <Text style={styles.requirement}>• One uppercase letter</Text>
          <Text style={styles.requirement}>• One lowercase letter</Text>
          <Text style={styles.requirement}>• One number</Text>
          <Text style={styles.requirement}>• One special character (!@#$%^&*)</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.buttonText}>Change Password</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
