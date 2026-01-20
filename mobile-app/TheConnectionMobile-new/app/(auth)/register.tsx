import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors } from '../../src/shared/colors';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/lib/apiClient';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verification pending state
  const [showVerificationPending, setShowVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleRegister = async () => {
    // Validation
    if (!formData.email.trim() || !formData.username.trim() || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
      });

      // Registration successful - show verification pending screen
      setRegisteredEmail(result.email || formData.email.trim());
      setShowVerificationPending(true);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail || isResending || resendCooldown > 0) return;

    setIsResending(true);
    try {
      await apiClient.post('/auth/send-verification', {
        email: registeredEmail,
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

  const handleGoToLogin = () => {
    router.replace('/(auth)/login');
  };

  // Show verification pending screen after successful registration
  if (showVerificationPending) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.verificationScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.verificationContainer}>
            <View style={styles.verificationIcon}>
              <Ionicons name="mail-unread-outline" size={80} color={Colors.primary} />
            </View>

            <Text style={styles.verificationTitle}>Check Your Email</Text>

            <Text style={styles.verificationSubtitle}>
              We've sent a verification link to:
            </Text>

            <View style={styles.emailBox}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.emailBoxText}>{registeredEmail}</Text>
            </View>

            <Text style={styles.verificationInstructions}>
              Click the link in the email to verify your account. Once verified, you can sign in and start using The Connection.
            </Text>

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
              onPress={handleGoToLogin}
            >
              <Text style={styles.secondaryButtonText}>Go to Sign In</Text>
            </TouchableOpacity>

            <View style={styles.helpContainer}>
              <Ionicons name="help-circle-outline" size={20} color="#666" />
              <Text style={styles.helpText}>
                Didn't receive the email? Check your spam folder, or try resending.
              </Text>
            </View>
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join The Connection community</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(email) => setFormData({ ...formData, email })}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(username) => setFormData({ ...formData, username })}
              placeholder="Choose a username"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(firstName) => setFormData({ ...formData, firstName })}
                placeholder="First name"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(lastName) => setFormData({ ...formData, lastName })}
                placeholder="Last name"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(password) => setFormData({ ...formData, password })}
                placeholder="Create a password (min 8 characters)"
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.confirmPassword}
                onChangeText={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              disabled={isLoading}
            >
              <Text style={styles.link}>Sign In</Text>
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
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
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
  // Verification pending styles
  verificationScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  verificationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
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
    marginBottom: 12,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  emailBoxText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  verificationInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});