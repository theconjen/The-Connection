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
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/lib/apiClient';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, colorScheme } = useTheme();
  const styles = getStyles(colors);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: null as Date | null,
    ageConfirmed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate max date (today) and default date (18 years ago for better UX)
  const today = new Date();
  const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const defaultPickerDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

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

    // Age Assurance: Must confirm 13+
    if (!formData.ageConfirmed) {
      Alert.alert('Age Confirmation Required', 'Please confirm that you are 13 years or older to continue.');
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
      // Format DOB as ISO date string (YYYY-MM-DD) if provided (optional)
      const dobString = formData.dateOfBirth
        ? formData.dateOfBirth.toISOString().split('T')[0]
        : undefined;

      const result = await register({
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        dob: dobString,
        ageConfirmed: true,
      });

      // Registration successful - show verification pending screen
      setRegisteredEmail(result.email || formData.email.trim());
      setShowVerificationPending(true);
    } catch (error: any) {
      // Handle AGE_RESTRICTED error specially
      if (error.code === 'AGE_RESTRICTED' || error.message?.includes('13 or older')) {
        Alert.alert(
          'Age Restriction',
          'You must be 13 or older to use this app.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Registration Failed', error.message || 'Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail || isResending || resendCooldown > 0) return;

    setIsResending(true);
    try {
      await apiClient.post('/api/auth/send-verification', {
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
              <Ionicons name="mail-unread-outline" size={80} color={colors.primary} />
            </View>

            <Text style={styles.verificationTitle}>Check Your Email</Text>

            <Text style={styles.verificationSubtitle}>
              We've sent a verification link to:
            </Text>

            <View style={styles.emailBox}>
              <Ionicons name="mail" size={20} color={colors.textSecondary} />
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
              onPress={handleGoToLogin}
            >
              <Text style={styles.secondaryButtonText}>Go to Sign In</Text>
            </TouchableOpacity>

            <View style={styles.helpContainer}>
              <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
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
          <Image
            source={require('../../assets/tc-logo-hd.png')}
            style={[
              styles.logo,
              colorScheme === 'dark' && { tintColor: colors.textPrimary }
            ]}
            resizeMode="contain"
          />
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

          {/* Age Confirmation - Required */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setFormData({ ...formData, ageConfirmed: !formData.ageConfirmed })}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              { borderColor: colors.borderSubtle },
              formData.ageConfirmed && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}>
              {formData.ageConfirmed && (
                <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I confirm that I am 13 years of age or older *
            </Text>
          </TouchableOpacity>

          {/* Date of Birth - Optional (for birthday notifications) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth (optional)</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
              disabled={isLoading}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={[
                styles.datePickerText,
                !formData.dateOfBirth && styles.datePickerPlaceholder
              ]}>
                {formData.dateOfBirth
                  ? formData.dateOfBirth.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'Select your date of birth'
                }
              </Text>
            </TouchableOpacity>
            <Text style={styles.ageHint}>Add your birthday to receive a special birthday message</Text>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.dateOfBirth || defaultPickerDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={maxDate}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }
                if (event.type === 'set' && selectedDate) {
                  setFormData({ ...formData, dateOfBirth: selectedDate });
                }
                if (Platform.OS === 'ios' && event.type === 'dismissed') {
                  setShowDatePicker(false);
                }
              }}
              themeVariant={colorScheme}
            />
          )}

          {/* iOS: Show done button for date picker */}
          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity
              style={styles.datePickerDoneButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}

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
                  color={colors.textSecondary}
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
                  color={colors.textSecondary}
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
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>By creating an account, you agree to our </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://theconnection.app/terms')}
              disabled={isLoading}
            >
              <Text style={styles.termsLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}> and </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://theconnection.app/privacy')}
              disabled={isLoading}
            >
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

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

const getStyles = (colors: any) => StyleSheet.create({
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: colors.textSecondary,
  },
  ageHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  datePickerDoneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  datePickerDoneText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
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
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  termsText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  emailBoxText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  verificationInstructions: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.primary,
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
    color: colors.textSecondary,
    lineHeight: 20,
  },
});