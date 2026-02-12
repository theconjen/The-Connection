/**
 * Weekly Contributor Score Recalculation Script
 *
 * Run this via cron job weekly to:
 * 1. Calculate contribution scores for all active advice helpers
 * 2. Determine Top Contributor status (top 10%)
 * 3. Update contributor_scores table
 *
 * Usage:
 *   npx tsx server/scripts/recalculate-contributor-scores.ts
 *
 * Cron example (every Sunday at 3am):
 *   0 3 * * 0 cd /path/to/app && npx tsx server/scripts/recalculate-contributor-scores.ts
 */

import { recalculateAllContributorScores } from '../services/contributorScoreService';

async function main() {
  console.info('='.repeat(60));
  console.info('CONTRIBUTOR SCORE RECALCULATION');
  console.info('='.repeat(60));
  console.info(`Started at: ${new Date().toISOString()}`);
  console.info();

  try {
    const result = await recalculateAllContributorScores();

    console.info();
    console.info('Results:');
    console.info(`  Users processed: ${result.usersProcessed}`);
    console.info(`  Top Contributors: ${result.topContributorsCount}`);
    console.info(`  Percentile threshold: Top ${result.percentileThreshold}%`);
    console.info(`  Completed at: ${result.calculatedAt.toISOString()}`);
    console.info();
    console.info('SUCCESS: Contributor scores recalculated');
  } catch (error) {
    console.error('ERROR: Failed to recalculate contributor scores');
    console.error(error);
    process.exit(1);
  }

  console.info('='.repeat(60));
  process.exit(0);
}

main();
