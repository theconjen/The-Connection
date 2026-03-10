/**
 * Widget Data Service
 * Syncs daily verse and bible reading progress to native widget storage.
 * - iOS: App Groups NSUserDefaults (via react-native-shared-group-preferences)
 * - Android: AsyncStorage + requestWidgetUpdate (react-native-android-widget)
 *
 * Called on app launch, app foreground, and after completing a reading.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchBiblePassage } from '../lib/bibleApi';
import { BIBLE_READING_PLAN } from '../lib/bibleReadingPlan';
import { getProgress, getActiveMonth } from '../components/BibleChallengeCard';

const APP_GROUP = 'group.app.theconnection.mobile';

// Keys stored in native widget storage
const WIDGET_VERSE_KEY = 'widget_verse_data';
const WIDGET_PROGRESS_KEY = 'widget_progress_data';

// Same verse list as DailyVerseBanner — first 90 shown, full 365 in production
const DAILY_VERSE_REFERENCES = [
  'Lamentations 3:22-23', 'Jeremiah 29:11', 'Isaiah 43:19', 'Psalm 20:4',
  'Proverbs 16:3', 'Philippians 3:13-14', '2 Corinthians 5:17', 'Isaiah 40:31',
  'Psalm 37:4', 'Romans 8:28', 'Matthew 6:33', 'Proverbs 3:5-6',
  'Joshua 1:9', 'Philippians 4:13', 'Psalm 46:1', 'Isaiah 41:10',
  'Romans 12:2', 'Hebrews 11:1', 'James 1:2-4', 'Psalm 119:105',
  'John 3:16', 'Ephesians 2:8-9', 'Galatians 5:22-23', 'Psalm 23:1-3',
  'Matthew 11:28-30', '1 Peter 5:7', 'Romans 15:13', 'Philippians 4:6-7',
  'Psalm 27:1', '2 Timothy 1:7', 'Colossians 3:23',
  '1 Corinthians 13:4-7', 'Psalm 139:14', 'Micah 6:8', 'Romans 5:8',
  'Psalm 34:18', 'Proverbs 27:17', 'Isaiah 43:2', 'Psalm 121:1-2',
  'Matthew 28:20', 'Romans 8:38-39', 'Proverbs 18:10', 'Psalm 91:1-2',
  'Matthew 5:14-16', '1 John 4:19', 'Psalm 34:8', 'John 14:27',
  'Deuteronomy 31:6', 'Psalm 118:24', 'Isaiah 26:3', 'Proverbs 4:23',
  '1 Thessalonians 5:16-18', 'Psalm 100:4-5', 'Hebrews 12:1-2', 'John 15:5',
  'Ephesians 6:10-11', 'Psalm 51:10', 'Romans 6:23', 'Matthew 7:7',
  'Psalm 103:1-3', 'Proverbs 22:6', 'Isaiah 55:8-9', 'John 10:10',
  '1 Corinthians 10:13', 'Psalm 16:11', 'Colossians 3:2', 'James 4:8',
  'Psalm 19:14', 'James 4:6', 'Ephesians 4:32', 'Mark 10:27',
  'Psalm 62:1-2', 'Romans 1:16', 'John 8:32', 'Psalm 145:18',
  'Isaiah 30:21', 'Hebrews 4:16', 'Proverbs 15:1', '2 Chronicles 7:14',
  'Psalm 40:1-3', 'Galatians 6:9', 'John 16:33', 'Psalm 73:26',
  'Matthew 19:26', 'Proverbs 19:21', 'Ephesians 3:20', 'Psalm 30:5',
  'Romans 10:9', 'Isaiah 54:17', 'Psalm 147:3',
];

function getDailyVerseReference(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return DAILY_VERSE_REFERENCES[dayOfYear % DAILY_VERSE_REFERENCES.length];
}

async function writeToWidgetStorage(key: string, data: any): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      // iOS: Write to App Group shared UserDefaults
      const SharedGroupPreferences = require('react-native-shared-group-preferences').default;
      await SharedGroupPreferences.setItem(key, data, APP_GROUP);
    } else {
      // Android: Write to AsyncStorage (widget task handler reads this)
      await AsyncStorage.setItem(key, JSON.stringify(data));
    }
  } catch {
    // Silently fail — widget data is non-critical
  }
}

async function requestAndroidWidgetUpdate(widgetName: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    await requestWidgetUpdate({ widgetName });
  } catch {
    // Widget may not be placed on home screen
  }
}

/** Sync daily verse data to widget storage */
export async function syncDailyVerseWidget(): Promise<void> {
  const reference = getDailyVerseReference();
  const today = new Date().toISOString().split('T')[0];

  // Check if we already synced today
  try {
    const cached = await AsyncStorage.getItem('widget_verse_cache_date');
    if (cached === today) return;
  } catch {}

  const result = await fetchBiblePassage(reference);

  const verseData = {
    reference,
    text: result.success ? result.text : '',
    date: today,
    translation: 'WEB',
  };

  await writeToWidgetStorage(WIDGET_VERSE_KEY, verseData);
  await AsyncStorage.setItem('widget_verse_cache_date', today);
  await requestAndroidWidgetUpdate('DailyVerseWidget');
}

/** Sync bible reading progress to widget storage */
export async function syncBibleProgressWidget(): Promise<void> {
  const activeMonth = await getActiveMonth();
  const progress = await getProgress();

  const plan = BIBLE_READING_PLAN.find(m => m.month === activeMonth);
  if (!plan) return;

  const completed = progress[String(activeMonth)] || [];
  const totalCount = plan.readings.length;
  const completedCount = completed.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const nextDay = plan.readings.find(r => !completed.includes(r.day));

  const progressData = {
    planTitle: plan.title,
    activeMonth,
    completedCount,
    totalCount,
    percentComplete,
    nextReading: nextDay?.main || 'All done!',
    date: new Date().toISOString().split('T')[0],
  };

  await writeToWidgetStorage(WIDGET_PROGRESS_KEY, progressData);
  await requestAndroidWidgetUpdate('BibleProgressWidget');
}

/** Sync all widget data — call on app launch and foreground */
export async function syncAllWidgetData(): Promise<void> {
  await Promise.all([
    syncDailyVerseWidget(),
    syncBibleProgressWidget(),
  ]);
}
