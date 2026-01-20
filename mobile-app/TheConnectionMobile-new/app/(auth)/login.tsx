import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors } from '../../src/shared/colors';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/lib/apiClient';

export default function LoginScreen() {
  const router = useRouter();
  const { verified } = useLocalSearchParams();
  const isVerified = verified === '1' || verified === 'true';
  const { login, isAuthenticated, refresh } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Email verification state
  const [showVerificationNeeded, setShowVerificationNeeded] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // If app was opened from a verification link, refresh session and auto-route if already authenticated
  useEffect(() => {
    if (isVerified) {
      refresh().catch(() => {});
    }
  }, [isVerified, refresh]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/feed');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Error', 'Please enter your username and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      router.replace('/(tabs)/feed');
    } catch (error: any) {
      // Handle EMAIL_NOT_VERIFIED error specially
      if (error.code === 'EMAIL_NOT_VERIFIED' && error.email) {
        setUnverifiedEmail(error.email);
        setShowVerificationNeeded(true);
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail || isResending || resendCooldown > 0) return;

    setIsResending(true);
    try {
      await apiClient.post('/auth/send-verification', {
        email: unverifiedEmail,
      });

      Alert.alert(
        'Email Sent',
        'A verification email has been sent. Please check your inbox and spam folder.'
      );

      // Set cooldown (5 minutes = 300 seconds)
      setResendCooldown(300);
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfterSeconds || 300;
        setResendCooldown(retryAfter);
        Alert.alert(
          'Please Wait',
          `You can request another verification email in ${Math.ceil(retryAfter / 60)} minutes.`
        );
      } else {
        Alert.alert('Error', 'Failed to send verification email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    setShowVerificationNeeded(false);
    setUnverifiedEmail('');
    setPassword('');
  };

  // Show verification needed screen
  if (showVerificationNeeded) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.verificationContainer}>
            <View style={styles.verificationIcon}>
              <Ionicons name="mail-outline" size={64} color={Colors.primary} />
            </View>
            <Text style={styles.verificationTitle}>Verify Your Email</Text>
            <Text style={styles.verificationSubtitle}>
              Your email address hasn't been verified yet. Please check your inbox for a verification link.
            </Text>

            <View style={styles.emailBox}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.emailBoxText}>{unverifiedEmail}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (isResending || resendCooldown > 0) && styles.buttonDisabled,
              ]}
              onPress={handleResendVerification}
              disabled={isResending || resendCooldown > 0}
            >
              {isResending ? (
                <ActivityIndicator color="#fff" />
              ) : resendCooldown > 0 ? (
                <Text style={styles.buttonText}>
                  Resend in {Math.floor(resendCooldown / 60)}:{(resendCooldown % 60).toString().padStart(2, '0')}
                </Text>
              ) : (
                <Text style={styles.buttonText}>Resend Verification Email</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBackToLogin}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Back to Login</Text>
            </TouchableOpacity>

            <Text style={styles.helpText}>
              Didn't receive the email? Check your spam folder or try a different email address.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          {isVerified && (
            <View style={styles.successPill}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={styles.successText}>Email verified. You can sign in now.</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username or Email</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username or email"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              disabled={isLoading}
            >
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  successPill: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#ecfdf3',
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Verification needed styles
  verificationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  verificationIcon: {
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  emailBoxText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 20,
  },
});
