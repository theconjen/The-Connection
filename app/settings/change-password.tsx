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
import { useTheme } from '../../src/contexts/ThemeContext';

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
      borderBottomColor: colors.borderSubtle,
    },
    backButton: {
      padding: 8,
    },
    backIcon: {
      fontSize: 24,
      color: colors.textPrimary,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
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
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.input,
      color: colors.textPrimary,
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
      color: colors.textPrimary,
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
