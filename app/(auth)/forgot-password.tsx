import React, { useState } from 'react';
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
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/lib/apiClient';
import { v4 as uuidv4 } from 'uuid';

type Step = 'request' | 'verify' | 'success';

// Token validation helpers
const TOKEN_REGEX = /^[a-f0-9]{64}$/i;
const TOKEN_LENGTH = 64;

/**
 * Extract and normalize token from user input
 *
 * INVARIANT: MUST match server normalizeToken() exactly:
 * 1. Extract from URL if present
 * 2. Strip whitespace
 * 3. Convert to lowercase
 */
function normalizeToken(input: string): string {
  if (!input) return '';
  let token = input;
  if (token.includes('token=')) {
    const match = token.match(/token=([a-f0-9]+)/i);
    if (match) token = match[1];
  } else if (token.includes('://')) {
    const match = token.match(/[?&]token=([a-f0-9]+)/i);
    if (match) token = match[1];
  }
  // MUST match server: token.replace(/\s+/g, '').trim().toLowerCase()
  return token.replace(/\s+/g, '').trim().toLowerCase();
}

function validateToken(token: string): { valid: boolean; error?: string } {
  if (!token) return { valid: false, error: 'Please enter the reset token from your email' };
  if (token.length !== TOKEN_LENGTH) {
    return { valid: false, error: `Token must be ${TOKEN_LENGTH} characters. Current: ${token.length}` };
  }
  if (!TOKEN_REGEX.test(token)) {
    return { valid: false, error: 'Token contains invalid characters.' };
  }
  return { valid: true };
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTokenChange = (input: string) => {
    const normalized = normalizeToken(input);
    setToken(normalized);
    setTokenError(null);
    if (normalized.length > 0 && normalized.length >= TOKEN_LENGTH) {
      const validation = validateToken(normalized);
      if (!validation.valid) setTokenError(validation.error || null);
    }
  };

  // Handle pasting from clipboard
  const handlePasteLink = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent) {
        const normalized = normalizeToken(clipboardContent);
        setToken(normalized);
        setTokenError(null);

        // Validate and show feedback
        const validation = validateToken(normalized);
        if (validation.valid) {
          Alert.alert('Token Extracted', 'Reset token has been extracted from your clipboard.');
        } else if (normalized.length > 0) {
          setTokenError(validation.error || 'Invalid token');
        }
      } else {
        Alert.alert('Clipboard Empty', 'Please copy the reset link from your email first.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not access clipboard. Please paste the token manually.');
    }
  };

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/api/password-reset/request', { email: email.trim() });

      Alert.alert(
        'Check Your Email',
        'If an account exists with that email, we\'ve sent a password reset link.',
        [{ text: 'OK', onPress: () => setStep('verify') }]
      );
    } catch (error: any) {
      // Don't reveal if email exists or not for security
      Alert.alert(
        'Check Your Email',
        'If an account exists with that email, we\'ve sent a password reset link.',
        [{ text: 'OK', onPress: () => setStep('verify') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const normalizedToken = normalizeToken(token);
    const tokenValidation = validateToken(normalizedToken);

    if (!tokenValidation.valid) {
      setTokenError(tokenValidation.error || 'Invalid token');
      Alert.alert('Invalid Token', tokenValidation.error || 'Please enter a valid reset token');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    // Password strength validation
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      Alert.alert(
        'Weak Password',
        'Password must contain uppercase, lowercase, number, and special character'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    // Generate correlation ID for this request
    const requestId = uuidv4();
    const baseURL = apiClient.defaults.baseURL;

    // Debug logging - ALWAYS log for password reset debugging

    try {
      await apiClient.post('/api/password-reset/reset', {
        token: normalizedToken,
        newPassword
      }, {
        headers: {
          'x-request-id': requestId
        }
      });

      setStep('success');
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorCode = errorData?.code || 'UNKNOWN';
      const serverRequestId = errorData?.requestId || 'none';

      // Log correlation info for debugging

      // Diagnostics only present in dev/debug mode
      if (errorData?.diagnostics) {
      }

      let message = 'Invalid or expired token. Please request a new reset link.';

      if (errorData?.code) {
        switch (errorData.code) {
          case 'TOKEN_INVALID_OR_EXPIRED':
            message = 'This reset token is invalid or has expired. Please request a new one.';
            break;
          case 'TOKEN_USED':
            message = 'This reset token has already been used. Please request a new one.';
            break;
          case 'WEAK_PASSWORD':
            message = errorData.error || 'Password does not meet requirements.';
            break;
          case 'MISSING_FIELDS':
            message = errorData.error || 'Missing required fields.';
            break;
          default:
            message = errorData.error || message;
        }
      } else if (errorData?.error) {
        message = errorData.error;
      }

      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRequestReset}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderVerifyStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep('request')}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Enter New Password</Text>
        <Text style={styles.subtitle}>
          Check your email for the reset token, then enter it below with your new password.
        </Text>
      </View>

      {/* Note about token invalidation */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.infoBannerText}>
          Requesting a new token will invalidate any previous tokens.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reset Token</Text>
          <View style={styles.tokenInputRow}>
            <TextInput
              style={[styles.tokenInput, tokenError && styles.inputError]}
              value={token}
              onChangeText={handleTokenChange}
              placeholder="Paste token from email"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.pasteButton}
              onPress={handlePasteLink}
              disabled={isLoading}
            >
              <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
              <Text style={styles.pasteButtonText}>Paste</Text>
            </TouchableOpacity>
          </View>
          {tokenError && <Text style={styles.errorText}>{tokenError}</Text>}
          <Text style={styles.hint}>
            Token is {TOKEN_LENGTH} characters. Paste the link or token from your email.
            {token.length > 0 && ` Current: ${token.length}`}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.textSecondary}
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
          <Text style={styles.hint}>
            Min 12 chars with uppercase, lowercase, number, and special character
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setStep('request')}
          disabled={isLoading}
        >
          <Text style={styles.linkText}>Request New Token</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color={colors.success} />
      </View>
      <Text style={styles.successTitle}>Password Reset!</Text>
      <Text style={styles.successText}>
        Your password has been successfully reset. You can now sign in with your new password.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'request' && renderRequestStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'success' && renderSuccessStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
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
  tokenInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenInput: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    color: colors.textPrimary,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted || '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  pasteButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  inputError: {
    borderColor: colors.error || '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: colors.error || '#EF4444',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted || '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
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
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
});
