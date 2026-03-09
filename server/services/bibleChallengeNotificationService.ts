import { db } from '../db';
import { sql } from 'drizzle-orm';
import { notifyMultipleUsers } from './notificationHelper';
import { wasNotificationSent } from './notificationDedup';

/**
 * Bible Challenge Push Notification Service
 *
 * Sends a daily push reminder to users enrolled in the Bible reading challenge.
 * Each user gets a notification with their current month's next reading + commentary.
 * Runs once per day at 8-9 AM UTC (after the daily verse at 7 AM).
 */

// Compact reading plan: just references + commentaries per month
// Must stay in sync with mobile-app bibleReadingPlan.ts
const MONTH_PLANS: { month: number; title: string; chapters: { ref: string; note: string }[] }[] = [
  { month: 1, title: 'Meet Jesus', chapters: [
    { ref: 'Mark 1', note: 'Jesus begins His ministry with baptism and calling His first disciples.' },
    { ref: 'Mark 2', note: 'Jesus forgives sins and declares Himself Lord of the Sabbath.' },
    { ref: 'Mark 3', note: 'Jesus appoints twelve apostles and faces growing opposition.' },
    { ref: 'Mark 4', note: 'Jesus teaches in parables and calms a storm.' },
    { ref: 'Mark 5', note: 'Three powerful miracles: healing, touching, and raising.' },
    { ref: 'Mark 6', note: 'Jesus is rejected in His hometown and feeds 5,000.' },
    { ref: 'Mark 7', note: 'True purity comes from the heart, not traditions.' },
    { ref: 'Mark 8', note: 'Peter confesses Jesus as the Christ.' },
    { ref: 'Mark 9', note: 'The Transfiguration reveals Jesus\' glory.' },
    { ref: 'Mark 10', note: 'Jesus teaches on marriage, children, and sacrifice.' },
    { ref: 'Mark 11', note: 'Jesus enters Jerusalem and clears the temple.' },
    { ref: 'Mark 12', note: 'The greatest commandment: love God, love people.' },
    { ref: 'Mark 13', note: 'Jesus warns His followers to stay watchful and ready.' },
    { ref: 'Mark 14', note: 'The Last Supper, Gethsemane, and betrayal.' },
    { ref: 'Mark 15', note: 'Jesus is crucified. The temple curtain is torn.' },
    { ref: 'Mark 16', note: 'The empty tomb — Jesus is risen!' },
  ]},
  { month: 2, title: 'The Beginning', chapters: [
    { ref: 'Genesis 1', note: 'God creates the heavens and the earth.' },
    { ref: 'Genesis 2', note: 'God forms Adam, plants Eden, and creates Eve.' },
    { ref: 'Genesis 3', note: 'The fall — sin enters the world, but God promises a rescuer.' },
    { ref: 'Genesis 4', note: 'Cain and Abel — the first murder.' },
    { ref: 'Genesis 5', note: 'The genealogy from Adam to Noah.' },
    { ref: 'Genesis 6', note: 'Wickedness fills the earth. God finds one righteous man: Noah.' },
    { ref: 'Genesis 7', note: 'The flood comes. Noah\'s family is saved.' },
    { ref: 'Genesis 8', note: 'The waters recede and Noah steps onto dry ground.' },
    { ref: 'Genesis 9', note: 'God makes a rainbow covenant with Noah.' },
    { ref: 'Genesis 10', note: 'Noah\'s descendants spread across the earth.' },
    { ref: 'Genesis 11', note: 'The Tower of Babel — humanity\'s pride is scattered.' },
    { ref: 'Philippians 1', note: 'Christ gives purpose even in suffering.' },
    { ref: 'Philippians 2', note: 'Jesus emptied Himself and became a servant.' },
    { ref: 'Philippians 3', note: 'Press on toward the goal.' },
    { ref: 'Philippians 4', note: '"I can do all things through Christ."' },
    { ref: 'Colossians 1', note: 'Christ holds all creation together.' },
    { ref: 'Colossians 2', note: 'Your fullness is found in Christ alone.' },
    { ref: 'Colossians 3', note: 'Put on compassion, kindness, humility, and love.' },
    { ref: 'Colossians 4', note: 'Pray with thanksgiving, speak with grace.' },
    { ref: '1 Thessalonians 1', note: 'Their faith became an example to believers everywhere.' },
    { ref: '1 Thessalonians 2', note: 'Paul\'s gentle ministry — like a mother caring for her children.' },
    { ref: '1 Thessalonians 3', note: 'Timothy brings good news of their faith.' },
    { ref: '1 Thessalonians 4', note: 'Live to please God and love each other more.' },
    { ref: '1 Thessalonians 5', note: 'Rejoice always, pray continually, give thanks.' },
  ]},
  { month: 3, title: 'The Life of Christ', chapters: Array.from({length: 21}, (_, i) => ({ ref: `John ${i+1}`, note: `John chapter ${i+1}` })) },
  { month: 4, title: 'The Full Story', chapters: Array.from({length: 24}, (_, i) => ({ ref: `Luke ${i+1}`, note: `Luke chapter ${i+1}` })) },
  { month: 5, title: 'The Early Church', chapters: Array.from({length: 28}, (_, i) => ({ ref: `Acts ${i+1}`, note: `Acts chapter ${i+1}` })) },
  { month: 6, title: 'Freedom & Faith', chapters: [
    ...Array.from({length: 6}, (_, i) => ({ ref: `Galatians ${i+1}`, note: `Galatians ${i+1}` })),
    ...Array.from({length: 6}, (_, i) => ({ ref: `Ephesians ${i+1}`, note: `Ephesians ${i+1}` })),
    ...Array.from({length: 5}, (_, i) => ({ ref: `1 Peter ${i+1}`, note: `1 Peter ${i+1}` })),
    ...Array.from({length: 6}, (_, i) => ({ ref: `1 Timothy ${i+1}`, note: `1 Timothy ${i+1}` })),
  ]},
  { month: 7, title: 'The Exodus', chapters: Array.from({length: 20}, (_, i) => ({ ref: `Exodus ${i+1}`, note: `Exodus chapter ${i+1}` })) },
  { month: 8, title: "God's Kingdom", chapters: Array.from({length: 28}, (_, i) => ({ ref: `1 Samuel ${i+1}`, note: `1 Samuel ${i+1}` })) },
  { month: 9, title: 'Grace', chapters: [
    ...Array.from({length: 16}, (_, i) => ({ ref: `Romans ${i+1}`, note: `Romans ${i+1}` })),
    ...Array.from({length: 7}, (_, i) => ({ ref: `Hebrews ${i+1}`, note: `Hebrews ${i+1}` })),
  ]},
  { month: 10, title: 'Wisdom', chapters: [
    ...Array.from({length: 16}, (_, i) => ({ ref: `1 Corinthians ${i+1}`, note: `1 Corinthians ${i+1}` })),
    ...Array.from({length: 6}, (_, i) => ({ ref: `Hebrews ${i+8}`, note: `Hebrews ${i+8}` })),
  ]},
  { month: 11, title: "God's Faithfulness", chapters: Array.from({length: 24}, (_, i) => ({ ref: `2 Samuel ${i+1}`, note: `2 Samuel ${i+1}` })) },
  { month: 12, title: 'Hope & Promise', chapters: [
    ...Array.from({length: 9}, (_, i) => ({ ref: `Isaiah ${i+1}`, note: `Isaiah ${i+1}` })),
    ...Array.from({length: 16}, (_, i) => ({ ref: `Isaiah ${i+40}`, note: `Isaiah ${i+40}` })),
  ]},
];

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function sendBibleChallengeNotifications(): Promise<void> {
  if (!db) return;

  const todayKey = getTodayKey();
  const dedupKey = `bible-challenge-${todayKey}`;

  if (await wasNotificationSent('bible_challenge', dedupKey, 24)) {
    console.info('[BibleChallenge] Already sent today');
    return;
  }

  // Get all enrolled users (bible_challenge_month is not null)
  const result = await db.execute(sql`
    SELECT id, bible_challenge_month FROM users
    WHERE deleted_at IS NULL
      AND onboarding_completed = true
      AND notify_feed = true
      AND bible_challenge_month IS NOT NULL
      AND bible_challenge_month >= 1
      AND bible_challenge_month <= 12
    ORDER BY id
  `);

  const enrolledUsers = (result.rows || []) as { id: number; bible_challenge_month: number }[];

  if (enrolledUsers.length === 0) {
    console.info('[BibleChallenge] No enrolled users');
    return;
  }

  // Group users by their active month
  const byMonth = new Map<number, number[]>();
  for (const user of enrolledUsers) {
    const month = user.bible_challenge_month;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(user.id);
  }

  let totalSent = 0;
  const BATCH_SIZE = 100;

  for (const [month, userIds] of byMonth) {
    const plan = MONTH_PLANS.find(p => p.month === month);
    if (!plan) continue;

    // Pick a reading based on day-of-month (cycles through the plan)
    const dayOfMonth = new Date().getDate(); // 1-31
    const readingIndex = (dayOfMonth - 1) % plan.chapters.length;
    const reading = plan.chapters[readingIndex];

    const title = `Today's Reading: ${reading.ref}`;
    const body = reading.note;

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);
      await notifyMultipleUsers(batch, {
        title,
        body,
        data: {
          type: 'bible_challenge',
          dedupKey,
          month,
          reference: reading.ref,
          screen: 'bible-challenge',
        },
        category: 'feed',
      });
      totalSent += batch.length;
    }
  }

  console.info(`[BibleChallenge] Sent reminders to ${totalSent} users across ${byMonth.size} month groups`);
}

/**
 * Start the Bible Challenge notification scheduler
 * Checks every hour; sends once per day at 8-9 AM UTC
 */
export function startBibleChallengeScheduler(): NodeJS.Timeout {
  console.info('[BibleChallenge] Starting Bible Challenge scheduler');

  const checkAndSend = () => {
    const hour = new Date().getUTCHours();
    if (hour >= 8 && hour < 9) {
      sendBibleChallengeNotifications().catch(err =>
        console.error('[BibleChallenge] Error:', err)
      );
    }
  };

  checkAndSend();

  return setInterval(checkAndSend, 60 * 60 * 1000);
}
