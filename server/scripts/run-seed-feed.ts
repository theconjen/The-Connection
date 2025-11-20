#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';
import { seedFeed } from '../seed-feed';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

(async () => {
  try {
    await seedFeed();
    console.log('seedFeed finished');
    process.exit(0);
  } catch (err) {
    console.error('seedFeed error', err);
    process.exit(1);
  }
})();
