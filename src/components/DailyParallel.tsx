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
  const { colors } = useTheme();

  const parallel = getTodaysParallel();
  if (!parallel) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="hourglass-outline" size={15} color={colors.primary} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Today in History
          </Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            {parallel.text}
          </Text>
        </View>
      </View>
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  text: {
    fontSize: 12,
    lineHeight: 17,
  },
});
