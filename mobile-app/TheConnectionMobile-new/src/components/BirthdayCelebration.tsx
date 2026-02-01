/**
 * BIRTHDAY CELEBRATION MODAL
 * --------------------------
 * Shows a celebratory popup with confetti when it's the user's birthday
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 50;
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

interface ConfettiPieceProps {
  index: number;
  color: string;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ index, color }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(Math.random() * SCREEN_WIDTH);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5 + Math.random() * 0.5);

  useEffect(() => {
    const delay = Math.random() * 2000;
    const duration = 3000 + Math.random() * 2000;
    const swayAmount = 50 + Math.random() * 100;

    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration,
        easing: Easing.linear,
      })
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(translateX.value + swayAmount, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          withTiming(translateX.value - swayAmount, { duration: 500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1
      )
    );

    opacity.value = withDelay(
      delay + duration - 500,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const isCircle = index % 3 === 0;
  const isSquare = index % 3 === 1;

  return (
    <Animated.View
      style={[
        styles.confetti,
        animatedStyle,
        {
          backgroundColor: color,
          borderRadius: isCircle ? 10 : isSquare ? 2 : 0,
          width: isCircle ? 10 : 8,
          height: isCircle ? 10 : isSquare ? 8 : 15,
        },
      ]}
    />
  );
};

interface BirthdayCelebrationProps {
  onDismiss?: () => void;
}

export const BirthdayCelebration: React.FC<BirthdayCelebrationProps> = ({ onDismiss }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);

  const checkBirthday = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch user profile to get birthday
      const response = await fetch(`https://api.theconnection.app/api/users/${user.id}`);
      if (!response.ok) return;

      const data = await response.json();
      const birthday = data.user?.dateOfBirth || data.dateOfBirth || data.user?.birthday || data.birthday;

      if (!birthday) return;

      const today = new Date();
      const birthdayDate = new Date(birthday);

      // Check if today is their birthday (same month and day)
      const isBirthday =
        today.getMonth() === birthdayDate.getMonth() &&
        today.getDate() === birthdayDate.getDate();

      if (!isBirthday) return;

      // Check if we've already shown the celebration today
      const storageKey = `birthday_celebrated_${user.id}_${today.getFullYear()}`;
      const alreadyCelebrated = await AsyncStorage.getItem(storageKey);

      if (alreadyCelebrated) return;

      // Show the celebration!
      setVisible(true);
      setShowConfetti(true);

      // Mark as celebrated for this year
      await AsyncStorage.setItem(storageKey, 'true');
    } catch (error) {
      // Silently fail - don't disrupt the user experience
    }
  }, [user?.id]);

  useEffect(() => {
    // Small delay to let the app load first
    const timer = setTimeout(() => {
      checkBirthday();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkBirthday]);

  useEffect(() => {
    if (visible) {
      modalScale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.out(Easing.back) }),
        withTiming(1, { duration: 150 })
      );
      modalOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [visible]);

  const handleDismiss = () => {
    modalScale.value = withTiming(0.8, { duration: 200 });
    modalOpacity.value = withTiming(0, { duration: 200 });

    setTimeout(() => {
      setVisible(false);
      setShowConfetti(false);
      onDismiss?.();
    }, 200);
  };

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {showConfetti && (
          <View style={styles.confettiContainer} pointerEvents="none">
            {Array.from({ length: CONFETTI_COUNT }).map((_, index) => (
              <ConfettiPiece
                key={index}
                index={index}
                color={CONFETTI_COLORS[index % CONFETTI_COLORS.length]}
              />
            ))}
          </View>
        )}

        {/* Celebration Modal */}
        <Animated.View style={[styles.modal, animatedModalStyle, { backgroundColor: colors.surface }]}>
          {/* Cake Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted || '#FFF4E6' }]}>
            <Text style={styles.cakeEmoji}>🎂</Text>
          </View>

          {/* Birthday Message */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            🎉 Happy Birthday! 🎉
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary }]}>
            We Wish You a Happy and Blessed Birthday!
          </Text>

          <Text style={[styles.subMessage, { color: colors.textMuted }]}>
            May God bless you with joy, peace, and love on your special day and throughout the year ahead.
          </Text>

          {/* Decorative elements */}
          <View style={styles.decorations}>
            <Text style={styles.decorationEmoji}>🎈</Text>
            <Text style={styles.decorationEmoji}>🎁</Text>
            <Text style={styles.decorationEmoji}>✨</Text>
            <Text style={styles.decorationEmoji}>🎈</Text>
          </View>

          {/* Dismiss Button */}
          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleDismiss}
          >
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              Thank You! 🙏
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    top: -20,
  },
  modal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cakeEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 26,
  },
  subMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  decorations: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  decorationEmoji: {
    fontSize: 28,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

export default BirthdayCelebration;
