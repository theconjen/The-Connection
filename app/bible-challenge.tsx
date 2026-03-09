import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../src/lib/apiClient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CircleHelp, Clock, Hash, Info, Lock, Search, Trophy, Users, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import {
  BIBLE_READING_PLAN,
} from '../src/lib/bibleReadingPlan';
import {
  getProgress,
  getActiveMonth,
  type ChallengeProgress,
} from '../src/components/BibleChallengeCard';
import { getBookInfo, formatReadingTime } from '../src/lib/bibleBookInfo';

// ─── Bible Books for "Currently Reading" picker ─────────────────
const OLD_TESTAMENT = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
];

const NEW_TESTAMENT = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
  'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
];

const STORAGE_KEY = 'bible_challenge_progress';
const ACTIVE_MONTH_KEY = 'bible_challenge_active_month';
const COMPLETED_BOOKS_KEY = 'bible_completed_books';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Confetti Animation ──────────────────────────────────────────
const CONFETTI_COUNT = 60;
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FF9FF3', '#54A0FF'];

function ConfettiPiece({ index, color }: { index: number; color: string }) {
  const startX = Math.random() * SCREEN_WIDTH;
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5 + Math.random() * 0.8);

  useEffect(() => {
    const delay = Math.random() * 1500;
    const duration = 3000 + Math.random() * 2000;
    const swayAmount = 40 + Math.random() * 80;

    translateY.value = withDelay(delay,
      withTiming(SCREEN_HEIGHT + 100, { duration, easing: Easing.linear })
    );
    translateX.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(startX + swayAmount, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          withTiming(startX - swayAmount, { duration: 500, easing: Easing.inOut(Easing.sin) })
        ), -1, true
      )
    );
    rotate.value = withDelay(delay,
      withRepeat(withTiming(360, { duration: 800 + Math.random() * 400, easing: Easing.linear }), -1)
    );
    opacity.value = withDelay(delay + duration - 500, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
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
        { position: 'absolute', top: -20 },
        style,
        {
          backgroundColor: color,
          borderRadius: isCircle ? 10 : isSquare ? 2 : 0,
          width: isCircle ? 10 : 8,
          height: isCircle ? 10 : isSquare ? 8 : 15,
        },
      ]}
    />
  );
}

// ─── Celebration Modal ───────────────────────────────────────────
function CelebrationModal({
  visible,
  monthTitle,
  nextMonthTitle,
  onStay,
  onNext,
}: {
  visible: boolean;
  monthTitle: string;
  nextMonthTitle: string | null;
  onStay: () => void;
  onNext: () => void;
}) {
  const { colors } = useTheme();
  const modalScale = useSharedValue(0.5);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      modalScale.value = withSequence(
        withTiming(1.05, { duration: 350, easing: Easing.out(Easing.back) }),
        withTiming(1, { duration: 150 })
      );
      modalOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  if (!visible) return null;

  const isFullPlan = nextMonthTitle === null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={celebStyles.fullScreen}>
        {/* Solid dark background */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111827' }]} />

        {/* Confetti layer */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
            <ConfettiPiece key={i} index={i} color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]} />
          ))}
        </View>

        {/* Centered content */}
        <Animated.View style={[celebStyles.card, animStyle]}>
          {/* Trophy */}
          <View style={celebStyles.trophyWrap}>
            <Text style={{ fontSize: 64 }}>🏆</Text>
          </View>

          <Text style={celebStyles.title}>
            {isFullPlan ? 'Plan Complete!' : 'Month Complete!'}
          </Text>

          <Text style={celebStyles.subtitle}>
            {isFullPlan
              ? "You've finished the entire Bible reading plan.\nWhat an incredible journey through God's Word!"
              : `You finished "${monthTitle}"!\nGreat job staying consistent in God's Word.`}
          </Text>

          {/* Stars */}
          <View style={celebStyles.stars}>
            <Text style={{ fontSize: 32 }}>⭐</Text>
            <Text style={{ fontSize: 40 }}>🌟</Text>
            <Text style={{ fontSize: 32 }}>⭐</Text>
          </View>

          {/* Buttons */}
          <View style={celebStyles.buttons}>
            {!isFullPlan && (
              <Pressable style={celebStyles.primaryBtn} onPress={onNext}>
                <Text style={celebStyles.primaryBtnText}>
                  Start {nextMonthTitle}
                </Text>
              </Pressable>
            )}

            <Pressable style={celebStyles.secondaryBtn} onPress={onStay}>
              <Text style={celebStyles.secondaryBtnText}>
                {isFullPlan ? 'Done' : 'Stay Here'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const celebStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  trophyWrap: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 36,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ─── Book Completion Modal ───────────────────────────────────────
function BookCompletionModal({
  visible,
  bookName,
  onDismiss,
  onNextBook,
}: {
  visible: boolean;
  bookName: string;
  onDismiss: () => void;
  onNextBook: () => void;
}) {
  const modalScale = useSharedValue(0.5);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      modalScale.value = withSequence(
        withTiming(1.05, { duration: 350, easing: Easing.out(Easing.back) }),
        withTiming(1, { duration: 150 })
      );
      modalOpacity.value = withTiming(1, { duration: 300 });
    } else {
      modalScale.value = 0.5;
      modalOpacity.value = 0;
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={celebStyles.fullScreen}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111827' }]} />

        {/* Confetti */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
            <ConfettiPiece key={i} index={i} color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]} />
          ))}
        </View>

        <Animated.View style={[celebStyles.card, animStyle]}>
          <View style={celebStyles.trophyWrap}>
            <Text style={{ fontSize: 64 }}>📖</Text>
          </View>

          <Text style={celebStyles.title}>Book Complete!</Text>

          <Text style={celebStyles.subtitle}>
            You finished {bookName}!{'\n'}
            That's an incredible accomplishment.{'\n'}
            Keep the momentum going.
          </Text>

          <View style={celebStyles.stars}>
            <Text style={{ fontSize: 32 }}>⭐</Text>
            <Text style={{ fontSize: 40 }}>🌟</Text>
            <Text style={{ fontSize: 32 }}>⭐</Text>
          </View>

          <View style={celebStyles.buttons}>
            <Pressable style={celebStyles.primaryBtn} onPress={onNextBook}>
              <Text style={celebStyles.primaryBtnText}>Pick Next Book</Text>
            </Pressable>

            <Pressable style={celebStyles.secondaryBtn} onPress={onDismiss}>
              <Text style={celebStyles.secondaryBtnText}>Stay Here</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function BibleChallengeScreen() {
  const { colors, colorScheme } = useTheme();
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [activeMonth, setActiveMonth] = useState(1);
  const [viewingMonth, setViewingMonth] = useState(1);
  const [progress, setProgress] = useState<ChallengeProgress>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [savingBook, setSavingBook] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [localBook, setLocalBook] = useState<string | null | undefined>(undefined);
  const [completedBooks, setCompletedBooks] = useState<Set<string>>(new Set());
  const serverBook = (user as any)?.currentBibleBook || null;
  const currentBook = localBook !== undefined ? localBook : serverBook;

  // Social reading data (friends & communities)
  const [friendsReading, setFriendsReading] = useState<any[]>([]);
  const [communityReading, setCommunityReading] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/api/bible/social-reading').then(res => {
      setFriendsReading(res.data?.friendsReading || []);
      setCommunityReading(res.data?.communityReading || []);
    }).catch(() => {});
  }, []);

  // Load completed books from storage
  useEffect(() => {
    AsyncStorage.getItem(COMPLETED_BOOKS_KEY).then(raw => {
      if (raw) setCompletedBooks(new Set(JSON.parse(raw)));
    }).catch(() => {});
  }, []);

  // Sync local state when server data arrives
  useEffect(() => {
    setLocalBook(undefined);
  }, [serverBook]);

  const filteredBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    const ot = OLD_TESTAMENT.filter(b => b.toLowerCase().includes(q));
    const nt = NEW_TESTAMENT.filter(b => b.toLowerCase().includes(q));
    return { ot, nt };
  }, [bookSearch]);

  const handleSelectBook = useCallback(async (bookName: string) => {
    const newSelection = localBook !== undefined
      ? (localBook === bookName ? null : bookName)
      : (serverBook === bookName ? null : bookName);
    setLocalBook(newSelection);
    setShowBookPicker(false);
    setBookSearch('');
    setSavingBook(true);
    try {
      await apiClient.patch('/api/user/profile', { currentBibleBook: newSelection });
    } catch {
      setLocalBook(undefined); // revert to server state
      Alert.alert('Error', 'Could not save your reading selection.');
    } finally {
      setSavingBook(false);
    }
  }, [localBook, serverBook]);

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    let month = await getActiveMonth();
    const p = await getProgress();

    // Auto-advance past any fully completed months
    while (month <= 12) {
      const monthPlan = BIBLE_READING_PLAN.find(m => m.month === month);
      const completed = p[String(month)] || [];
      if (monthPlan && completed.length >= monthPlan.readings.length && month < 12) {
        month++;
      } else {
        break;
      }
    }

    await AsyncStorage.setItem(ACTIVE_MONTH_KEY, String(month));
    setActiveMonth(month);
    setViewingMonth(month);
    setProgress(p);
    syncEnrollment(month);
  }

  // Sync enrollment to server for push notifications (fire-and-forget)
  function syncEnrollment(month: number) {
    apiClient.patch('/api/user/profile', { bibleChallengeMonth: month }).catch(() => {});
  }

  const plan = BIBLE_READING_PLAN.find(m => m.month === viewingMonth);
  const completedDays = progress[String(viewingMonth)] || [];
  const isCurrentMonth = viewingMonth === activeMonth;
  const isFutureMonth = viewingMonth > activeMonth;

  const toggleDay = useCallback(async (day: number) => {
    if (isFutureMonth) return;

    const key = String(viewingMonth);
    const current = progress[key] || [];
    let updated: number[];

    if (current.includes(day)) {
      updated = current.filter(d => d !== day);
    } else {
      updated = [...current, day];
    }

    const newProgress = { ...progress, [key]: updated };
    setProgress(newProgress);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));

    // Trigger celebration when month complete
    if (plan && updated.length === plan.readings.length && isCurrentMonth) {
      setTimeout(() => setShowCelebration(true), 300);
    }
  }, [progress, viewingMonth, activeMonth, isCurrentMonth, plan, isFutureMonth]);

  const handleAdvanceMonth = async () => {
    const nextMonth = activeMonth + 1;
    if (nextMonth <= 12) {
      setActiveMonth(nextMonth);
      setViewingMonth(nextMonth);
      await AsyncStorage.setItem(ACTIVE_MONTH_KEY, String(nextMonth));
      syncEnrollment(nextMonth);
    }
    setShowCelebration(false);
  };

  const navigateMonth = (direction: -1 | 1) => {
    const next = viewingMonth + direction;
    if (next >= 1 && next <= 12) {
      setViewingMonth(next);
    }
  };

  if (!plan) return null;

  const completedCount = completedDays.length;
  const totalCount = plan.readings.length;
  const progressPct = totalCount > 0 ? completedCount / totalCount : 0;
  const nextPlan = BIBLE_READING_PLAN.find(m => m.month === activeMonth + 1);
  const nextMonthTitle = nextPlan ? nextPlan.title : null;

  const isDark = colorScheme === 'dark';
  const trackBg = isDark ? '#3D3B44' : '#e0d8cc';
  // In dark mode, colors.primary is cream (#FAF8F3) — good for text, bad for fills.
  // Use gold accent for backgrounds/fills, cream for text labels.
  const accentFill = isDark ? '#E8C476' : colors.primary;

  // Month-specific accent colors for visual variety
  const monthAccents = [
    { bg: '#1B3A5C', fg: '#fff' }, // 1 - deep navy
    { bg: '#2D5016', fg: '#fff' }, // 2 - forest
    { bg: '#5C1B3A', fg: '#fff' }, // 3 - wine
    { bg: '#3A2D5C', fg: '#fff' }, // 4 - purple
    { bg: '#164550', fg: '#fff' }, // 5 - teal
    { bg: '#5C3A16', fg: '#fff' }, // 6 - amber
    { bg: '#1B4C3A', fg: '#fff' }, // 7 - emerald
    { bg: '#3A1B5C', fg: '#fff' }, // 8 - violet
    { bg: '#50162D', fg: '#fff' }, // 9 - burgundy
    { bg: '#16385C', fg: '#fff' }, // 10 - steel
    { bg: '#2D4516', fg: '#fff' }, // 11 - olive
    { bg: '#5C1616', fg: '#fff' }, // 12 - crimson
  ];
  const accent = monthAccents[(plan.month - 1) % monthAccents.length];

  // Find the next uncompleted reading for the "Up Next" card
  const nextReading = plan.readings.find(r => !completedDays.includes(r.day));

  // Book picker inline renderer (shared between both views)
  const renderBookPicker = (bgStyle: 'hero' | 'card' | 'inline') => {
    if (!showBookPicker) return null;
    if (bgStyle === 'hero') {
      return (
        <View style={styles.bookPickerHero}>
          <View style={styles.bookSearchRowHero}>
            <Search size={13} color="rgba(255,255,255,0.5)" />
            <TextInput
              style={styles.bookSearchInputHero}
              placeholder="Search books..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={bookSearch}
              onChangeText={setBookSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {bookSearch.length > 0 && (
              <Pressable onPress={() => setBookSearch('')}>
                <X size={13} color="rgba(255,255,255,0.5)" />
              </Pressable>
            )}
          </View>
          {currentBook && (
            <TouchableOpacity style={styles.bookClearBtnHero} onPress={() => handleSelectBook(currentBook)}>
              <Text style={styles.bookClearTextHero}>Clear</Text>
            </TouchableOpacity>
          )}
          {filteredBooks.ot.length > 0 && (
            <>
              <Text style={styles.bookSectionTitleHero}>OLD TESTAMENT</Text>
              <View style={styles.bookGrid}>
                {filteredBooks.ot.map(name => {
                  const done = completedBooks.has(name);
                  return (
                    <TouchableOpacity key={name} style={[styles.bookChipHero, currentBook === name && styles.bookChipHeroSelected, done && !currentBook && { backgroundColor: 'rgba(27,107,58,0.2)' }]} onPress={() => handleSelectBook(name)} disabled={savingBook}>
                      <View style={styles.bookChipRow}>
                        {done && <Check size={10} color={currentBook === name ? '#FFD700' : '#4ADE80'} strokeWidth={3} />}
                        <Text style={[styles.bookChipTextHero, currentBook === name && styles.bookChipTextHeroSelected, done && { color: '#4ADE80' }]} numberOfLines={1}>{name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
          {filteredBooks.nt.length > 0 && (
            <>
              <Text style={[styles.bookSectionTitleHero, { marginTop: 10 }]}>NEW TESTAMENT</Text>
              <View style={styles.bookGrid}>
                {filteredBooks.nt.map(name => {
                  const done = completedBooks.has(name);
                  return (
                    <TouchableOpacity key={name} style={[styles.bookChipHero, currentBook === name && styles.bookChipHeroSelected, done && !currentBook && { backgroundColor: 'rgba(27,107,58,0.2)' }]} onPress={() => handleSelectBook(name)} disabled={savingBook}>
                      <View style={styles.bookChipRow}>
                        {done && <Check size={10} color={currentBook === name ? '#FFD700' : '#4ADE80'} strokeWidth={3} />}
                        <Text style={[styles.bookChipTextHero, currentBook === name && styles.bookChipTextHeroSelected, done && { color: '#4ADE80' }]} numberOfLines={1}>{name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      );
    }
    // Card-style picker (light/dark aware)
    return (
      <View style={[bgStyle === 'inline' ? styles.bookPickerInline : styles.bookPickerCard, bgStyle !== 'inline' && { backgroundColor: isDark ? '#1E1D22' : '#f0ebe4', borderColor: isDark ? '#2E2D33' : '#e0d8cc' }]}>
        <View style={[styles.bookSearchRowCard, { backgroundColor: isDark ? '#26252B' : '#e8e0d4' }]}>
          <Search size={13} color={colors.textSecondary} />
          <TextInput
            style={[styles.bookSearchInputCard, { color: colors.textPrimary }]}
            placeholder="Search books..."
            placeholderTextColor={colors.textSecondary}
            value={bookSearch}
            onChangeText={setBookSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {bookSearch.length > 0 && (
            <Pressable onPress={() => setBookSearch('')}>
              <X size={13} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        {currentBook && (
          <TouchableOpacity style={[styles.bookClearBtnCard, { borderColor: colors.error || '#c44' }]} onPress={() => handleSelectBook(currentBook)}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.error || '#c44' }}>Clear Selection</Text>
          </TouchableOpacity>
        )}
        {filteredBooks.ot.length > 0 && (
          <>
            <Text style={[styles.bookSectionTitleCard, { color: colors.textSecondary }]}>OLD TESTAMENT</Text>
            <View style={styles.bookGrid}>
              {filteredBooks.ot.map(name => {
                const done = completedBooks.has(name);
                return (
                  <TouchableOpacity key={name} style={[styles.bookChipCard, { backgroundColor: currentBook === name ? (isDark ? accentFill + '25' : colors.primary + '18') : done ? '#1B6B3A' + '12' : (isDark ? '#26252B' : '#e8e0d4'), borderColor: currentBook === name ? accentFill : done ? '#1B6B3A' + '40' : (isDark ? '#3D3B44' : 'transparent') }]} onPress={() => handleSelectBook(name)} disabled={savingBook}>
                    <View style={styles.bookChipRow}>
                      {done && <Check size={10} color={isDark ? '#4CAF50' : '#1B6B3A'} strokeWidth={3} />}
                      <Text style={[styles.bookChipTextCard, { color: currentBook === name ? accentFill : done ? (isDark ? '#4CAF50' : '#1B6B3A') : colors.textPrimary }, (currentBook === name || done) && { fontWeight: '700' }]} numberOfLines={1}>{name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
        {filteredBooks.nt.length > 0 && (
          <>
            <Text style={[styles.bookSectionTitleCard, { color: colors.textSecondary, marginTop: 10 }]}>NEW TESTAMENT</Text>
            <View style={styles.bookGrid}>
              {filteredBooks.nt.map(name => {
                const done = completedBooks.has(name);
                return (
                  <TouchableOpacity key={name} style={[styles.bookChipCard, { backgroundColor: currentBook === name ? (isDark ? accentFill + '25' : colors.primary + '18') : done ? '#1B6B3A' + '12' : (isDark ? '#26252B' : '#e8e0d4'), borderColor: currentBook === name ? accentFill : done ? '#1B6B3A' + '40' : (isDark ? '#3D3B44' : 'transparent') }]} onPress={() => handleSelectBook(name)} disabled={savingBook}>
                    <View style={styles.bookChipRow}>
                      {done && <Check size={10} color={isDark ? '#4CAF50' : '#1B6B3A'} strokeWidth={3} />}
                      <Text style={[styles.bookChipTextCard, { color: currentBook === name ? accentFill : done ? (isDark ? '#4CAF50' : '#1B6B3A') : colors.textPrimary }, (currentBook === name || done) && { fontWeight: '700' }]} numberOfLines={1}>{name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </View>
    );
  };

  // ── Currently Reading focused view ──
  const bookInfo = currentBook ? getBookInfo(currentBook) : null;
  const startedAt = (user as any)?.bibleBookStartedAt;
  const daysReading = startedAt
    ? Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000))
    : null;
  const [localChapter, setLocalChapter] = useState<number | null>(null);
  const serverChapter = (user as any)?.currentBibleChapter || 0;
  const currentChapter = localChapter !== null ? localChapter : serverChapter;
  const chapterPct = bookInfo && bookInfo.chapters > 0
    ? Math.round((currentChapter / bookInfo.chapters) * 100)
    : 0;

  // Reset chapter when book changes or server data arrives
  useEffect(() => {
    setLocalChapter(null);
  }, [serverChapter]);

  // Reset chapter to 0 when switching books locally
  useEffect(() => {
    if (localBook !== undefined) {
      setLocalChapter(0);
    }
  }, [localBook]);

  const [showBookComplete, setShowBookComplete] = useState(false);
  const [showStudyGuide, setShowStudyGuide] = useState(false);

  const handleChapterChange = useCallback(async (chapter: number) => {
    setLocalChapter(chapter);
    // Trigger celebration + mark complete when all chapters are done
    if (bookInfo && currentBook && chapter >= bookInfo.chapters) {
      setTimeout(() => setShowBookComplete(true), 400);
      const updated = new Set(completedBooks);
      updated.add(currentBook);
      setCompletedBooks(updated);
      AsyncStorage.setItem(COMPLETED_BOOKS_KEY, JSON.stringify([...updated])).catch(() => {});
    }
    try {
      await apiClient.patch('/api/user/profile', { currentBibleChapter: chapter });
    } catch {
      setLocalChapter(null); // revert on error
    }
  }, [bookInfo, currentBook, completedBooks]);

  if (currentBook && !showChallenge) {
    const remainingMin = bookInfo ? Math.round(bookInfo.readingTimeMinutes * ((bookInfo.chapters - currentChapter) / bookInfo.chapters)) : 0;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header — outside ScrollView so it's flush with SafeArea */}
        <View style={[styles.readingHeader, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBack}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.readingHeaderTitle, { color: colors.textPrimary }]}>My Bible Reading</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Bible Challenge toggle */}
          <TouchableOpacity
            style={[styles.challengeToggle, { backgroundColor: isDark ? '#1E1D22' : '#f8f5f0', borderColor: isDark ? '#2E2D33' : '#e8e0d4' }]}
            onPress={() => setShowChallenge(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.challengeToggleIcon, { backgroundColor: '#FFD700' + '20' }]}>
              <Trophy size={18} color="#FFD700" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.challengeToggleTitle, { color: colors.textPrimary }]}>Bible Challenge</Text>
              <Text style={[styles.challengeToggleSub, { color: colors.textSecondary }]}>
                Month {activeMonth}: {plan.title} · {Math.round(progressPct * 100)}% complete
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Main card — everything in one connected container */}
          <View style={[styles.mainReadingCard, { backgroundColor: isDark ? '#1E1D22' : '#f8f5f0', borderColor: isDark ? '#2E2D33' : '#e8e0d4' }]}>
            {/* Study guide icon */}
            <TouchableOpacity
              onPress={() => setShowStudyGuide(true)}
              style={styles.studyGuideBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CircleHelp size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Book name + meta */}
            <View style={styles.mainReadingTop}>
              <Text style={[styles.readingHeroLabel, { color: colors.textSecondary }]}>CURRENTLY READING</Text>
              <Text style={[styles.readingHeroBook, { color: colors.textPrimary }]}>{currentBook}</Text>

              {bookInfo && (
                <Text style={[styles.mainReadingMeta, { color: colors.textSecondary }]}>
                  {bookInfo.testament === 'OT' ? 'Old Testament' : 'New Testament'}  ·  {bookInfo.chapters} chapters  ·  {formatReadingTime(bookInfo.readingTimeMinutes)}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.changeBookBtnInline, { backgroundColor: isDark ? '#26252B' : colors.primary + '10', borderWidth: isDark ? 1 : 0, borderColor: '#3D3B44' }]}
                onPress={() => setShowBookPicker(!showBookPicker)}
              >
                <Text style={[styles.changeBookText, { color: colors.textPrimary }]}>
                  {showBookPicker ? 'Close' : 'Change Book'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Book picker (inline) */}
            {renderBookPicker('inline')}

            {/* Divider */}
            {bookInfo && <View style={[styles.mainDivider, { backgroundColor: isDark ? '#2E2D33' : '#e8e0d4' }]} />}

            {/* Chapter Progress */}
            {bookInfo && (
              <View style={styles.mainReadingSection}>
                <View style={styles.chapterHeaderRow}>
                  <Text style={[styles.sectionCardTitle, { color: colors.textPrimary }]}>Chapter Progress</Text>
                  <Text style={[styles.chapterStatPct, { color: accentFill }]}>{chapterPct}%</Text>
                </View>

                <View style={[styles.chapterTrack, { backgroundColor: trackBg }]}>
                  <View style={[styles.chapterFill, { backgroundColor: accentFill, width: `${chapterPct}%` }]} />
                </View>

                <View style={styles.chapterGrid}>
                  {Array.from({ length: bookInfo.chapters }, (_, i) => i + 1).map(ch => {
                    const isRead = ch <= currentChapter;
                    return (
                      <TouchableOpacity
                        key={ch}
                        style={[
                          styles.chapterDot,
                          {
                            backgroundColor: isRead ? (isDark ? '#8B6914' : colors.primary) : (isDark ? '#3D3B44' : '#e0d8cc'),
                          },
                        ]}
                        onPress={() => handleChapterChange(ch === currentChapter ? ch - 1 : ch)}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.chapterDotText, { color: isRead ? '#fff' : (isDark ? '#D4D0C8' : '#a09888') }]}>
                          {ch}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.chapterHint, { color: colors.textSecondary }]}>
                  Tap the chapter you've reached
                </Text>
              </View>
            )}

            {/* Divider */}
            {bookInfo && <View style={[styles.mainDivider, { backgroundColor: isDark ? '#2E2D33' : '#e8e0d4' }]} />}

            {/* Stats row — inline */}
            {bookInfo && (
              <View style={styles.inlineStatsRow}>
                {daysReading !== null && (
                  <View style={styles.inlineStat}>
                    <Text style={[styles.inlineStatValue, { color: colors.textPrimary }]}>{daysReading}</Text>
                    <Text style={[styles.inlineStatLabel, { color: colors.textSecondary }]}>
                      {daysReading === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                )}
                <View style={[styles.inlineStatDivider, { backgroundColor: isDark ? '#2E2D33' : '#e0d8cc' }]} />
                <View style={styles.inlineStat}>
                  <Text style={[styles.inlineStatValue, { color: colors.textPrimary }]}>
                    {bookInfo.chapters - currentChapter}
                  </Text>
                  <Text style={[styles.inlineStatLabel, { color: colors.textSecondary }]}>left</Text>
                </View>
                {remainingMin > 0 && (
                  <>
                    <View style={[styles.inlineStatDivider, { backgroundColor: isDark ? '#2E2D33' : '#e0d8cc' }]} />
                    <View style={styles.inlineStat}>
                      <Text style={[styles.inlineStatValue, { color: colors.textPrimary }]}>
                        {remainingMin >= 60 ? `${Math.floor(remainingMin / 60)}h ${remainingMin % 60}m` : `${remainingMin}m`}
                      </Text>
                      <Text style={[styles.inlineStatLabel, { color: colors.textSecondary }]}>remaining</Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>

          {/* What to Expect */}
          {bookInfo && (
            <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E1D22' : '#f8f5f0', borderColor: isDark ? '#2E2D33' : '#e8e0d4' }]}>
              <Text style={[styles.aboutTheme, { color: accentFill }]}>{bookInfo.theme}</Text>
              <Text style={[styles.aboutDesc, { color: isDark ? '#B8B4AC' : '#6a6050' }]}>
                {bookInfo.description}
              </Text>
              <Text style={[styles.aboutCredit, { color: isDark ? '#6E6A62' : '#b0a898' }]}>
                Adapted from Matthew Henry's Commentary on the Whole Bible{'\n'}
                biblestudytools.com/commentaries/matthew-henry-complete
              </Text>
            </View>
          )}

          {/* Friends Reading Section */}
          <View style={{ marginHorizontal: 16, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Users size={16} color={colors.textSecondary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Friends Are Reading</Text>
            </View>
            {friendsReading.length > 0 ? friendsReading.map((friend: any) => (
              <View
                key={friend.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: isDark ? '#1E1D22' : '#f8f5f0',
                  borderRadius: 12,
                  marginBottom: 8,
                  gap: 12,
                }}
              >
                {friend.avatarUrl ? (
                  <Image source={{ uri: friend.avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                ) : (
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#3D3B44' : '#e0d8cc', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#D4D0C8' : '#6E6A62' }}>
                      {(friend.displayName || friend.username || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>
                    {friend.displayName || friend.username}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {friend.currentBibleBook}{friend.currentBibleChapter ? ` · Ch. ${friend.currentBibleChapter}` : ''}
                  </Text>
                </View>
                <BookOpen size={16} color={accentFill} />
              </View>
            )) : (
              <View style={{ paddingVertical: 16, paddingHorizontal: 14, backgroundColor: isDark ? '#1E1D22' : '#f8f5f0', borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>
                  When your friends set what they're reading, you'll see it here.
                </Text>
              </View>
            )}
          </View>

          {/* Community Reading Section */}
          <View style={{ marginHorizontal: 16, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BookOpen size={16} color={colors.textSecondary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Community Reading</Text>
            </View>
            {communityReading.length > 0 ? communityReading.map((community: any) => (
              <View key={community.communityId} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginLeft: 2 }}>
                  {community.communityName}
                </Text>
                {/* Community-set book (by organizer) */}
                {community.communityBook && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      backgroundColor: isDark ? 'rgba(232, 196, 118, 0.08)' : 'rgba(232, 196, 118, 0.12)',
                      borderRadius: 12,
                      marginBottom: 8,
                      gap: 12,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(232, 196, 118, 0.2)' : 'rgba(232, 196, 118, 0.3)',
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#8B6914' : '#E8C476', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={16} color={isDark ? '#E8C476' : '#fff'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: accentFill, marginBottom: 1 }}>
                        Reading Together
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
                        {community.communityBook}{community.communityChapter ? ` ${community.communityChapter}` : ''}
                      </Text>
                    </View>
                    <BookOpen size={16} color={accentFill} />
                  </View>
                )}
                {/* Individual member reading */}
                {community.readers.map((reader: any) => (
                  <View
                    key={reader.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      backgroundColor: isDark ? '#1E1D22' : '#f8f5f0',
                      borderRadius: 12,
                      marginBottom: 8,
                      gap: 12,
                    }}
                  >
                    {reader.avatarUrl ? (
                      <Image source={{ uri: reader.avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                    ) : (
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#3D3B44' : '#e0d8cc', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#D4D0C8' : '#6E6A62' }}>
                          {(reader.displayName || reader.username || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>
                        {reader.displayName || reader.username}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {reader.currentBibleBook}{reader.currentBibleChapter ? ` · Ch. ${reader.currentBibleChapter}` : ''}
                      </Text>
                    </View>
                    <BookOpen size={16} color={accentFill} />
                  </View>
                ))}
              </View>
            )) : (
              <View style={{ paddingVertical: 16, paddingHorizontal: 14, backgroundColor: isDark ? '#1E1D22' : '#f8f5f0', borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>
                  When community members set what they're reading, you'll see it here.
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* Book completion celebration */}
        <BookCompletionModal
          visible={showBookComplete}
          bookName={currentBook || ''}
          onDismiss={() => setShowBookComplete(false)}
          onNextBook={() => {
            setShowBookComplete(false);
            setShowBookPicker(true);
          }}
        />

        {/* How to Study the Bible modal */}
        <Modal visible={showStudyGuide} transparent animationType="fade" onRequestClose={() => setShowStudyGuide(false)}>
          <View style={styles.studyOverlay}>
            <View style={[styles.studyModal, { backgroundColor: isDark ? '#1E1D22' : '#fff' }]}>
              <Text style={[styles.studyTitle, { color: colors.textPrimary }]}>8 Tools for Studying the Bible</Text>

              <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 8 }}>
                <View style={styles.studySection}>
                  <Text style={[styles.studyHeading, { color: accentFill }]}>1. Read Through the Bible</Text>
                  <Text style={[styles.studyBody, { color: colors.textSecondary }]}>
                    Don't just read random passages — work through entire books from beginning to end. Scripture was written to be read as a whole, and you'll miss the story if you skip around.
                  </Text>
                  <Text style={[styles.studyVerse, { color: colors.textMuted }]}>
                    {'\u2022'} Read it systematically — follow the author's flow (Jude 11, Luke 24:25){'\n'}
                    {'\u2022'} Read it slowly — pause and "behold" what you're reading (2 Cor 3:18){'\n'}
                    {'\u2022'} Read it meditatively — "Think over what I say" (2 Tim 2:7){'\n'}
                    {'\u2022'} "When you read this, you can perceive my insight" (Eph 3:4)
                  </Text>
                </View>

                <View style={styles.studySection}>
                  <Text style={[styles.studyHeading, { color: accentFill }]}>2. Ask the Text Questions</Text>
                  <Text style={[styles.studyBody, { color: colors.textSecondary }]}>
                    The best Bible students are the ones who ask the most questions. Before you consult any commentary, interrogate the text yourself. Let Scripture speak before you bring in outside voices.
                  </Text>
                  <Text style={[styles.studyVerse, { color: colors.textMuted }]}>
                    {'\u2022'} Who wrote it? Who received it? Why?{'\n'}
                    {'\u2022'} What comes before and after this passage?{'\n'}
                    {'\u2022'} What does this reveal about God's character?{'\n'}
                    {'\u2022'} What does this reveal about human nature?{'\n'}
                    {'\u2022'} What principles does this text teach or illustrate?{'\n'}
                    {'\u2022'} How does this apply in light of the new covenant?{'\n'}
                    {'\u2022'} Does this point to Christ? (Matt 11){'\n'}
                    {'\u2022'} Is there any text that connects to this one?
                  </Text>
                </View>

                <View style={styles.studySection}>
                  <Text style={[styles.studyHeading, { color: accentFill }]}>3. Cross Reference</Text>
                  <Text style={[styles.studyBody, { color: colors.textSecondary }]}>
                    Scripture interprets Scripture. When you encounter a difficult or unclear passage, look for clearer passages on the same topic. The Bible doesn't contradict itself — it explains itself.
                  </Text>
                  <Text style={[styles.studyVerse, { color: colors.textMuted }]}>
                    {'\u2022'} Clear passages must interpret unclear ones{'\n'}
                    {'\u2022'} Don't ignore parallel passages — compare how different authors describe the same events or themes
                  </Text>
                </View>

                <View style={styles.studySection}>
                  <Text style={[styles.studyHeading, { color: accentFill }]}>4. Pay Attention to the Details</Text>
                  <Text style={[styles.studyBody, { color: colors.textSecondary }]}>
                    God inspired every word of Scripture, so the details matter. When you notice specific names, places, times, or numbers — slow down. The Holy Spirit included those details for a reason.
                  </Text>
                  <Text style={[styles.studyVerse, { color: colors.textMuted }]}>
                    {'\u2022'} Locations — Cities, regions, landmarks (why there?){'\n'}
                    {'\u2022'} Time markers — Year, month, feasts, time of day{'\n'}
                    {'\u2022'} Objects — Clothing, materials, items mentioned{'\n'}
                    {'\u2022'} Numbers — Amounts, measurements, patterns (3, 7, 12, 40...)
                  </Text>
                </View>

                <View style={styles.studySection}>
                  <Text style={[styles.studyHeading, { color: accentFill }]}>5. Repetition, Repetition, Repetition</Text>
                  <Text style={[styles.studyBody, { color: colors.textSecondary }]}>
                    When the Bible repeats something, it's emphasizing it. Repeated words, phrases, or ideas are the author's way of saying "pay attention here — this matters."
                  </Text>
                  <Text style={[styles.studyVerse, { color: colors.textMuted }]}>
                    {'\u2022'} Rev 22:17 — "Come" repeated, "Let the one" repeated{'\n'}
                    {'\u2022'} Genesis 1:3–25 — "It was good" repeated through creation{'\n'}
                    {'\u2022'} Look for repeated commands, promises, warnings, and themes
                  </Text>
                </View>

                <View style={styles.studySection}>
                  <Text style={[styles.studyHeading, { color: accentFill }]}>6. Types and Shadows</Text>
                  <Text style={[styles.studyBody, { color: colors.textSecondary }]}>
                    A "type" is an Old Testament example that foreshadows a New Testament truth. A "shadow" is an announcement of something greater to come. The whole Bible points to Christ — learn to spot Him everywhere.
                  </Text>
                  <Text style={[styles.studyVerse, { color: colors.textMuted }]}>
                    {'\u2022'} Is there a character whose story illustrates a N.T. truth? (Romans 5:14){'\n'}
                    {'\u2022'} Is there a ceremony, ritual, feast, or symbol that points to a New Covenant principle?{'\n'}
                    {'\u2022'} Is there an object or event that foreshadows the gospel? (Heb 13:10, John 3:14)
                  </Text>
                </View>

                <View style={styles.studySection}>
                  <Text style={[styles.studyHeading, { color: accentFill }]}>7. Watch for Allusions</Text>
                  <Text style={[styles.studyBody, { color: colors.textSecondary }]}>
                    The New Testament is saturated with Old Testament references — sometimes direct quotes, sometimes subtle echoes. The NT authors assumed their readers knew the O.T. The better you know the Old Testament, the deeper you'll understand the New.
                  </Text>
                  <Text style={[styles.studyVerse, { color: colors.textMuted }]}>
                    {'\u2022'} When Jesus says "It is finished," hear the echo of every completed sacrifice{'\n'}
                    {'\u2022'} When Revelation describes "a new heaven and new earth," hear Genesis 1
                  </Text>
                </View>

                <View style={styles.studySection}>
                  <Text style={[styles.studyHeading, { color: accentFill }]}>8. Outside Resources</Text>
                  <Text style={[styles.studyBody, { color: colors.textSecondary }]}>
                    Commentaries, study Bibles, and sermons are helpful — but they should supplement your study, not replace it. Do the work of reading and questioning first. Then let trusted teachers sharpen your understanding.
                  </Text>
                  <Text style={[styles.studyVerse, { color: colors.textMuted }]}>
                    {'\u2022'} Don't let commentaries do the thinking for you{'\n'}
                    {'\u2022'} Read the text yourself first, form your own observations, then consult resources
                  </Text>
                </View>

                <Text style={[styles.studyCredit, { color: colors.textMuted }]}>
                  Adapted from Pastor Daniel Batarseh{'\n'}Maranatha Bible Church — Rooted Conference
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={[styles.studyCloseBtn, { backgroundColor: isDark ? '#26252B' : '#f0ebe4' }]}
                onPress={() => setShowStudyGuide(false)}
              >
                <Text style={[styles.studyCloseBtnText, { color: colors.textPrimary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── Bible Challenge view (original or when no book selected) ──
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero banner */}
        <View style={[styles.hero, { backgroundColor: accent.bg }]}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity onPress={() => currentBook ? setShowChallenge(false) : router.back()} style={[styles.heroBack, { position: 'absolute', left: 0, zIndex: 1 }]}>
              <ArrowLeft size={22} color={accent.fg} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.crPill}
              onPress={() => setShowBookPicker(!showBookPicker)}
              activeOpacity={0.7}
            >
              <BookOpen size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.crPillText} numberOfLines={1}>
                {currentBook || 'Set what you\'re reading'}
              </Text>
              {showBookPicker ? (
                <ChevronUp size={13} color="rgba(255,255,255,0.5)" />
              ) : (
                <ChevronDown size={13} color="rgba(255,255,255,0.5)" />
              )}
            </TouchableOpacity>
          </View>

          {renderBookPicker('hero')}

          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => navigateMonth(-1)}
              disabled={viewingMonth === 1}
              style={[styles.navBtn, viewingMonth === 1 && styles.navBtnDisabled]}
            >
              <ChevronLeft size={18} color={viewingMonth === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)'} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>MONTH {plan.month} OF 12</Text>
            <TouchableOpacity
              onPress={() => navigateMonth(1)}
              disabled={viewingMonth === 12}
              style={[styles.navBtn, viewingMonth === 12 && styles.navBtnDisabled]}
            >
              <ChevronRight size={18} color={viewingMonth === 12 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)'} />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>{plan.title}</Text>
          <Text style={styles.heroTheme}>{plan.theme}</Text>

          <View style={styles.heroProgress}>
            <View style={styles.heroTrack}>
              <View style={[styles.heroFill, { width: `${Math.round(progressPct * 100)}%` }]} />
            </View>
            <View style={styles.heroStats}>
              <Text style={styles.heroStatText}>Day {completedCount} of {totalCount}</Text>
              <Text style={styles.heroStatPct}>{Math.round(progressPct * 100)}%</Text>
            </View>
          </View>
        </View>

        {/* Up Next card */}
        {nextReading && !isFutureMonth && (
          <TouchableOpacity
            style={[styles.upNextCard, { backgroundColor: colors.card, borderColor: isDark ? '#2E2D33' : '#e8e0d4' }]}
            onPress={() => toggleDay(nextReading.day)}
            activeOpacity={0.7}
          >
            <View style={styles.upNextHeader}>
              <Text style={[styles.upNextLabel, { color: accentFill }]}>UP NEXT</Text>
              <Text style={[styles.upNextDay, { color: colors.textSecondary }]}>Day {nextReading.day}</Text>
            </View>
            <Text style={[styles.upNextMain, { color: colors.textPrimary }]}>{nextReading.main}</Text>
            <Text style={[styles.upNextSub, { color: colors.textSecondary }]}>
              {nextReading.psalm}  ·  {nextReading.proverb}
            </Text>
            {nextReading.commentary ? (
              <Text style={[styles.upNextCommentary, { color: isDark ? '#B8B4AC' : '#7a7060' }]}>
                {nextReading.commentary}
              </Text>
            ) : null}
            <View style={[styles.upNextBtn, { backgroundColor: accentFill + '18' }]}>
              <Check size={14} color={accentFill} />
              <Text style={[styles.upNextBtnText, { color: accentFill }]}>Mark as Read</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Locked notice */}
        {isFutureMonth && (
          <View style={[styles.lockedBanner, { backgroundColor: colors.card, borderColor: isDark ? '#2E2D33' : '#e8e0d4' }]}>
            <Lock size={15} color={colors.textSecondary} />
            <Text style={[styles.lockedText, { color: colors.textSecondary }]}>
              Complete "{BIBLE_READING_PLAN.find(m => m.month === activeMonth)?.title}" to unlock
            </Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ALL READINGS</Text>

        <View style={[styles.readingsCard, { backgroundColor: colors.card, borderColor: isDark ? '#2E2D33' : '#e8e0d4' }]}>
          {plan.readings.map((reading, index) => {
            const isCompleted = completedDays.includes(reading.day);
            const locked = isFutureMonth;
            const isLast = index === plan.readings.length - 1;
            return (
              <TouchableOpacity
                key={reading.day}
                style={[
                  styles.readingItem,
                  !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? '#26252B' : '#f0ebe4' },
                  locked && styles.readingLocked,
                ]}
                onPress={() => !locked && toggleDay(reading.day)}
                activeOpacity={locked ? 1 : 0.6}
              >
                <View style={[styles.checkbox, { backgroundColor: isCompleted ? accentFill : 'transparent', borderColor: isCompleted ? accentFill : (isDark ? '#3D3B44' : '#d0c8bc') }]}>
                  {isCompleted && <Check size={13} color="#fff" strokeWidth={3} />}
                </View>
                <View style={styles.readingInfo}>
                  <Text style={[styles.mainReading, { color: isCompleted ? accentFill : colors.textPrimary }]}>{reading.main}</Text>
                  <Text style={[styles.subReading, { color: isDark ? '#9A968E' : '#aaa' }]}>{reading.psalm}  ·  {reading.proverb}</Text>
                  {reading.commentary ? (
                    <Text style={[styles.commentaryText, { color: isDark ? '#9A968E' : '#999' }]} numberOfLines={2}>{reading.commentary}</Text>
                  ) : null}
                </View>
                {!locked && (
                  <View style={[styles.dayBadge, { backgroundColor: isCompleted ? accentFill + '18' : (isDark ? '#1E1D22' : '#f5f0ea') }]}>
                    <Text style={[styles.dayBadgeText, { color: isCompleted ? accentFill : (isDark ? '#9A968E' : '#b0a898') }]}>{reading.day}</Text>
                  </View>
                )}
                {locked && <Lock size={13} color={isDark ? '#4A4842' : '#ccc'} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reset progress */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            Alert.alert('Reset Progress', 'This will clear all your reading progress. Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: async () => {
                await AsyncStorage.removeItem(STORAGE_KEY);
                await AsyncStorage.removeItem(ACTIVE_MONTH_KEY);
                setProgress({});
                setActiveMonth(1);
                setViewingMonth(1);
                syncEnrollment(1);
              }},
            ]);
          }}
        >
          <Text style={[styles.resetBtnText, { color: isDark ? '#8A867E' : '#b0a898' }]}>Reset Progress</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      <CelebrationModal
        visible={showCelebration}
        monthTitle={plan.title}
        nextMonthTitle={nextMonthTitle}
        onStay={() => setShowCelebration(false)}
        onNext={handleAdvanceMonth}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  // ── Hero banner ────────────────────────────
  hero: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  crPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    maxWidth: '65%',
  },
  crPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    flexShrink: 1,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  navBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.25,
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.5)',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 6,
  },
  heroTheme: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  heroProgress: {
    gap: 8,
  },
  heroTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  heroFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  heroStatPct: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  // ── Currently Reading focused view ─────────
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  readingHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  mainReadingCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mainReadingTop: {
    padding: 20,
    alignItems: 'center',
  },
  mainReadingMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 14,
  },
  changeBookBtnInline: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mainDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  mainReadingSection: {
    padding: 16,
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chapterHint: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },
  inlineStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  inlineStat: {
    flex: 1,
    alignItems: 'center',
  },
  inlineStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  inlineStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  inlineStatDivider: {
    width: 1,
    height: 28,
  },
  bookPickerInline: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  readingHeroCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  readingHeroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  readingHeroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  readingHeroBook: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  readingHeroMsg: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  changeBookBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  changeBookText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionCardSub: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  chapterTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  chapterFill: {
    height: '100%',
    borderRadius: 3,
  },
  chapterStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chapterStatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chapterStatPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chapterDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterDotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aboutTheme: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  aboutDesc: {
    fontSize: 14,
    lineHeight: 21,
  },
  aboutCredit: {
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 15,
    marginTop: 12,
  },
  bookPickerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  bookSearchRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  bookSearchInputCard: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  bookClearBtnCard: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 10,
  },
  bookSectionTitleCard: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bookChipCard: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  bookChipTextCard: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  challengeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  challengeToggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeToggleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  challengeToggleSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  // ── Up Next card ───────────────────────────
  upNextCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  upNextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upNextLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  upNextDay: {
    fontSize: 12,
    fontWeight: '600',
  },
  upNextMain: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  upNextSub: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  upNextCommentary: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 14,
  },
  upNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  upNextBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Locked ─────────────────────────────────
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  lockedText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  // ── Readings list ──────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  readingsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  readingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  readingLocked: {
    opacity: 0.4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingInfo: {
    flex: 1,
  },
  mainReading: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 1,
  },
  subReading: {
    fontSize: 11,
    fontWeight: '500',
  },
  commentaryText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 4,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // ── Book picker dropdown (hero-inline) ───
  bookPickerHero: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    padding: 12,
  },
  bookSearchRowHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 10,
  },
  bookSearchInputHero: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    paddingVertical: 0,
  },
  bookClearBtnHero: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255,100,100,0.2)',
    marginBottom: 10,
  },
  bookClearTextHero: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff8a8a',
  },
  bookSectionTitleHero: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 6,
  },
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  bookChipHero: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bookChipHeroSelected: {
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  bookChipTextHero: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  bookChipTextHeroSelected: {
    color: '#FFD700',
    fontWeight: '700',
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // ── Study Guide ─────────────────────────────
  studyGuideBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
  },
  studyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  studyModal: {
    width: '100%',
    borderRadius: 18,
    padding: 22,
    paddingBottom: 14,
    maxHeight: '88%',
  },
  studyTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 18,
  },
  studySection: {
    marginBottom: 18,
  },
  studyHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
  },
  studyBody: {
    fontSize: 13.5,
    lineHeight: 21,
    marginBottom: 6,
  },
  studyVerse: {
    fontSize: 12.5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  studyCredit: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  studyCloseBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  studyCloseBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
