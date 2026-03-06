import axios from 'axios';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { notifyMultipleUsers } from './notificationHelper';
import { wasNotificationSent } from './notificationDedup';

/**
 * Daily Verse Push Notification Service
 *
 * Sends a daily Bible verse as a push notification to all users
 * who have feed notifications enabled. Runs once per day (morning).
 */

const VERSE_REFERENCES = [
  'John 3:16', 'Philippians 4:13', 'Jeremiah 29:11', 'Romans 8:28',
  'Proverbs 3:5-6', 'Psalm 23:1-4', 'Isaiah 41:10', 'Matthew 28:20',
  'Psalm 46:1', 'Romans 8:38-39', 'Joshua 1:9', 'Psalm 119:105',
  'Matthew 6:33', 'Proverbs 18:10', '2 Timothy 1:7', 'Psalm 91:1-2',
  '1 Corinthians 13:4-7', 'Galatians 5:22-23', 'Ephesians 2:8-9',
  'Romans 12:2', 'James 1:2-4', 'Colossians 3:23', 'Hebrews 11:1',
  'Matthew 5:14-16', 'Psalm 27:1', '1 John 4:19', 'Isaiah 40:31',
  'Proverbs 16:3', 'Psalm 37:4', 'Romans 5:8', 'Lamentations 3:22-23',
  'Psalm 139:14', '2 Corinthians 5:17', 'Philippians 4:6-7',
  'Matthew 11:28-30', '1 Peter 5:7', 'Psalm 34:18', 'Proverbs 27:17',
  'Micah 6:8', 'Romans 15:13', 'Isaiah 43:2', 'Psalm 121:1-2',
];

async function fetchVerse(reference: string): Promise<{ reference: string; text: string } | null> {
  try {
    const response = await axios.get(`https://bible-api.com/${encodeURIComponent(reference)}`, {
      timeout: 10000,
    });
    if (response.data?.text) {
      return {
        reference: response.data.reference || reference,
        text: response.data.text.replace(/\s+/g, ' ').trim(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyVerseIndex(): number {
  // Deterministic per day so all users get the same verse
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return dayOfYear % VERSE_REFERENCES.length;
}

export async function sendDailyVerseNotification(): Promise<void> {
  if (!db) return;

  const todayKey = getTodayKey();
  const dedupKey = `daily-verse-${todayKey}`;

  // Already sent today
  if (await wasNotificationSent('daily_verse', dedupKey, 24)) {
    console.info('[DailyVerse] Already sent today');
    return;
  }

  const reference = VERSE_REFERENCES[getDailyVerseIndex()];
  const verse = await fetchVerse(reference);

  if (!verse) {
    console.error(`[DailyVerse] Failed to fetch verse: ${reference}`);
    return;
  }

  // Truncate verse text for notification (push has ~178 char limit for body)
  const verseText = verse.text.length > 140
    ? verse.text.slice(0, 137) + '...'
    : verse.text;

  // Get all users with feed notifications enabled
  const result = await db.execute(sql`
    SELECT id FROM users
    WHERE deleted_at IS NULL
      AND onboarding_completed = true
      AND notify_feed = true
    ORDER BY id
  `);

  const userIds = (result.rows || []).map((r: any) => r.id);

  if (userIds.length === 0) {
    console.info('[DailyVerse] No eligible users');
    return;
  }

  // Send in batches of 100
  const BATCH_SIZE = 100;
  let totalSent = 0;

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    await notifyMultipleUsers(batch, {
      title: `${verse.reference}`,
      body: `"${verseText}"`,
      data: {
        type: 'daily_verse',
        dedupKey,
        reference: verse.reference,
      },
      category: 'feed',
    });
    totalSent += batch.length;
  }

  console.info(`[DailyVerse] Sent "${verse.reference}" to ${totalSent} users`);
}

/**
 * Start the daily verse scheduler
 * Checks every hour; sends once per day at 7-8 AM UTC
 */
export function startDailyVerseScheduler(): NodeJS.Timeout {
  console.info('[DailyVerse] Starting daily verse scheduler');

  const checkAndSend = () => {
    const hour = new Date().getUTCHours();
    if (hour >= 7 && hour < 8) {
      sendDailyVerseNotification().catch(err =>
        console.error('[DailyVerse] Error:', err)
      );
    }
  };

  // Check on startup
  checkAndSend();

  return setInterval(checkAndSend, 60 * 60 * 1000);
}
