/**
 * Master seed script for all App Store screenshot data
 * Run: npx tsx server/seed-all-screenshots.ts
 * Remove: npx tsx server/seed-all-screenshots.ts --remove
 */

import { execSync } from 'child_process';

const scripts = [
  'server/seed-screenshot-users.ts',
  'server/seed-screenshot-communities.ts',
  'server/seed-screenshot-feed.ts',
  'server/seed-screenshot-posts.ts',
  'server/seed-screenshot-events.ts',
];

async function runAllSeeds() {
  const args = process.argv.slice(2);
  const isRemove = args.includes('--remove');
  const flag = isRemove ? '--remove' : '';


  for (const script of scripts) {
    try {
      }`);
      );

      execSync(`npx tsx ${script} ${flag}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`\n❌ Error running ${script}:`, error);
      process.exit(1);
    }
  }

  );
  if (isRemove) {
  } else {
  }
   + '\n');
}

runAllSeeds().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
