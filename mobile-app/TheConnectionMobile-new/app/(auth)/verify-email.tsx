import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/shared/colors';
import apiClient from '../../src/lib/apiClient';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || 'your email';
  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email || email === 'your email') {
      Alert.alert('Missing email', 'Return to registration and try again.');
      return;
    }
    setIsSending(true);
    setSentMessage(null);
    try {
      await apiClient.post('/auth/send-verification', { email });
      setSentMessage('A new verification link has been sent.');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Could not resend verification. Please try again soon.';
      Alert.alert('Resend failed', message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={80} color={Colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Check Your Email</Text>

        {/* Message */}
        <Text style={styles.message}>
          We've sent a verification link to
        </Text>
        <Text style={styles.email}>{email}</Text>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Click the link in the email to verify your account and start using The Connection.
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Help text */}
        <Text style={styles.helpText}>
          Didn't receive the email? Check your spam folder or
        </Text>
        
        {/* Resend button */}
        <TouchableOpacity 
          style={styles.resendButton}
          onPress={handleResend}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.resendButtonText}>Request a new link</Text>
          )}
        </TouchableOpacity>

        {sentMessage && <Text style={styles.sentText}>{sentMessage}</Text>}

        {/* Back to login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.backButtonText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b14', // Dark navy background like your screenshot
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  instructions: {
    fontSize: 14,
    color: '#d0d0d0',
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 24,
  },
  helpText: {
    fontSize: 14,
    color: '#808080',
    textAlign: 'center',
    marginBottom: 16,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  sentText: {
    fontSize: 13,
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 14,
    color: '#808080',
    textAlign: 'center',
  },
});
