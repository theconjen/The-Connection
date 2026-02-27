/**
 * Community Analytics Service
 * Provides analytics data for community admins/moderators
 */

import { db } from '../db';
import {
  communityMembers,
  chatMessages,
  communityChatRooms,
  communityWallPosts,
  events,
  eventRsvps,
  users,
} from '@shared/schema';
import { eq, and, gte, sql, count, desc } from 'drizzle-orm';

/**
 * Get comprehensive analytics for a community
 */
export async function getCommunityAnalytics(communityId: number) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    memberGrowth,
    totalMembers,
    activePosters,
    activeChatters,
    topContributors,
    chatRoomActivity,
    eventStats,
  ] = await Promise.all([
    // Member growth (last 30 days, by week)
    db.select({
      week: sql<string>`to_char(date_trunc('week', ${communityMembers.joinedAt}), 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        gte(communityMembers.joinedAt, thirtyDaysAgo)
      )
    )
    .groupBy(sql`date_trunc('week', ${communityMembers.joinedAt})`)
    .orderBy(sql`date_trunc('week', ${communityMembers.joinedAt})`),

    // Total member count
    db.select({ count: count() })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId)),

    // Active members who posted on wall (last 7 days)
    db.select({ count: sql<number>`count(distinct ${communityWallPosts.authorId})` })
      .from(communityWallPosts)
      .where(
        and(
          eq(communityWallPosts.communityId, communityId),
          gte(communityWallPosts.createdAt, sevenDaysAgo)
        )
      ),

    // Active members who chatted (last 7 days)
    db.select({ count: sql<number>`count(distinct ${chatMessages.senderId})` })
      .from(chatMessages)
      .innerJoin(communityChatRooms, eq(chatMessages.chatRoomId, communityChatRooms.id))
      .where(
        and(
          eq(communityChatRooms.communityId, communityId),
          gte(chatMessages.createdAt, sevenDaysAgo)
        )
      ),

    // Top contributors (most messages in last 30 days)
    db.select({
      userId: chatMessages.senderId,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      messageCount: count(),
    })
    .from(chatMessages)
    .innerJoin(communityChatRooms, eq(chatMessages.chatRoomId, communityChatRooms.id))
    .innerJoin(users, eq(chatMessages.senderId, users.id))
    .where(
      and(
        eq(communityChatRooms.communityId, communityId),
        gte(chatMessages.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(chatMessages.senderId, users.username, users.displayName, users.avatarUrl)
    .orderBy(desc(count()))
    .limit(10),

    // Popular chat rooms (by message count in last 30 days)
    db.select({
      roomId: communityChatRooms.id,
      roomName: communityChatRooms.name,
      messageCount: count(),
    })
    .from(chatMessages)
    .innerJoin(communityChatRooms, eq(chatMessages.chatRoomId, communityChatRooms.id))
    .where(
      and(
        eq(communityChatRooms.communityId, communityId),
        gte(chatMessages.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(communityChatRooms.id, communityChatRooms.name)
    .orderBy(desc(count()))
    .limit(10),

    // Event attendance rates
    db.select({
      totalEvents: count(),
    })
    .from(events)
    .where(
      and(
        eq(events.communityId, communityId),
        gte(events.createdAt, thirtyDaysAgo)
      )
    ),
  ]);

  return {
    totalMembers: Number(totalMembers[0]?.count ?? 0),
    memberGrowth: memberGrowth.map(r => ({ week: r.week, count: Number(r.count) })),
    activeMembers: {
      posters: Number(activePosters[0]?.count ?? 0),
      chatters: Number(activeChatters[0]?.count ?? 0),
    },
    topContributors: topContributors.map(c => ({
      userId: c.userId,
      username: c.username,
      displayName: c.displayName,
      avatarUrl: c.avatarUrl,
      messageCount: Number(c.messageCount),
    })),
    chatRoomActivity: chatRoomActivity.map(r => ({
      roomId: r.roomId,
      roomName: r.roomName,
      messageCount: Number(r.messageCount),
    })),
    recentEvents: Number(eventStats[0]?.totalEvents ?? 0),
  };
}
