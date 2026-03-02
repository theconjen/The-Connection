import 'dotenv/config';
import { db } from './db';
import { microblogs, users, posts, communities, events } from '@shared/schema';

async function debug() {
  console.info('=== Last 10 Microblogs ===');
  const allFeedPosts = await db.select().from(microblogs);
  const feedPosts = allFeedPosts.slice(-10);
  feedPosts.forEach((post: Record<string, unknown>) => {
    console.info(`  [${post.id}] ${String(post.content || '').slice(0, 60)}...`);
  });

  console.info('\n=== Screenshot Users ===');
  const allUsers = await db.select().from(users);
  const screenshotUsers = allUsers.filter(u => u.bio?.includes('[SCREENSHOT]'));
  screenshotUsers.forEach(user => {
    console.info(`  [${user.id}] ${user.username} - ${user.displayName}`);
  });

  console.info('\n=== Last 10 Forum Posts ===');
  const allForumPosts = await db.select().from(posts);
  const forumPosts = allForumPosts.slice(-10);
  forumPosts.forEach(post => {
    console.info(`  [${post.id}] ${post.title}`);
  });

  console.info('\n=== Communities (first 10) ===');
  const allCommunities = await db.select().from(communities).limit(10);
  allCommunities.forEach(comm => {
    console.info(`  [${comm.id}] ${comm.name} (${comm.slug})`);
  });

  console.info('\n=== Last 10 Events ===');
  const allEvents = await db.select().from(events);
  const latestEvents = allEvents.slice(-10);
  latestEvents.forEach(event => {
    console.info(`  [${event.id}] ${event.title}`);
  });

  process.exit(0);
}

debug().catch(console.error);
