/**
 * On This Day Card
 * Shows a memory from the user's past activity, e.g.
 * "30 days ago, you read Romans 8:28" or "2 weeks ago, you joined Theology."
 *
 * Activity is tracked locally in AsyncStorage. The card only shows if there
 * is a memory at least 7 days old.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

// ─── Storage keys ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'on_this_day_events';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MemoryEventType = 'verse_read' | 'community_joined' | 'post_created' | 'event_attended' | 'prayer_submitted';

export interface MemoryEvent {
  type: MemoryEventType;
  label: string;      // e.g. "Romans 8:28", "Theology community"
  timestamp: number;   // epoch ms
}

// ─── Public helpers for recording events from elsewhere in the app ───────────

export async function recordMemoryEvent(event: Omit<MemoryEvent, 'timestamp'>): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const events: MemoryEvent[] = raw ? JSON.parse(raw) : [];

    events.push({ ...event, timestamp: Date.now() });

    // Keep at most 500 events to avoid unbounded growth
    const trimmed = events.length > 500 ? events.slice(-500) : events;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent fail — non-critical feature
  }
}

export async function getMemoryEvents(): Promise<MemoryEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

function formatTimeAgo(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  if (days >= 14) {
    const weeks = Math.floor(days / 7);
    return `${weeks} weeks ago`;
  }
  if (days >= 7) {
    return '1 week ago';
  }
  return `${days} days ago`;
}

function describeEvent(event: MemoryEvent, timeAgo: string): string {
  switch (event.type) {
    case 'verse_read':
      return `${timeAgo}, you read ${event.label}`;
    case 'community_joined':
      return `${timeAgo}, you joined ${event.label}`;
    case 'post_created':
      return `${timeAgo}, you shared a post in ${event.label}`;
    case 'event_attended':
      return `${timeAgo}, you attended ${event.label}`;
    case 'prayer_submitted':
      return `${timeAgo}, you lifted up a prayer in ${event.label}`;
    default:
      return `${timeAgo}, something meaningful happened`;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnThisDayCard() {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [memory, setMemory] = useState<string | null>(null);

  useEffect(() => {
    loadMemory();
  }, []);

  async function loadMemory() {
    const events = await getMemoryEvents();
    if (events.length === 0) return;

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    // Find events that are at least 7 days old, sorted by how close they are
    // to a "round" time ago (prefer 30 days, 2 weeks, 1 month, etc.)
    const candidates = events
      .filter(e => (now - e.timestamp) >= sevenDaysMs)
      .map(e => ({
        event: e,
        ageMs: now - e.timestamp,
      }))
      .sort((a, b) => {
        // Prefer older, more interesting memories
        // Prioritize round numbers of weeks/months
        const aWeeks = Math.round(a.ageMs / (7 * 24 * 60 * 60 * 1000));
        const bWeeks = Math.round(b.ageMs / (7 * 24 * 60 * 60 * 1000));
        // Prefer events closer to exact week boundaries
        const aRemainder = a.ageMs % (7 * 24 * 60 * 60 * 1000);
        const bRemainder = b.ageMs % (7 * 24 * 60 * 60 * 1000);
        return aRemainder - bRemainder;
      });

    if (candidates.length === 0) return;

    // Pick a deterministic candidate based on day of year so it's stable for the day
    const dayOfYear = Math.floor(
      (now - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    const selected = candidates[dayOfYear % candidates.length];
    const timeAgo = formatTimeAgo(selected.ageMs);
    setMemory(describeEvent(selected.event, timeAgo));
  }

  if (!memory) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1E1D22' : '#f0f4ff',
          borderColor: isDark ? '#2E2D33' : '#d4dff7',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="sparkles-outline" size={13} color={colors.primary} />
        </View>
        <Text style={[styles.label, { color: colors.primary }]}>
          On This Day
        </Text>
      </View>

      <Text style={[styles.text, { color: colors.textPrimary }]}>
        {memory}
      </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
  text: {
    fontSize: 13,
    lineHeight: 19,
  },
});
