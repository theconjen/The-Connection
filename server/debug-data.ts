import 'dotenv/config';
import { db } from './db';
import { microblogs, users, posts, communities, events } from '@shared/schema';

async function debug() {
   ===');
  const allFeedPosts = await db.select().from(microblogs);
  const feedPosts = allFeedPosts.slice(-10); // Get last 10
  feedPosts.forEach(post => {
    }...`);
  });

   ===');
  const allUsers = await db.select().from(users);
  const screenshotUsers = allUsers.filter(u => u.bio?.includes('[SCREENSHOT]'));
  screenshotUsers.forEach(user => {
  });

   ===');
  const allForumPosts = await db.select().from(posts);
  const forumPosts = allForumPosts.slice(-10);
  forumPosts.forEach(post => {
  });

  const allCommunities = await db.select().from(communities).limit(10);
  allCommunities.forEach(comm => {
  });

   ===');
  const allEvents = await db.select().from(events);
  const latestEvents = allEvents.slice(-10);
  latestEvents.forEach(event => {
  });

  process.exit(0);
}

debug().catch(console.error);
