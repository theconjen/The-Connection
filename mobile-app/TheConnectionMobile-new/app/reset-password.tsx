/**
 * Reset Password Deep Link Handler
 *
 * This screen handles the deep link: theconnection://reset-password?token=...&email=...
 * It auto-fills the token and email from the URL params.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../src/lib/apiClient';
import { v4 as uuidv4 } from 'uuid';

// (E) Verification configuration
const VERIFY_DEBOUNCE_MS = 500; // Debounce token verification
const VERIFY_TIMEOUT_MS = 8000; // 8 second timeout for verify call

// Token validation helpers
const TOKEN_REGEX = /^[a-f0-9]{64}$/i;
const TOKEN_LENGTH = 64;

/**
 * Extract and normalize token from user input
 * Handles: full URLs, "token=" params, raw tokens, whitespace/newlines
 *
 * INVARIANT: MUST match server normalizeToken() exactly:
 * 1. Extract from URL if present
 * 2. Strip whitespace
 * 3. Convert to lowercase
 */
function normalizeToken(input: string): string {
  if (!input) return '';

  let token = input;

  // If input contains a URL or token= param, extract the token
  if (token.includes('token=')) {
    const match = token.match(/token=([a-f0-9]+)/i);
    if (match) {
      token = match[1];
    }
  } else if (token.includes('://')) {
    // Deep link format - try to extract token
    const match = token.match(/[?&]token=([a-f0-9]+)/i);
    if (match) {
      token = match[1];
    }
  }

  // Strip all whitespace and convert to lowercase
  // MUST match server: token.replace(/\s+/g, '').trim().toLowerCase()
  token = token.replace(/\s+/g, '').trim().toLowerCase();

  return token;
}

/**
 * Validate token format
 */
function validateToken(token: string): { valid: boolean; error?: string } {
  if (!token) {
    return { valid: false, error: 'Please enter the reset token from your email' };
  }

  if (token.length !== TOKEN_LENGTH) {
    return {
      valid: false,
      error: `Token must be ${TOKEN_LENGTH} characters. Current length: ${token.length}. Paste the complete token from your email.`
    };
  }

  if (!TOKEN_REGEX.test(token)) {
    return { valid: false, error: 'Token contains invalid characters. It should only contain letters (a-f) and numbers (0-9).' };
  }

  return { valid: true };
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);

  // Extract and normalize token from deep link params
  const initialToken = normalizeToken(params.token || '');

  // Pre-fill from deep link params
  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState(params.email ? decodeURIComponent(params.email) : '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Token verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [tokenVerifyError, setTokenVerifyError] = useState<string | null>(null);
  const [verifyTimedOut, setVerifyTimedOut] = useState(false); // (E) Timeout warning

  // (E) Debounce ref for verification
  const verifyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyAbortRef = useRef<AbortController | null>(null);

  // Token was provided via deep link (and is valid format)
  const hasTokenFromLink = !!initialToken && validateToken(initialToken).valid;

  // State for showing/hiding manual token entry when token came from deep link
  const [showTokenEditor, setShowTokenEditor] = useState(false);

  // (E) Disable submit if token not verified or has errors
  // Exception: if verify timed out, allow submit (server-side protection still active)
  const tokenReady = isTokenVerified || verifyTimedOut;
  const canSubmit = tokenReady && !tokenError && !isVerifying && newPassword.length >= 12 && newPassword === confirmPassword;

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
      console.info('[RESET_PASSWORD] Clipboard error:', error);
      Alert.alert('Error', 'Could not access clipboard. Please paste the token manually.');
    }
  };

  // Debug logging (dev only)
  if (__DEV__) {
    console.info('[RESET_PASSWORD] Initial params:', {
      rawToken: params.token?.substring(0, 10) + '...',
      tokenLen: params.token?.length,
      normalizedTokenLen: initialToken.length,
      email: params.email
    });
  }

  useEffect(() => {
    // If we have a valid token from the deep link, verify it with the server
    if (initialToken && validateToken(initialToken).valid) {
      verifyTokenWithServer(initialToken);
    }
  }, [initialToken]);

  // (E) Verify token with server - includes timeout handling
  const verifyTokenWithServer = useCallback(async (tokenToValidate: string) => {
    const requestId = uuidv4();
    setIsVerifying(true);
    setTokenVerifyError(null);
    setVerifyTimedOut(false);

    // Cancel any previous request
    if (verifyAbortRef.current) {
      verifyAbortRef.current.abort();
    }
    verifyAbortRef.current = new AbortController();

    // (E) Set up timeout - if verify takes > 8s, allow submit with warning
    const timeoutId = setTimeout(() => {
      console.info('[RESET_PASSWORD][VERIFY] stage=TIMEOUT requestId=' + requestId);
      setVerifyTimedOut(true);
      setIsVerifying(false);
      // Don't set error - allow user to proceed with warning
    }, VERIFY_TIMEOUT_MS);

    try {
      console.info('[RESET_PASSWORD][VERIFY] stage=START requestId=' + requestId + ' tokenLen=' + tokenToValidate.length);

      const response = await apiClient.get(`/api/password-reset/verify/${tokenToValidate}`, {
        headers: { 'x-request-id': requestId },
        signal: verifyAbortRef.current.signal,
        timeout: VERIFY_TIMEOUT_MS + 1000, // Slightly longer than our manual timeout
      });

      clearTimeout(timeoutId);

      console.info('[RESET_PASSWORD][VERIFY] stage=RESULT requestId=' + requestId + ' valid=' + response.data.valid);

      if (response.data.valid) {
        setIsTokenVerified(true);
        setTokenVerifyError(null);
        setVerifyTimedOut(false);
      } else {
        setIsTokenVerified(false);
        setTokenVerifyError('This reset link is invalid or has expired.');
        Alert.alert(
          'Invalid Link',
          'This password reset link is invalid or has expired. Please request a new one.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/forgot-password') }]
        );
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Ignore aborted requests (user typed more)
      if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
        console.info('[RESET_PASSWORD][VERIFY] stage=ABORTED requestId=' + requestId);
        return;
      }

      const errorCode = error?.response?.data?.code || 'UNKNOWN';
      const serverRequestId = error?.response?.data?.requestId || 'none';

      console.info('[RESET_PASSWORD][VERIFY] stage=ERROR requestId=' + requestId + ' serverRequestId=' + serverRequestId + ' code=' + errorCode);

      setIsTokenVerified(false);

      // Map error codes to user-friendly messages
      let errorMessage = 'This reset link has expired. Please request a new one.';
      if (errorCode === 'TOKEN_USED') {
        errorMessage = 'This reset token has already been used. Please request a new one.';
      } else if (errorCode === 'TOKEN_INVALID_OR_EXPIRED') {
        errorMessage = 'This reset link is invalid or has expired.';
      }

      setTokenVerifyError(errorMessage);

      Alert.alert(
        'Link Invalid',
        errorMessage,
        [{ text: 'Request New Link', onPress: () => router.replace('/(auth)/forgot-password') }]
      );
    } finally {
      setIsVerifying(false);
    }
  }, [router]);

  // (E) Handle token input change with normalization and debounced validation
  const handleTokenChange = useCallback((input: string) => {
    const normalized = normalizeToken(input);
    setToken(normalized);

    // Clear errors and reset verification when user modifies token
    setTokenError(null);
    setIsTokenVerified(false);
    setTokenVerifyError(null);
    setVerifyTimedOut(false);

    // Clear any pending debounce
    if (verifyDebounceRef.current) {
      clearTimeout(verifyDebounceRef.current);
      verifyDebounceRef.current = null;
    }

    // Validate format and auto-verify with server if valid (debounced)
    if (normalized.length > 0) {
      const validation = validateToken(normalized);
      if (!validation.valid && normalized.length >= TOKEN_LENGTH) {
        setTokenError(validation.error || null);
      } else if (validation.valid) {
        // Token has valid format - verify with server (debounced to avoid spam)
        verifyDebounceRef.current = setTimeout(() => {
          verifyTokenWithServer(normalized);
        }, VERIFY_DEBOUNCE_MS);
      }
    }
  }, [verifyTokenWithServer]);

  const handleResetPassword = async () => {
    // Normalize the token one more time before submission
    const normalizedToken = normalizeToken(token);

    // Validate token format before hitting API
    const tokenValidation = validateToken(normalizedToken);
    if (!tokenValidation.valid) {
      setTokenError(tokenValidation.error || 'Invalid token');
      Alert.alert('Invalid Token', tokenValidation.error || 'Please enter a valid reset token');
      return;
    }

    if (!newPassword || newPassword.length < 12) {
      Alert.alert('Error', 'Password must be at least 12 characters long');
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

    // Debug logging - ALWAYS log for password reset debugging (safe info only)
    console.info('[RESET_PASSWORD] ========== SUBMIT START ==========');
    console.info('[RESET_PASSWORD] x-request-id:', requestId);
    console.info('[RESET_PASSWORD] baseURL:', baseURL);
    console.info('[RESET_PASSWORD] tokenLen:', normalizedToken.length);
    console.info('[RESET_PASSWORD] tokenIsHex:', TOKEN_REGEX.test(normalizedToken));
    console.info('[RESET_PASSWORD] tokenPrefix:', normalizedToken.substring(0, 6));
    console.info('[RESET_PASSWORD] tokenSuffix:', normalizedToken.substring(normalizedToken.length - 6));
    console.info('[RESET_PASSWORD] ===================================');

    try {
      const response = await apiClient.post('/api/password-reset/reset', {
        token: normalizedToken,
        newPassword
      }, {
        headers: {
          'x-request-id': requestId
        }
      });

      console.info('[RESET_PASSWORD] ✅ SUCCESS x-request-id:', requestId, 'status:', response.status);

      setIsSuccess(true);
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorCode = errorData?.code || 'UNKNOWN';
      const serverRequestId = errorData?.requestId || 'none';

      // Log correlation info for debugging
      console.info('[RESET_PASSWORD] ❌ ERROR');
      console.info('[RESET_PASSWORD] client x-request-id:', requestId);
      console.info('[RESET_PASSWORD] server requestId:', serverRequestId);
      console.info('[RESET_PASSWORD] status:', error?.response?.status);
      console.info('[RESET_PASSWORD] code:', errorCode);
      console.info('[RESET_PASSWORD] error:', errorData?.error);

      // Diagnostics only present in dev/debug mode
      if (errorData?.diagnostics) {
        console.info('[RESET_PASSWORD] diagnostics:', JSON.stringify(errorData.diagnostics));
      }

      // Handle structured error responses
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
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success || '#27AE60'} />
          </View>
          <Text style={styles.successTitle}>Password Reset!</Text>
          <Text style={styles.successText}>
            Your password has been successfully reset. You can now sign in with your new password.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {hasTokenFromLink
              ? 'Create a new secure password for your account.'
              : 'Enter the reset token from your email and create a new password.'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Show email if provided */}
          {email && (
            <View style={styles.emailBanner}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.emailText}>{email}</Text>
            </View>
          )}

          {/* Token field - show as read-only if from deep link, otherwise editable */}
          {(!hasTokenFromLink || showTokenEditor) && (
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
                  multiline={false}
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
              {tokenError && (
                <Text style={styles.errorText}>{tokenError}</Text>
              )}
              <Text style={styles.hint}>
                Token is {TOKEN_LENGTH} characters. Paste the link or token from your email.
                {token.length > 0 && ` Current: ${token.length} chars`}
              </Text>
            </View>
          )}

          {hasTokenFromLink && !showTokenEditor && (
            <View style={[
              styles.tokenBanner,
              !isTokenVerified && !isVerifying && tokenVerifyError && styles.tokenBannerError
            ]}>
              {isVerifying ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.tokenBannerText}>Verifying token...</Text>
                </>
              ) : isTokenVerified ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success || '#27AE60'} />
                  <Text style={styles.tokenBannerText}>Reset token verified</Text>
                </>
              ) : (
                <>
                  <Ionicons name="alert-circle" size={20} color={colors.error || '#EF4444'} />
                  <Text style={[styles.tokenBannerText, styles.tokenBannerTextError]}>
                    Token verification failed
                  </Text>
                </>
              )}
              <TouchableOpacity onPress={() => setShowTokenEditor(true)}>
                <Text style={styles.editTokenLink}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}

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

          {/* Important UX messaging */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Only the most recent reset email is valid. If you requested multiple resets, use the link from the latest email.
            </Text>
          </View>

          {/* Show verification status */}
          {isVerifying && (
            <View style={styles.verifyingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.verifyingText}>Verifying token...</Text>
            </View>
          )}

          {tokenVerifyError && !isVerifying && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.error || '#EF4444'} />
              <Text style={styles.errorBoxText}>{tokenVerifyError}</Text>
            </View>
          )}

          {/* (E) Timeout warning - verification timed out but user can still try */}
          {verifyTimedOut && !isTokenVerified && !tokenVerifyError && (
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={18} color={colors.warning || '#F59E0B'} />
              <Text style={styles.warningBoxText}>
                Token verification timed out. You can still try to reset your password - the server will validate the token.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, (!canSubmit || isLoading) && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={!canSubmit || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground || '#fff'} />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          {/* (F) Request new link button - clears token and navigates */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              // Clear token state before navigating
              setToken('');
              setTokenError(null);
              setIsTokenVerified(false);
              setTokenVerifyError(null);
              setVerifyTimedOut(false);
              router.replace('/(auth)/forgot-password');
            }}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>Request New Link</Text>
          </TouchableOpacity>
        </View>
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
  emailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted || '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  emailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tokenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBackground || '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  tokenBannerText: {
    fontSize: 14,
    color: colors.success || '#27AE60',
    fontWeight: '500',
  },
  tokenBannerError: {
    backgroundColor: colors.errorBackground || '#FEE2E2',
  },
  tokenBannerTextError: {
    color: colors.error || '#EF4444',
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
  editTokenLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 'auto',
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
    color: colors.primaryForeground || '#fff',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted || '#f0f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  verifyingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  verifyingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.errorBackground || '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorBoxText: {
    flex: 1,
    fontSize: 13,
    color: colors.error || '#EF4444',
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningBackground || '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  warningBoxText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning || '#B45309',
    lineHeight: 18,
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
