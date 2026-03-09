/**
 * Daily Bible Verse Banner
 * Shows a verse of the day that rotates daily from a curated list.
 * Fetches full passage text from bible-api.com.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { fetchBiblePassage } from '../lib/bibleApi';

// 365 daily verses — must match shared/dailyVerses.ts and
// server/services/dailyVerseNotificationService.ts EXACTLY
// so the banner shows the same verse as the push notification.
const DAILY_VERSE_REFERENCES = [
  // ── January (1-31) ──
  'Lamentations 3:22-23', 'Jeremiah 29:11', 'Isaiah 43:19', 'Psalm 20:4',
  'Proverbs 16:3', 'Philippians 3:13-14', '2 Corinthians 5:17', 'Isaiah 40:31',
  'Psalm 37:4', 'Romans 8:28', 'Matthew 6:33', 'Proverbs 3:5-6',
  'Joshua 1:9', 'Philippians 4:13', 'Psalm 46:1', 'Isaiah 41:10',
  'Romans 12:2', 'Hebrews 11:1', 'James 1:2-4', 'Psalm 119:105',
  'John 3:16', 'Ephesians 2:8-9', 'Galatians 5:22-23', 'Psalm 23:1-3',
  'Matthew 11:28-30', '1 Peter 5:7', 'Romans 15:13', 'Philippians 4:6-7',
  'Psalm 27:1', '2 Timothy 1:7', 'Colossians 3:23',
  // ── February (32-59) ──
  '1 Corinthians 13:4-7', 'Psalm 139:14', 'Micah 6:8', 'Romans 5:8',
  'Psalm 34:18', 'Proverbs 27:17', 'Isaiah 43:2', 'Psalm 121:1-2',
  'Matthew 28:20', 'Romans 8:38-39', 'Proverbs 18:10', 'Psalm 91:1-2',
  'Matthew 5:14-16', '1 John 4:19', 'Psalm 34:8', 'John 14:27',
  'Deuteronomy 31:6', 'Psalm 118:24', 'Isaiah 26:3', 'Proverbs 4:23',
  '1 Thessalonians 5:16-18', 'Psalm 100:4-5', 'Hebrews 12:1-2', 'John 15:5',
  'Ephesians 6:10-11', 'Psalm 51:10', 'Romans 6:23', 'Matthew 7:7',
  // ── March (60-90) ──
  'Psalm 103:1-3', 'Proverbs 22:6', 'Isaiah 55:8-9', 'John 10:10',
  '1 Corinthians 10:13', 'Psalm 16:11', 'Colossians 3:2', 'James 4:8',
  'Psalm 19:14', 'Proverbs 11:25', 'Ephesians 4:32', 'Mark 10:27',
  'Psalm 62:1-2', 'Romans 1:16', 'John 8:32', 'Psalm 145:18',
  'Isaiah 30:21', 'Hebrews 4:16', 'Proverbs 15:1', '2 Chronicles 7:14',
  'Psalm 40:1-3', 'Galatians 6:9', 'John 16:33', 'Psalm 73:26',
  'Matthew 19:26', 'Proverbs 19:21', 'Ephesians 3:20', 'Psalm 30:5',
  'Romans 10:9', 'Isaiah 54:17', 'Psalm 147:3',
  // ── April (91-120) ──
  'John 11:25-26', 'Psalm 56:3-4', '1 John 1:9', 'Matthew 5:6',
  'Proverbs 2:6', 'Psalm 86:5', 'Hebrews 13:5-6', 'John 1:12',
  'Psalm 32:8', 'Galatians 2:20', 'Isaiah 12:2', 'Proverbs 3:9-10',
  'Romans 8:1', 'Psalm 84:11', 'Matthew 5:16', '1 Corinthians 15:58',
  'Psalm 9:1-2', 'John 6:35', 'Proverbs 16:9', 'Philippians 1:6',
  'Psalm 55:22', 'Isaiah 58:11', 'Colossians 3:15', 'James 1:17',
  'Psalm 4:8', 'Romans 8:31', 'Proverbs 12:25', 'John 14:6',
  'Psalm 27:4', 'Ephesians 2:10',
  // ── May (121-151) ──
  'Matthew 6:34', 'Psalm 63:1', '1 Peter 2:9', 'Proverbs 31:25',
  'Isaiah 40:29', 'John 13:34-35', 'Psalm 107:1', 'Romans 12:12',
  'Hebrews 10:24-25', 'Proverbs 14:26', 'Psalm 138:8', 'Matthew 22:37-39',
  '1 John 4:4', 'Isaiah 46:4', 'Psalm 18:2', 'Galatians 6:2',
  'John 8:12', 'Proverbs 17:17', 'Psalm 42:11', 'Romans 14:8',
  '2 Corinthians 12:9', 'Matthew 5:9', 'Psalm 143:8', 'Ephesians 4:2-3',
  'Isaiah 49:15-16', 'Proverbs 10:12', 'John 15:12-13', 'Psalm 36:5-6',
  '1 Corinthians 16:14', 'Hebrews 6:19', 'Psalm 90:12',
  // ── June (152-181) ──
  'Matthew 17:20', 'Romans 8:26', 'Proverbs 21:21', 'Isaiah 61:1',
  'Psalm 46:10', 'John 14:1', 'Colossians 3:12-13', 'Psalm 77:11-12',
  '1 Peter 3:15', 'Proverbs 16:24', 'James 3:17', 'Psalm 145:8-9',
  'Ephesians 1:3-4', 'Matthew 10:31', 'Romans 3:23-24', 'Isaiah 53:5',
  'Psalm 23:4', 'John 4:14', 'Proverbs 3:3-4', '1 John 3:1',
  'Psalm 71:5-6', 'Hebrews 13:8', 'Galatians 3:28', 'Psalm 111:10',
  'Matthew 6:26', 'Romans 8:18', 'Proverbs 23:26', 'Isaiah 44:22',
  'Psalm 33:4-5', 'John 17:3',
  // ── July (182-212) ──
  'Psalm 1:1-3', '2 Corinthians 4:16-17', 'Matthew 7:12', 'Proverbs 25:11',
  'Isaiah 9:6', 'Psalm 119:11', 'John 6:68', 'Romans 13:10',
  'Ephesians 5:1-2', '1 Thessalonians 5:11', 'Psalm 103:11-12', 'Proverbs 28:1',
  'Hebrews 11:6', 'Matthew 25:40', 'Psalm 116:1-2', 'Isaiah 41:13',
  'John 11:35', '1 Corinthians 2:9', 'Psalm 37:23-24', 'Proverbs 20:7',
  'Colossians 2:6-7', 'Galatians 5:1', 'Psalm 130:5-6', 'Romans 12:21',
  'Matthew 18:20', 'James 1:12', 'Isaiah 55:10-11', 'Psalm 150:6',
  'Proverbs 13:12', 'John 20:29', 'Ephesians 6:18',
  // ── August (213-243) ──
  '1 Peter 1:3', 'Psalm 8:3-4', 'Proverbs 1:7', 'Matthew 9:37-38',
  'Romans 11:33', 'Isaiah 6:8', 'Psalm 139:7-10', 'John 15:16',
  'Hebrews 12:11', '2 Corinthians 9:7', 'Psalm 19:1', 'Proverbs 18:24',
  'Galatians 6:7-8', 'Matthew 28:18-20', 'Psalm 37:5-6', '1 John 5:14',
  'Isaiah 40:8', 'Romans 12:1', 'Proverbs 9:10', 'Psalm 25:4-5',
  'John 14:26', 'Colossians 1:16-17', 'James 5:16', 'Ephesians 3:16-17',
  'Psalm 48:14', 'Matthew 16:26', '1 Corinthians 3:16', 'Proverbs 4:7',
  'Isaiah 35:4', 'Psalm 126:5-6', 'Hebrews 4:12',
  // ── September (244-273) ──
  'Romans 8:37', 'John 5:24', 'Psalm 91:11-12', 'Proverbs 24:16',
  'Matthew 5:44', 'Isaiah 11:6', 'Galatians 3:26', 'Psalm 34:1-3',
  '1 Peter 4:8', 'Proverbs 31:30', '2 Corinthians 1:3-4', 'Psalm 65:11',
  'John 10:27-28', 'Ephesians 4:29', 'Romans 10:17', 'Isaiah 49:13',
  'Psalm 68:19', 'Matthew 12:36', 'Hebrews 10:35-36', 'Proverbs 14:30',
  'James 4:10', 'Psalm 113:3', '1 John 2:15-17', 'Colossians 3:17',
  'Isaiah 48:17', 'Psalm 85:10-11', 'John 12:46', 'Romans 12:9-10',
  'Proverbs 30:5', 'Matthew 6:21',
  // ── October (274-304) ──
  '1 Corinthians 15:55-57', 'Psalm 96:1-3', 'Galatians 5:13-14', 'Isaiah 60:1',
  'Proverbs 15:13', 'John 7:38', 'Psalm 31:14-15', 'Ephesians 5:15-16',
  'Romans 8:6', 'Hebrews 3:13', 'Matthew 5:3-4', 'Psalm 104:33-34',
  '1 Peter 1:8-9', 'Proverbs 8:11', 'Isaiah 62:3', 'James 2:17',
  'Psalm 57:1', '2 Corinthians 3:17', 'John 21:17', 'Colossians 1:27',
  'Romans 5:3-4', 'Proverbs 3:7-8', 'Matthew 7:24-25', 'Psalm 119:50',
  '1 Thessalonians 4:11-12', 'Isaiah 52:7', 'Galatians 5:16', 'Psalm 5:3',
  'Hebrews 13:1-2', 'John 1:14', 'Proverbs 19:17',
  // ── November (305-334) ──
  'Psalm 95:1-3', 'Ephesians 5:20', '1 Chronicles 16:34', 'Matthew 14:27',
  'Romans 15:5-6', 'Isaiah 25:1', 'Psalm 106:1', 'Proverbs 11:2',
  'John 4:24', '1 Corinthians 12:27', 'Psalm 136:1', 'Colossians 4:2',
  'James 1:5', 'Isaiah 33:6', 'Psalm 28:7', 'Romans 8:15-16',
  'Matthew 11:25', 'Hebrews 12:28-29', 'Proverbs 17:22', '1 Peter 2:24',
  'Psalm 67:1-2', 'Galatians 4:4-5', 'John 3:30', '2 Corinthians 8:9',
  'Isaiah 7:14', 'Psalm 148:1-3', 'Ephesians 1:7-8', 'Proverbs 22:2',
  'Matthew 1:23', 'Psalm 72:18-19',
  // ── December (335-365) ──
  'Luke 2:10-11', 'Isaiah 9:2', 'Psalm 89:1', 'Romans 6:11',
  'John 1:1-3', 'Proverbs 16:16', '1 John 4:9-10', 'Psalm 98:1-2',
  'Matthew 2:10-11', 'Hebrews 1:3', 'Isaiah 11:1-2', 'Luke 1:46-47',
  'Psalm 96:11-13', 'Colossians 1:19-20', 'Titus 3:4-5', 'Proverbs 8:17',
  'John 1:9', 'Psalm 85:10', 'Galatians 4:6-7', 'Isaiah 42:6',
  'Romans 8:32', 'Matthew 5:8', 'Psalm 147:11', 'Luke 2:14',
  '1 Timothy 1:15', 'Revelation 21:3-4', 'Proverbs 3:11-12', 'John 1:16',
  'Psalm 117:1-2', 'Isaiah 60:19-20', 'Revelation 22:20-21',
];

// Matches getDailyVerseIndex() in server/services/dailyVerseNotificationService.ts
function getDailyVerse(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return DAILY_VERSE_REFERENCES[dayOfYear % DAILY_VERSE_REFERENCES.length];
}

export default function DailyVerseBanner() {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const [reference, setReference] = useState(getDailyVerse());
  const [verseText, setVerseText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadVerse() {
      setIsLoading(true);
      const result = await fetchBiblePassage(reference);
      if (!cancelled) {
        setVerseText(result.success ? result.text : '');
        setIsLoading(false);
      }
    }

    loadVerse();
    return () => { cancelled = true; };
  }, [reference]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a2540' : '#f0f4ff', borderColor: isDark ? '#2a3a5a' : '#d4dff7' }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!verseText) return null;

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1a2540' : '#f0f4ff',
          borderColor: isDark ? '#2a3a5a' : '#d4dff7',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="book" size={14} color={colors.primary} />
        </View>
        <Text style={[styles.label, { color: colors.primary }]}>Verse of the Day</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
          style={styles.chevron}
        />
      </View>

      <Text
        style={[styles.verseText, { color: colors.textPrimary }]}
        numberOfLines={expanded ? undefined : 2}
      >
        {verseText}
      </Text>

      <Text style={[styles.reference, { color: colors.primary }]}>
        — {reference}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  chevron: {
    marginLeft: 4,
  },
  verseText: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  reference: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'right',
  },
});
