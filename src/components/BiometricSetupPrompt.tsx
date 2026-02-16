/**
 * Biometric Setup Prompt
 *
 * Shows after successful login to offer Face ID / Touch ID setup
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export function BiometricSetupPrompt() {
  const { colors } = useTheme();
  const {
    biometricType,
    shouldPromptBiometricSetup,
    enableBiometric,
    dismissBiometricPrompt,
  } = useAuth();

  if (!shouldPromptBiometricSetup) {
    return null;
  }

  const iconName = biometricType.includes('Face')
    ? 'scan-outline'
    : 'finger-print-outline';

  const handleEnable = async () => {
    await enableBiometric();
  };

  const handleSkip = () => {
    dismissBiometricPrompt();
  };

  return (
    <Modal
      visible={shouldPromptBiometricSetup}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name={iconName} size={48} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Enable {biometricType}?
          </Text>

          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Sign in faster next time using {biometricType} instead of typing your password.
          </Text>

          <Pressable
            style={[styles.enableButton, { backgroundColor: colors.primary }]}
            onPress={handleEnable}
          >
            <Ionicons name={iconName} size={20} color="#fff" />
            <Text style={styles.enableButtonText}>Enable {biometricType}</Text>
          </Pressable>

          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={[styles.skipButtonText, { color: colors.mutedForeground }]}>
              Not now
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
