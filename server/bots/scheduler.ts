/**
 * Bot Scheduler
 *
 * Schedules automatic tasks:
 * - Daily Advice Bot: Posts questions and replies every 8 hours
 * - Trending hashtag/keyword updates every 15 minutes
 *
 * NOTE: Bible Verse Bot and Theology Quote Bot are DISABLED
 * since the normal feed was removed (only Advice feed remains).
 *
 * Run with: node -r esbuild-register server/bots/scheduler.ts
 * Or add to package.json scripts for production deployment
 */

import { startTrendingHashtagScheduler } from './trendingHashtagScheduler';
import { runAdviceBot } from './advice-bot-wrapper';

// DISABLED: These bots post to microblogs which is no longer used
// import { postBibleVerse } from './bible-verse-bot';
// import { postTheologyQuote } from './theology-quote-bot';

// Schedule intervals (in milliseconds)
const ADVICE_BOT_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours

// Track last post times to avoid duplicates on restart
let lastAdviceBotRun = 0;

/**
 * Run Advice Bot if interval has passed
 */
async function scheduleAdviceBot() {
  const now = Date.now();

  if (now - lastAdviceBotRun >= ADVICE_BOT_INTERVAL) {
    try {
      await runAdviceBot();
      lastAdviceBotRun = now;
      console.info('[Advice Bot] ✓ Completed run');
    } catch (error) {
      console.error('✗ [Advice Bot] Error:', error);
    }
  }
}

/**
 * Main scheduler loop
 */
async function startScheduler() {
  console.info('='.repeat(60));
  console.info('Starting Bot Scheduler');
  console.info('='.repeat(60));

  // Run Advice Bot immediately on startup
  await scheduleAdviceBot();

  // Start trending hashtag scheduler
  await startTrendingHashtagScheduler();

  // Check every minute for scheduled tasks
  setInterval(async () => {
    await scheduleAdviceBot();
  }, 60 * 1000); // Check every 60 seconds

  console.info('[Scheduler] Advice Bot: ACTIVE (every 8 hours)');
  console.info('[Scheduler] Trending Hashtags: ACTIVE (every 15 minutes)');
  console.info('[Scheduler] Bible Verse Bot: DISABLED (no feed)');
  console.info('[Scheduler] Theology Quote Bot: DISABLED (no feed)');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Start the scheduler
startScheduler().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
