import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookOpen, ChevronRight, Check, Clock, Hash } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { BIBLE_READING_PLAN } from '../lib/bibleReadingPlan';
import { getBookInfo, formatReadingTime } from '../lib/bibleBookInfo';

const STORAGE_KEY = 'bible_challenge_progress';
const ACTIVE_MONTH_KEY = 'bible_challenge_active_month';

export interface ChallengeProgress {
  [monthKey: string]: number[]; // month "1" -> array of completed day numbers
}

export async function getProgress(): Promise<ChallengeProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function getActiveMonth(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_MONTH_KEY);
    return raw ? parseInt(raw, 10) : 1;
  } catch {
    return 1;
  }
}

export default function BibleChallengeCard() {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const router = useRouter();
  const currentBook = (user as any)?.currentBibleBook || null;
  const currentChapter = (user as any)?.currentBibleChapter || 0;
  const bookInfo = currentBook ? getBookInfo(currentBook) : null;
  const [activeMonth, setActiveMonth] = useState(1);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [nextReading, setNextReading] = useState<{ psalm: string; proverb: string; main: string; commentary: string } | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    let month = await getActiveMonth();
    const progress = await getProgress();

    // Auto-advance past completed months
    while (month < 12) {
      const monthPlan = BIBLE_READING_PLAN.find(m => m.month === month);
      const completed = progress[String(month)] || [];
      if (monthPlan && completed.length >= monthPlan.readings.length) {
        month++;
      } else {
        break;
      }
    }

    setActiveMonth(month);

    const plan = BIBLE_READING_PLAN.find(m => m.month === month);
    if (!plan) return;

    setTotalCount(plan.readings.length);

    const completed = progress[String(month)] || [];
    setCompletedCount(completed.length);

    const nextDay = plan.readings.find(r => !completed.includes(r.day));
    if (nextDay) {
      setNextReading({ psalm: nextDay.psalm, proverb: nextDay.proverb, main: nextDay.main, commentary: nextDay.commentary });
    } else {
      setNextReading(null);
    }
  }

  const plan = BIBLE_READING_PLAN.find(m => m.month === activeMonth);
  if (!plan) return null;

  const pct = totalCount > 0 ? completedCount / totalCount : 0;
  const pctRound = Math.round(pct * 100);
  const allDone = completedCount === totalCount && totalCount > 0;

  // Theme-aware accent colors
  const cardBg = isDark ? '#1E1D22' : '#f8f5f0';
  const cardBorder = isDark ? '#2E2D33' : '#e8e0d4';
  const accentBg = isDark ? '#26252B' : colors.primary + '10';
  const trackBg = isDark ? '#3D3B44' : '#e0d8cc';
  const accentFill = isDark ? '#D4A860' : colors.primary;
  const accentText = isDark ? '#D4A860' : colors.primary;

  // ── Currently Reading card ──
  if (currentBook && bookInfo) {
    const chapterPct = bookInfo.chapters > 0
      ? Math.round((currentChapter / bookInfo.chapters) * 100)
      : 0;
    const remainingMin = Math.round(bookInfo.readingTimeMinutes * ((bookInfo.chapters - currentChapter) / bookInfo.chapters));

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
        onPress={() => router.push('/bible-challenge')}
        activeOpacity={0.7}
      >
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            <Text style={[styles.planLabel, { color: colors.textSecondary }]}>
              CURRENTLY READING
            </Text>
            <Text style={[styles.planTitle, { color: colors.text }]}>
              {currentBook}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </View>

        {/* Book info pill */}
        <View style={[styles.readingPill, { backgroundColor: accentBg }]}>
          <BookOpen size={15} color={accentText} style={{ marginTop: 1 }} />
          <View style={styles.readingContent}>
            <Text style={[styles.readingMain, { color: colors.text }]}>
              {bookInfo.theme}
            </Text>
            <View style={styles.bookMetaRow}>
              {currentChapter > 0 && (
                <Text style={[styles.readingMeta, { color: colors.textSecondary }]}>
                  Ch. {currentChapter} of {bookInfo.chapters}
                </Text>
              )}
              {currentChapter > 0 && (
                <Text style={[styles.readingMeta, { color: colors.textSecondary }]}>  ·  </Text>
              )}
              <Text style={[styles.readingMeta, { color: colors.textSecondary }]}>
                {remainingMin > 0 ? `${formatReadingTime(remainingMin)} left` : formatReadingTime(bookInfo.readingTimeMinutes)}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: accentFill,
                  width: `${chapterPct}%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressStats}>
            <Text style={[styles.progressCount, { color: colors.textSecondary }]}>
              Chapter {currentChapter} of {bookInfo.chapters}
            </Text>
            <Text style={[styles.progressPct, { color: accentText }]}>
              {chapterPct}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Bible Challenge card (no book set) ──
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={() => router.push('/bible-challenge')}
      activeOpacity={0.7}
    >
      {/* Top row: title + chevron */}
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Text style={[styles.planLabel, { color: colors.textSecondary }]}>
            BIBLE CHALLENGE
          </Text>
          <Text style={[styles.planTitle, { color: colors.text }]}>
            {plan.title}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textSecondary} />
      </View>

      {/* Today's reading pill */}
      <View style={[styles.readingPill, { backgroundColor: accentBg }]}>
        <BookOpen size={15} color={accentText} style={{ marginTop: 1 }} />
        <View style={styles.readingContent}>
          {allDone ? (
            <View style={styles.doneRow}>
              <Check size={14} color={accentText} />
              <Text style={[styles.doneText, { color: accentText }]}>
                Complete — tap to continue
              </Text>
            </View>
          ) : nextReading ? (
            <>
              <Text style={[styles.readingMain, { color: colors.text }]}>
                {nextReading.main}
              </Text>
              <Text style={[styles.readingMeta, { color: colors.textSecondary }]}>
                {nextReading.psalm}  ·  {nextReading.proverb}
              </Text>
              {nextReading.commentary ? (
                <Text style={[styles.readingCommentary, { color: isDark ? '#B8B4AC' : '#8a8070' }]} numberOfLines={2}>
                  {nextReading.commentary}
                </Text>
              ) : null}
            </>
          ) : null}
        </View>
      </View>

      {/* Progress bar + stats */}
      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: accentFill,
                width: `${pctRound}%`,
              },
            ]}
          />
        </View>
        <View style={styles.progressStats}>
          <Text style={[styles.progressCount, { color: colors.textSecondary }]}>
            Day {completedCount} of {totalCount}
          </Text>
          <Text style={[styles.progressPct, { color: accentText }]}>
            {pctRound}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flex: 1,
  },
  planLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  planTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  readingPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  readingContent: {
    flex: 1,
  },
  readingMain: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  readingMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingCommentary: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 4,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doneText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    gap: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
  },
});
