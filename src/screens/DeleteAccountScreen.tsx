/**
 * Delete Account Screen
 * Required by Apple App Store - users must be able to delete their own accounts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToConsequences, setAgreedToConsequences] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/user/account', {
        data: { password },
      });
    },
    onSuccess: async () => {
      // Clear all local data
      await SecureStore.deleteItemAsync('sessionCookie');

      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted. We\'re sorry to see you go.',
        [
          {
            text: 'OK',
            onPress: () => {
              logout();
              router.replace('/');
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to delete account. Please try again or contact support.'
      );
    },
  });

  const handleDeleteAccount = () => {
    // Validation
    if (!agreedToConsequences) {
      Alert.alert('Confirmation Required', 'Please check the box to confirm you understand the consequences.');
      return;
    }

    if (confirmText !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE to confirm account deletion.');
      return;
    }

    if (!password) {
      Alert.alert('Password Required', 'Please enter your password to confirm account deletion.');
      return;
    }

    // Final confirmation
    Alert.alert(
      '⚠️ Final Confirmation',
      'This action cannot be undone. Are you absolutely sure you want to delete your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => deleteAccountMutation.mutate(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1829" />
        </Pressable>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Section */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={48} color="#E63946" />
          <Text style={styles.warningTitle}>Permanent Action</Text>
          <Text style={styles.warningText}>
            Deleting your account is permanent and cannot be undone.
          </Text>
        </View>

        {/* Consequences List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What will happen:</Text>

          <View style={styles.consequenceItem}>
            <Ionicons name="close-circle" size={24} color="#E63946" />
            <Text style={styles.consequenceText}>
              Your profile will be permanently deleted
            </Text>
          </View>

          <View style={styles.consequenceItem}>
            <Ionicons name="close-circle" size={24} color="#E63946" />
            <Text style={styles.consequenceText}>
              All your posts, comments, and messages will be removed
            </Text>
          </View>

          <View style={styles.consequenceItem}>
            <Ionicons name="close-circle" size={24} color="#E63946" />
            <Text style={styles.consequenceText}>
              You'll lose access to all communities and events
            </Text>
          </View>

          <View style={styles.consequenceItem}>
            <Ionicons name="close-circle" size={24} color="#E63946" />
            <Text style={styles.consequenceText}>
              Your username will be permanently retired
            </Text>
          </View>

          <View style={styles.consequenceItem}>
            <Ionicons name="close-circle" size={24} color="#E63946" />
            <Text style={styles.consequenceText}>
              This action cannot be reversed
            </Text>
          </View>
        </View>

        {/* Alternatives */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consider these alternatives:</Text>

          <Pressable style={styles.alternativeButton} onPress={() => {
            Alert.alert(
              'Temporary Break',
              'You can simply log out and come back whenever you\'re ready. Your account will remain active.',
              [
                { text: 'Stay Logged In', style: 'cancel' },
                { text: 'Log Out', onPress: () => logout() },
              ]
            );
          }}>
            <Ionicons name="time-outline" size={20} color="#222D99" />
            <Text style={styles.alternativeText}>Take a break instead</Text>
            <Ionicons name="chevron-forward" size={20} color="#637083" />
          </Pressable>

          <Pressable style={styles.alternativeButton} onPress={() => router.push('/settings')}>
            <Ionicons name="notifications-off-outline" size={20} color="#222D99" />
            <Text style={styles.alternativeText}>Adjust notification settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#637083" />
          </Pressable>
        </View>

        {/* Confirmation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirm Account Deletion:</Text>

          {/* Agreement Checkbox */}
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setAgreedToConsequences(!agreedToConsequences)}
          >
            <View style={[styles.checkbox, agreedToConsequences && styles.checkboxChecked]}>
              {agreedToConsequences && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxText}>
              I understand this action is permanent and cannot be undone
            </Text>
          </Pressable>

          {/* Type DELETE */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Type <Text style={styles.deleteText}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={styles.input}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="DELETE"
              placeholderTextColor="#637083"
              autoCapitalize="characters"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter your password:</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#637083"
              secureTextEntry
            />
          </View>
        </View>

        {/* Delete Button */}
        <Pressable
          style={[
            styles.deleteButton,
            (!agreedToConsequences || confirmText !== 'DELETE' || !password || deleteAccountMutation.isPending) &&
              styles.deleteButtonDisabled,
          ]}
          onPress={handleDeleteAccount}
          disabled={
            !agreedToConsequences ||
            confirmText !== 'DELETE' ||
            !password ||
            deleteAccountMutation.isPending
          }
        >
          {deleteAccountMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete My Account Permanently</Text>
            </>
          )}
        </Pressable>

        {/* Support Link */}
        <View style={styles.supportSection}>
          <Text style={styles.supportText}>
            Having issues? Contact support at{' '}
            <Text style={styles.supportLink}>support@theconnection.app</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1829',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E63946',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E63946',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#0D1829',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1829',
    marginBottom: 12,
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  consequenceText: {
    flex: 1,
    fontSize: 14,
    color: '#0D1829',
    marginLeft: 12,
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  alternativeText: {
    flex: 1,
    fontSize: 15,
    color: '#0D1829',
    marginLeft: 12,
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D8DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#222D99',
    borderColor: '#222D99',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#0D1829',
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1829',
    marginBottom: 8,
  },
  deleteText: {
    fontWeight: '700',
    color: '#E63946',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D8DE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0D1829',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#D1D8DE',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  supportSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  supportText: {
    fontSize: 13,
    color: '#637083',
    textAlign: 'center',
  },
  supportLink: {
    color: '#222D99',
    fontWeight: '600',
  },
});
