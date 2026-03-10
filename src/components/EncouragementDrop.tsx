/**
 * Encouragement Drop
 * A small card on the home screen that lets users send anonymous encouragement
 * to a random fellow believer. Users can send ONE encouragement per day.
 * If the user has received encouragement, a received card is shown instead.
 *
 * API endpoints:
 *   POST /api/encouragement/send    - send anonymous encouragement to a random user
 *   GET  /api/encouragement/received - check if user has received encouragement today
 *   GET  /api/encouragement/status   - check if user already sent today
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { encouragementAPI } from '../lib/apiClient';

// ─── Local Storage (offline-first) ──────────────────────────────────────────

const SENT_KEY = 'encouragement_last_sent';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

async function hasSentToday(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(SENT_KEY);
    return val === todayKey();
  } catch {
    return false;
  }
}

async function markSentToday(): Promise<void> {
  try {
    await AsyncStorage.setItem(SENT_KEY, todayKey());
  } catch {
    // Silent fail
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EncouragementDrop() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [alreadySent, setAlreadySent] = useState(false);
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [receivedMessage, setReceivedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Subtle fade animation for the "sent" confirmation
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Check state on mount
  useEffect(() => {
    initialize();
  }, [user]);

  async function initialize() {
    if (!user) {
      setLoading(false);
      return;
    }

    // Check local storage first (instant UI)
    const sentLocally = await hasSentToday();
    setAlreadySent(sentLocally);

    // Then sync with server
    try {
      const [statusRes, receivedRes] = await Promise.allSettled([
        encouragementAPI.getStatus(),
        encouragementAPI.getReceived(),
      ]);

      // Sync sent status from server (overrides local if server says sent)
      if (statusRes.status === 'fulfilled' && statusRes.value?.alreadySent) {
        setAlreadySent(true);
        await markSentToday();
      }

      // Check for received encouragement
      if (receivedRes.status === 'fulfilled' && receivedRes.value?.received) {
        setReceivedMessage(receivedRes.value.message);
      }
    } catch {
      // Server unreachable — local state is fine
    }

    setLoading(false);
  }

  const handleSend = useCallback(async () => {
    if (alreadySent || sending || !user) return;

    setSending(true);
    try {
      await encouragementAPI.send();
      await markSentToday();
      setAlreadySent(true);
      setJustSent(true);
      playConfirmation();
    } catch (err: any) {
      // 429 = already sent today (race condition or multi-device)
      if (err?.response?.status === 429) {
        await markSentToday();
        setAlreadySent(true);
        setJustSent(true);
        playConfirmation();
      }
      // Other errors: don't mark as sent, let user retry
    } finally {
      setSending(false);
    }
  }, [alreadySent, sending, user, fadeAnim]);

  function playConfirmation() {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => setJustSent(false));
  }

  if (loading || !user) return null;

  const accentColor = colors.primary;

  // ─── Received encouragement card ──────────────────────────────────────────
  if (receivedMessage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: accentColor + '15' }]}>
            <Ionicons name="heart" size={15} color={accentColor} />
          </View>
          <View style={styles.leftContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Encouragement Received</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Someone is thinking of you and praying for you today
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ─── Send encouragement card ──────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: accentColor + '15' }]}>
          <Ionicons name={alreadySent ? 'heart' : 'heart-outline'} size={15} color={accentColor} />
        </View>
        <View style={styles.leftContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {alreadySent ? 'Encouragement Sent' : 'Send Encouragement'}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {alreadySent
              ? 'You brightened someone\u2019s day today'
              : 'Anonymously encourage a fellow believer'}
          </Text>
        </View>

        {!alreadySent && (
          <Pressable
            onPress={handleSend}
            disabled={sending}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: pressed ? accentColor : accentColor + 'E6',
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="paper-plane" size={14} color="#fff" />
            )}
          </Pressable>
        )}

        {alreadySent && !justSent && (
          <View style={[styles.sentBadge, { backgroundColor: accentColor + '15' }]}>
            <Ionicons name="checkmark" size={15} color={accentColor} />
          </View>
        )}
      </View>

      {/* Animated confirmation overlay */}
      {justSent && (
        <Animated.View style={[styles.confirmation, { opacity: fadeAnim }]}>
          <Ionicons name="heart" size={14} color={accentColor} />
          <Text style={[styles.confirmText, { color: accentColor }]}>Sent with love</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  confirmText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
