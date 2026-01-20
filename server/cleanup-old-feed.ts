import 'dotenv/config';
import { db } from './db';
import { microblogs } from '@shared/schema';
import { lt } from 'drizzle-orm';

async function cleanup() {
  // Delete all old microblogs (keep only last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const allPosts = await db.select().from(microblogs);

  const oldPosts = allPosts.filter(p => {
    const createdAt = new Date(p.createdAt);
    return createdAt < oneHourAgo;
  });


  for (const post of oldPosts) {
    await db.delete(microblogs).where(lt(microblogs.createdAt, oneHourAgo));
    break; // Delete all at once
  }

  process.exit(0);
}

cleanup().catch(console.error);
