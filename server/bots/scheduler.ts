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
    console.log('\n📖 [Bible Verse Bot] Posting...');
    try {
      await postBibleVerse();
      lastBibleVersePost = now;
      console.log(`✓ [Bible Verse Bot] Next post in 8 hours`);
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
    console.log('\n✝️  [Theology Quote Bot] Posting...');
    try {
      await postTheologyQuote();
      lastTheologyQuotePost = now;
      console.log(`✓ [Theology Quote Bot] Next post in 6 hours`);
    } catch (error) {
      console.error('✗ [Theology Quote Bot] Error:', error);
    }
  }
}

/**
 * Main scheduler loop
 */
async function startScheduler() {
  console.log('🤖 Bot Scheduler Starting...');
  console.log('─'.repeat(50));
  console.log('📖 Bible Verse Bot: Posts every 8 hours');
  console.log('✝️  Theology Quote Bot: Posts every 6 hours');
  console.log('─'.repeat(50));
  console.log('\nPress Ctrl+C to stop\n');

  // Post immediately on startup
  console.log('📝 Posting initial content...\n');
  await scheduleBibleVerse();
  await scheduleTheologyQuote();

  // Check every minute for scheduled posts
  setInterval(async () => {
    await scheduleBibleVerse();
    await scheduleTheologyQuote();
  }, 60 * 1000); // Check every 60 seconds
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Scheduler stopping...');
  console.log('✓ Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Scheduler stopping...');
  console.log('✓ Goodbye!');
  process.exit(0);
});

// Start the scheduler
startScheduler().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
