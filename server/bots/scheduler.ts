/**
 * Bot Scheduler
 *
 * Schedules automatic posts from bots:
 * - Bible Verse Bot: Posts every 8 hours
 * - Theology Quote Bot: Posts every 6 hours
 *
 * Run with: node -r esbuild-register server/bots/scheduler.ts
 * Or add to package.json scripts for production deployment
 */

import { postBibleVerse } from './bible-verse-bot';
import { postTheologyQuote } from './theology-quote-bot';
import { startTrendingHashtagScheduler } from './trendingHashtagScheduler';

// Schedule intervals (in milliseconds)
const BIBLE_VERSE_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours
const THEOLOGY_QUOTE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

// Track last post times to avoid duplicates on restart
let lastBibleVersePost = 0;
let lastTheologyQuotePost = 0;

/**
 * Post Bible verse if interval has passed
 */
async function scheduleBibleVerse() {
  const now = Date.now();

  if (now - lastBibleVersePost >= BIBLE_VERSE_INTERVAL) {
    try {
      await postBibleVerse();
      lastBibleVersePost = now;
    } catch (error) {
      console.error('✗ [Bible Verse Bot] Error:', error);
    }
  }
}

/**
 * Post theology quote if interval has passed
 */
async function scheduleTheologyQuote() {
  const now = Date.now();

  if (now - lastTheologyQuotePost >= THEOLOGY_QUOTE_INTERVAL) {
    try {
      await postTheologyQuote();
      lastTheologyQuotePost = now;
    } catch (error) {
      console.error('✗ [Theology Quote Bot] Error:', error);
    }
  }
}

/**
 * Main scheduler loop
 */
async function startScheduler() {
  console.log('='.repeat(60));
  console.log('Starting Bot Scheduler');
  console.log('='.repeat(60));

  // Post immediately on startup
  await scheduleBibleVerse();
  await scheduleTheologyQuote();

  // Start trending hashtag scheduler
  await startTrendingHashtagScheduler();

  // Check every minute for scheduled posts
  setInterval(async () => {
    await scheduleBibleVerse();
    await scheduleTheologyQuote();
  }, 60 * 1000); // Check every 60 seconds
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
