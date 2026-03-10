/**
 * Daily Parallel Card
 * "Today in biblical history..." — a subtle one-liner card on the home screen.
 * Draws from a curated list of 366 entries connecting dates to biblical events,
 * early church history, or seasonal faith observations.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getTodaysParallel } from '../lib/dailyParallels';

export default function DailyParallel() {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const parallel = getTodaysParallel();
  if (!parallel) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1E1D22' : '#f8f5f0',
          borderColor: isDark ? '#2E2D33' : '#e8e0d4',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2E2D33' : '#e8e0d420' }]}>
          <Ionicons name="time-outline" size={13} color={isDark ? '#C4A96A' : '#8a7a5e'} />
        </View>
        <Text style={[styles.label, { color: isDark ? '#C4A96A' : '#8a7a5e' }]}>
          Today in Biblical History
        </Text>
      </View>

      <Text style={[styles.text, { color: colors.textPrimary }]}>
        {parallel.text}
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
    fontStyle: 'italic',
  },
});
