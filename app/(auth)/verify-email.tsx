import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/lib/apiClient';

const themes = {
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    title: '#1E293B',
    text: '#64748B',
    textMuted: '#94A3B8',
    email: '#0F172A',
    accent: '#6366F1',
    accentLight: 'rgba(99, 102, 241, 0.1)',
    accentMedium: 'rgba(99, 102, 241, 0.15)',
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.1)',
    divider: '#E2E8F0',
    buttonBg: '#6366F1',
    buttonText: '#FFFFFF',
    secondaryButtonBorder: '#E2E8F0',
    secondaryButtonText: '#64748B',
  },
  dark: {
    background: '#0A0B14',
    card: '#141625',
    cardBorder: '#1E2035',
    title: '#FFFFFF',
    text: '#A0AEC0',
    textMuted: '#718096',
    email: '#FFFFFF',
    accent: '#818CF8',
    accentLight: 'rgba(129, 140, 248, 0.1)',
    accentMedium: 'rgba(129, 140, 248, 0.15)',
    success: '#34D399',
    successBg: 'rgba(52, 211, 153, 0.1)',
    divider: 'rgba(255, 255, 255, 0.08)',
    buttonBg: '#6366F1',
    buttonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(255, 255, 255, 0.15)',
    secondaryButtonText: '#A0AEC0',
  },
};

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || 'your email';
  const sentParam = params.sent as string | undefined;
  const initialSendFailed = sentParam === '0';
  
  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    if (sentMessage) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setSentMessage(null));
    }
  }, [sentMessage]);

  const handleResend = async () => {
    if (!email || email === 'your email') {
      Alert.alert('Missing email', 'Return to registration and try again.');
      return;
    }
    setIsSending(true);
    setSentMessage(null);
    try {
      await apiClient.post('/auth/send-verification', { email });
      setSentMessage('Verification link sent!');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Could not resend verification. Please try again soon.';
      Alert.alert('Resend failed', message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accentLight }]}>
          <View style={[styles.iconInner, { backgroundColor: colors.accentMedium }]}>
            <Ionicons name="mail" size={48} color={colors.accent} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.title }]}>Check Your Email</Text>

        {initialSendFailed ? (
          <View style={styles.messageContainer}>
            <Text style={[styles.message, { color: colors.text }]}>
              We couldn't send your verification email automatically.
            </Text>
            <Text style={[styles.message, { color: colors.text, marginTop: 4 }]}>
              Tap below to request a new link for:
            </Text>
          </View>
        ) : (
          <Text style={[styles.message, { color: colors.text }]}>
            We've sent a verification link to
          </Text>
        )}
        
        <Text style={[styles.email, { color: colors.email }]}>{email}</Text>

        <View style={[styles.instructionsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.instructionIcon, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="finger-print" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.instructions, { color: colors.text }]}>
            Click the link in the email to verify your account and start using The Connection.
          </Text>
        </View>

        {sentMessage && (
          <Animated.View 
            style={[
              styles.successToast, 
              { backgroundColor: colors.successBg, opacity: fadeAnim }
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success }]}>{sentMessage}</Text>
          </Animated.View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: colors.buttonBg }]}
            onPress={handleResend}
            disabled={isSending}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color={colors.buttonText} style={styles.buttonIcon} />
                <Text style={[styles.primaryButtonText, { color: colors.buttonText }]}>
                  Resend Verification Email
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.secondaryButtonBorder }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={colors.secondaryButtonText} style={styles.buttonIcon} />
            <Text style={[styles.secondaryButtonText, { color: colors.secondaryButtonText }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.helpText, { color: colors.textMuted }]}>
          Didn't receive it? Check your spam folder
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  messageContainer: {
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    gap: 14,
  },
  instructionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
    marginBottom: 24,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  helpText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
