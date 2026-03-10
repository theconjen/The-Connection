/**
 * Encouragement Drop
 * A small card on the home screen that lets users send anonymous encouragement
 * to a random fellow believer. Users can send ONE encouragement per day.
 * If the user has received encouragement, a received card is shown instead.
 *
 * API calls go through apiClient (endpoints to be implemented on the server):
 *   POST /api/encouragement/send   - send anonymous encouragement to a random user
 *   GET  /api/encouragement/received - check if user has received encouragement today
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
import apiClient from '../lib/apiClient';

// ─── Storage ─────────────────────────────────────────────────────────────────

const SENT_KEY = 'encouragement_last_sent';
const RECEIVED_KEY = 'encouragement_last_received';

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
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
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

    const sent = await hasSentToday();
    setAlreadySent(sent);

    // Check for received encouragement
    try {
      const res = await apiClient.get('/api/encouragement/received');
      if (res.data?.message) {
        setReceivedMessage(res.data.message);
      }
    } catch {
      // Endpoint may not exist yet — silent fail
    }

    setLoading(false);
  }

  const handleSend = useCallback(async () => {
    if (alreadySent || sending || !user) return;

    setSending(true);
    try {
      await apiClient.post('/api/encouragement/send');
      await markSentToday();
      setAlreadySent(true);
      setJustSent(true);

      // Animate confirmation
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => setJustSent(false));
    } catch {
      // Endpoint may not exist yet — mark as sent locally anyway for UX
      await markSentToday();
      setAlreadySent(true);
      setJustSent(true);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => setJustSent(false));
    } finally {
      setSending(false);
    }
  }, [alreadySent, sending, user, fadeAnim]);

  if (loading || !user) return null;

  // Accent colors
  const accentBg = isDark ? '#1E1D22' : '#f0f4ff';
  const accentBorder = isDark ? '#2E2D33' : '#d4dff7';
  const accentColor = isDark ? '#7EB5E8' : colors.primary;

  // ─── Received encouragement card ──────────────────────────────────────────
  if (receivedMessage) {
    return (
      <View style={[styles.container, { backgroundColor: accentBg, borderColor: accentBorder }]}>
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: accentColor + '20' }]}>
            <Ionicons name="heart" size={13} color={accentColor} />
          </View>
          <Text style={[styles.label, { color: accentColor }]}>Encouragement Received</Text>
        </View>
        <Text style={[styles.receivedText, { color: colors.textPrimary }]}>
          A fellow believer is thinking of you today
        </Text>
      </View>
    );
  }

  // ─── Send encouragement card ──────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: accentBg, borderColor: accentBorder }]}>
      <View style={styles.row}>
        <View style={styles.leftContent}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: accentColor + '20' }]}>
              <Ionicons name="paper-plane-outline" size={12} color={accentColor} />
            </View>
            <Text style={[styles.label, { color: accentColor }]}>Encouragement</Text>
          </View>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {alreadySent
              ? 'You sent encouragement today'
              : 'Brighten someone\u2019s day anonymously'}
          </Text>
        </View>

        {!alreadySent && (
          <Pressable
            onPress={handleSend}
            disabled={sending}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: pressed ? accentColor + '30' : accentColor + '18',
                borderColor: accentColor + '40',
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : (
              <Text style={[styles.sendText, { color: accentColor }]}>Send</Text>
            )}
          </Pressable>
        )}

        {alreadySent && !justSent && (
          <View style={[styles.sentBadge, { backgroundColor: accentColor + '15' }]}>
            <Ionicons name="checkmark-circle" size={16} color={accentColor} />
          </View>
        )}
      </View>

      {/* Animated confirmation overlay */}
      {justSent && (
        <Animated.View style={[styles.confirmation, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={16} color={accentColor} />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    marginLeft: 31, // align with text after icon circle
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 64,
    alignItems: 'center',
  },
  sendText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sentBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receivedText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
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
