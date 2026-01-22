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
  Image,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/lib/apiClient';

export default function LoginScreen() {
  const router = useRouter();
  const { verified } = useLocalSearchParams();
  const isVerified = verified === '1' || verified === 'true';
  const { login, isAuthenticated, user, refresh } = useAuth();
  const { colors, colorScheme } = useTheme();
  const styles = getStyles(colors, colorScheme);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Email verification state
  const [showVerificationNeeded, setShowVerificationNeeded] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // If app was opened from a verification link, refresh session and auto-route if already authenticated
  useEffect(() => {
    if (isVerified) {
      refresh().catch(() => {});
    }
  }, [isVerified, refresh]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user has completed onboarding
      if (user.onboardingCompleted) {
        router.replace('/(tabs)/feed');
      } else {
        // First time user - show onboarding
        router.replace('/(onboarding)/welcome');
      }
    }
  }, [isAuthenticated, user, router]);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Error', 'Please enter your username and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      // Navigation is handled by useEffect based on onboardingCompleted status
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
      const response = await apiClient.post('/api/auth/send-verification', {
        email: unverifiedEmail,
      });

      Alert.alert(
        'Email Sent',
        'A verification email has been sent. Please check your inbox and spam folder.'
      );

      // Set cooldown (5 minutes = 300 seconds, or use server-provided value)
      setResendCooldown(300);
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limited - show remaining time
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
              <Ionicons name="mail-outline" size={64} color={colors.primary} />
            </View>
            <Text style={styles.verificationTitle}>Verify Your Email</Text>
            <Text style={styles.verificationSubtitle}>
              Your email address hasn't been verified yet. Please check your inbox for a verification link.
            </Text>

            <View style={styles.emailBox}>
              <Ionicons name="mail" size={20} color={colors.textSecondary} />
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
                <ActivityIndicator color={colors.primaryForeground} />
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
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
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
          <Image
            source={require('../../assets/tc-logo-hd.png')}
            style={[
              styles.logo,
              colorScheme === 'dark' && { tintColor: colors.textPrimary }
            ]}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          {isVerified && (
            <View style={styles.successPill}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
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
                  color={colors.textSecondary}
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
              <ActivityIndicator color={colors.primaryForeground} />
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

          <View style={styles.termsContainer}>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://theconnection.app/terms')}
              disabled={isLoading}
            >
              <Text style={styles.termsLink}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}> • </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://theconnection.app/privacy')}
              disabled={isLoading}
            >
              <Text style={styles.termsLink}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, colorScheme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 700,
    height: 150,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  successPill: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    color: colors.success,
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
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    color: colors.textPrimary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeIcon: {
    padding: 16,
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
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  termsText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  termsLink: {
    color: colors.textSecondary,
    fontSize: 12,
    textDecorationLine: 'underline',
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
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  emailBoxText: {
    fontSize: 15,
    color: colors.textPrimary,
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
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 20,
  },
});
