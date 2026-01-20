import 'dotenv/config';
import { db } from './db';
import { communities, communityMembers, posts, comments, events, eventRsvps, microblogs } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';

async function cleanup() {
  // Find communities with "-screenshot" in the slug
  const allCommunities = await db.select().from(communities);
  const oldCommunities = allCommunities.filter(c =>
    c.slug?.includes('screenshot') || c.name?.includes('Screenshot')
  );

  oldCommunities.forEach(c => `));

  if (oldCommunities.length === 0) {
    process.exit(0);
  }

  const commIds = oldCommunities.map(c => c.id);

  // Delete in correct order (foreign key dependencies)

  // Delete posts and comments
  const communityPosts = await db.select().from(posts).where(inArray(posts.communityId, commIds));
  if (communityPosts.length > 0) {
    const postIds = communityPosts.map(p => p.id);
    await db.delete(comments).where(inArray(comments.postId, postIds));
    await db.delete(posts).where(inArray(posts.communityId, commIds));
  }

  // Delete events and RSVPs (skip if schema mismatch)
  try {
    const communityEvents = await db.select().from(events).where(inArray(events.communityId, commIds));
    if (communityEvents.length > 0) {
      const eventIds = communityEvents.map(e => e.id);
      await db.delete(eventRsvps).where(inArray(eventRsvps.eventId, eventIds));
      await db.delete(events).where(inArray(events.communityId, commIds));
    }
  } catch (error) {
    `);
  }

  // Delete community members
  await db.delete(communityMembers).where(inArray(communityMembers.communityId, commIds));

  // Delete communities
  for (const comm of oldCommunities) {
    await db.delete(communities).where(eq(communities.id, comm.id));
  }

  process.exit(0);
}

cleanup().catch(console.error);
