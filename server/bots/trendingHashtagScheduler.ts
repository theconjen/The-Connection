/**
 * Trending Hashtag & Keyword Scheduler
 *
 * Updates trending hashtag and keyword scores every 15 minutes based on engagement
 * within the last 4 hours. Uses the same pattern as Bible verse and theology
 * quote bots for consistent scheduling.
 *
 * Formula: (recent_usage * 10) + (recent_likes * 5) + (recent_reposts * 7) + (recent_comments * 3)
 *
 * Run automatically via main bot scheduler
 */

import { storage } from '../storage-optimized';

const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

let lastUpdateTime = 0;

/**
 * Update trending scores if the update interval has passed
 */
async function updateTrendingScoresIfNeeded() {
  const now = Date.now();

  if (now - lastUpdateTime >= UPDATE_INTERVAL) {
    try {
      console.info('[Trending] Updating trending scores for hashtags and keywords...');

      // Update hashtag trending scores
      await storage.updateTrendingScores();
      console.info('[Trending] ✓ Hashtag scores updated');

      // Update keyword trending scores
      await storage.updateKeywordTrendingScores();
      console.info('[Trending] ✓ Keyword scores updated');

      lastUpdateTime = now;
      console.info('[Trending] ✓ Successfully updated all trending scores');
    } catch (error) {
      console.error('[Trending] ✗ Error updating trending scores:', error);
    }
  }
}

/**
 * Start the trending hashtag & keyword scheduler
 * Called by the main bot scheduler on server startup
 */
export async function startTrendingHashtagScheduler() {
  console.info('[Trending] Starting scheduler (15-minute intervals)');
  console.info('[Trending] Tracking: Hashtags + Keywords');

  // Update immediately on startup
  await updateTrendingScoresIfNeeded();

  // Check every minute for scheduled updates
  // (Follows the same pattern as Bible verse and theology quote bots)
  setInterval(async () => {
    await updateTrendingScoresIfNeeded();
  }, 60 * 1000); // Check every 60 seconds
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.info('[Trending] Shutting down scheduler');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.info('[Trending] Shutting down scheduler');
  process.exit(0);
});
