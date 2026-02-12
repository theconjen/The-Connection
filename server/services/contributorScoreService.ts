/**
 * Contributor Score Service
 *
 * Manages "Top Contributor" status for the Global Community (Advice) section.
 * Uses a subtle gamification approach that rewards quality participation.
 *
 * Design Philosophy:
 * - Quiet recognition that feels earned, not patronizing
 * - No flashy animations or constant progress bars
 * - Functional benefits (better visibility) over cosmetic rewards
 * - Respects the faith-based, advice-seeking context
 */

import { db } from '../db';
import { eq, and, sql, isNull, desc, gte } from 'drizzle-orm';
import { microblogs, microblogLikes, helpfulMarks, contributorScores } from '@shared/schema';
import { notifyUserWithPreferences } from './notificationHelper';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SCORE_CONFIG = {
  // Point weights for contribution score calculation
  weights: {
    upvotesReceived: 2,      // Each upvote on your replies
    helpfulMarksReceived: 5, // Each "helpful" mark (community votes for best answer)
    repliesGiven: 1,         // Each reply you give
    postsWithZeroEngagement: -0.5, // Penalty for low-quality posts
  },

  // Top contributor thresholds
  percentileThreshold: 10, // Top 10% are labeled "Top Contributor"

  // Rolling window for score calculation (days)
  rollingWindowDays: 90,

  // Minimum activity to be considered for Top Contributor
  minimumReplies: 5,
};

// ============================================================================
// TYPES
// ============================================================================

export interface UserContributionStats {
  userId: number;
  upvotesReceived: number;
  helpfulMarksReceived: number;
  repliesGiven: number;
  postsWithZeroEngagement: number;
  score: number;
}

export interface ScoreCalculationResult {
  usersProcessed: number;
  topContributorsCount: number;
  percentileThreshold: number;
  calculatedAt: Date;
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

/**
 * Calculate contribution score from stats
 */
function calculateScore(stats: UserContributionStats): number {
  const { weights } = SCORE_CONFIG;

  return (
    (stats.upvotesReceived * weights.upvotesReceived) +
    (stats.helpfulMarksReceived * weights.helpfulMarksReceived) +
    (stats.repliesGiven * weights.repliesGiven) +
    (stats.postsWithZeroEngagement * weights.postsWithZeroEngagement)
  );
}

/**
 * Get contribution stats for a user in the global advice context
 * Uses a rolling window to ensure recent activity matters
 */
export async function getUserContributionStats(userId: number): Promise<UserContributionStats> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - SCORE_CONFIG.rollingWindowDays);

  // Get replies given by user (microblogs with parentId set, topic QUESTION context)
  const repliesResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(microblogs)
    .where(and(
      eq(microblogs.authorId, userId),
      sql`${microblogs.parentId} IS NOT NULL`,
      gte(microblogs.createdAt, windowStart)
    ));
  const repliesGiven = repliesResult[0]?.count || 0;

  // Get upvotes received on user's replies
  const upvotesResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(microblogLikes)
    .innerJoin(microblogs, eq(microblogLikes.microblogId, microblogs.id))
    .where(and(
      eq(microblogs.authorId, userId),
      sql`${microblogs.parentId} IS NOT NULL`,
      gte(microblogLikes.createdAt, windowStart)
    ));
  const upvotesReceived = upvotesResult[0]?.count || 0;

  // Get helpful marks received on user's replies
  const helpfulResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(helpfulMarks)
    .innerJoin(microblogs, eq(helpfulMarks.replyId, microblogs.id))
    .where(and(
      eq(microblogs.authorId, userId),
      gte(helpfulMarks.createdAt, windowStart)
    ));
  const helpfulMarksReceived = helpfulResult[0]?.count || 0;

  // Get posts with zero engagement (replies that got no likes or helpful marks)
  const zeroEngagementResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(microblogs)
    .where(and(
      eq(microblogs.authorId, userId),
      sql`${microblogs.parentId} IS NOT NULL`,
      eq(microblogs.likeCount, 0),
      eq(microblogs.helpfulCount, 0),
      gte(microblogs.createdAt, windowStart)
    ));
  const postsWithZeroEngagement = zeroEngagementResult[0]?.count || 0;

  const stats: UserContributionStats = {
    userId,
    upvotesReceived,
    helpfulMarksReceived,
    repliesGiven,
    postsWithZeroEngagement,
    score: 0,
  };

  stats.score = calculateScore(stats);

  return stats;
}

/**
 * Recalculate scores for all users and determine top contributors
 * This should be run weekly via cron job
 */
export async function recalculateAllContributorScores(): Promise<ScoreCalculationResult> {
  console.info('[ContributorScore] Starting weekly recalculation...');
  const startTime = Date.now();

  // Get previous top contributors (to detect new ones for notifications)
  const previousTopContributors = await db
    .select({ userId: contributorScores.userId })
    .from(contributorScores)
    .where(and(
      eq(contributorScores.contextType, 'global_advice'),
      isNull(contributorScores.contextId),
      eq(contributorScores.isTopContributor, true)
    ));
  const previousTopContributorIds = new Set(previousTopContributors.map(r => r.userId));

  // Get all users who have replied to advice questions in the rolling window
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - SCORE_CONFIG.rollingWindowDays);

  const activeUsers = await db
    .selectDistinct({ userId: microblogs.authorId })
    .from(microblogs)
    .where(and(
      sql`${microblogs.parentId} IS NOT NULL`,
      gte(microblogs.createdAt, windowStart)
    ));

  const userScores: UserContributionStats[] = [];

  // Calculate scores for each user
  for (const { userId } of activeUsers) {
    if (!userId) continue;

    const stats = await getUserContributionStats(userId);

    // Only consider users with minimum activity
    if (stats.repliesGiven >= SCORE_CONFIG.minimumReplies) {
      userScores.push(stats);
    }
  }

  // Sort by score descending
  userScores.sort((a, b) => b.score - a.score);

  // Determine percentile threshold for top contributor status
  const topContributorCount = Math.ceil(userScores.length * (SCORE_CONFIG.percentileThreshold / 100));
  const topContributorThreshold = userScores[topContributorCount - 1]?.score || Infinity;

  // Track new and continuing top contributors for notifications
  const newTopContributors: number[] = [];
  const continuingTopContributors: number[] = [];

  // Update contributor_scores table
  for (let i = 0; i < userScores.length; i++) {
    const stats = userScores[i];
    const isTopContributor = i < topContributorCount && stats.score > 0;
    const percentile = ((userScores.length - i) / userScores.length) * 100;

    // Track for notifications
    if (isTopContributor) {
      if (previousTopContributorIds.has(stats.userId)) {
        continuingTopContributors.push(stats.userId);
      } else {
        newTopContributors.push(stats.userId);
      }
    }

    await db
      .insert(contributorScores)
      .values({
        userId: stats.userId,
        contextType: 'global_advice',
        contextId: null,
        score: Math.round(stats.score),
        upvotesReceived: stats.upvotesReceived,
        helpfulMarksReceived: stats.helpfulMarksReceived,
        repliesGiven: stats.repliesGiven,
        postsWithZeroEngagement: stats.postsWithZeroEngagement,
        isTopContributor,
        percentile: percentile.toFixed(2),
        lastCalculatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [contributorScores.userId, contributorScores.contextType, contributorScores.contextId],
        set: {
          score: Math.round(stats.score),
          upvotesReceived: stats.upvotesReceived,
          helpfulMarksReceived: stats.helpfulMarksReceived,
          repliesGiven: stats.repliesGiven,
          postsWithZeroEngagement: stats.postsWithZeroEngagement,
          isTopContributor,
          percentile: percentile.toFixed(2),
          lastCalculatedAt: new Date(),
        },
      });
  }

  // Remove top contributor status from users who are no longer active
  // (those not in the current calculation)
  const activeUserIds = userScores.map(s => s.userId);
  if (activeUserIds.length > 0) {
    await db
      .update(contributorScores)
      .set({ isTopContributor: false })
      .where(and(
        eq(contributorScores.contextType, 'global_advice'),
        isNull(contributorScores.contextId),
        sql`${contributorScores.userId} NOT IN (${sql.join(activeUserIds.map(id => sql`${id}`), sql`, `)})`
      ));
  }

  // Send encouraging notifications
  await sendTopContributorNotifications(newTopContributors, continuingTopContributors);

  const elapsed = Date.now() - startTime;
  console.info(`[ContributorScore] Recalculation complete. Processed ${userScores.length} users, ${topContributorCount} top contributors (${newTopContributors.length} new). Took ${elapsed}ms`);

  return {
    usersProcessed: userScores.length,
    topContributorsCount: topContributorCount,
    percentileThreshold: SCORE_CONFIG.percentileThreshold,
    calculatedAt: new Date(),
  };
}

/**
 * Incrementally update a user's score when they receive engagement
 * This provides faster feedback without waiting for weekly recalculation
 */
export async function incrementUserScore(
  userId: number,
  type: 'upvote' | 'helpful_mark' | 'reply'
): Promise<void> {
  try {
    const { weights } = SCORE_CONFIG;
    let increment = 0;

    switch (type) {
      case 'upvote':
        increment = weights.upvotesReceived;
        break;
      case 'helpful_mark':
        increment = weights.helpfulMarksReceived;
        break;
      case 'reply':
        increment = weights.repliesGiven;
        break;
    }

    // Upsert the score record
    await db
      .insert(contributorScores)
      .values({
        userId,
        contextType: 'global_advice',
        contextId: null,
        score: increment,
        upvotesReceived: type === 'upvote' ? 1 : 0,
        helpfulMarksReceived: type === 'helpful_mark' ? 1 : 0,
        repliesGiven: type === 'reply' ? 1 : 0,
        postsWithZeroEngagement: 0,
        isTopContributor: false,
        lastCalculatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [contributorScores.userId, contributorScores.contextType, contributorScores.contextId],
        set: {
          score: sql`COALESCE(score, 0) + ${increment}`,
          upvotesReceived: type === 'upvote'
            ? sql`COALESCE(upvotes_received, 0) + 1`
            : sql`COALESCE(upvotes_received, 0)`,
          helpfulMarksReceived: type === 'helpful_mark'
            ? sql`COALESCE(helpful_marks_received, 0) + 1`
            : sql`COALESCE(helpful_marks_received, 0)`,
          repliesGiven: type === 'reply'
            ? sql`COALESCE(replies_given, 0) + 1`
            : sql`COALESCE(replies_given, 0)`,
          lastCalculatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('[ContributorScore] Error incrementing user score:', error);
  }
}

/**
 * Get top contributors for display (e.g., on a leaderboard or profile)
 */
export async function getTopContributorsList(limit: number = 10): Promise<Array<{
  userId: number;
  score: number;
  rank: number;
}>> {
  const results = await db
    .select({
      userId: contributorScores.userId,
      score: contributorScores.score,
    })
    .from(contributorScores)
    .where(and(
      eq(contributorScores.contextType, 'global_advice'),
      isNull(contributorScores.contextId),
      eq(contributorScores.isTopContributor, true)
    ))
    .orderBy(desc(contributorScores.score))
    .limit(limit);

  return results.map((r, index) => ({
    userId: r.userId,
    score: r.score || 0,
    rank: index + 1,
  }));
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Send encouraging notifications to top contributors
 * - New top contributors: "You're now a Top Contributor in Global Community!"
 * - Continuing top contributors: "You're still a Top Contributor this week!"
 */
async function sendTopContributorNotifications(
  newTopContributors: number[],
  continuingTopContributors: number[]
): Promise<void> {
  console.info(`[ContributorScore] Sending notifications to ${newTopContributors.length} new and ${continuingTopContributors.length} continuing top contributors`);

  // Notify new top contributors
  for (const userId of newTopContributors) {
    try {
      await notifyUserWithPreferences(userId, {
        title: "You're now a Top Contributor!",
        body: "Your helpful advice in the Global Community has earned you Top Contributor status. Thank you for blessing others with your wisdom!",
        data: {
          type: 'top_contributor_earned',
          context: 'global_advice',
        },
        category: 'feed',
      });
    } catch (error) {
      console.error(`[ContributorScore] Error notifying new top contributor ${userId}:`, error);
    }
  }

  // Notify continuing top contributors (weekly encouragement)
  for (const userId of continuingTopContributors) {
    try {
      await notifyUserWithPreferences(userId, {
        title: "You're still a Top Contributor!",
        body: "Your consistent helpfulness in the Global Community continues to make a difference. Keep sharing your wisdom!",
        data: {
          type: 'top_contributor_retained',
          context: 'global_advice',
        },
        category: 'feed',
      });
    } catch (error) {
      console.error(`[ContributorScore] Error notifying continuing top contributor ${userId}:`, error);
    }
  }
}

/**
 * Get encouraging message variations for helpful mark notifications
 * Adds variety to prevent notifications from feeling repetitive
 */
export function getHelpfulMarkMessage(helpfulCount: number): { title: string; body: string } {
  if (helpfulCount === 1) {
    const titles = [
      "Someone found your advice helpful!",
      "Your advice made a difference!",
      "You helped someone today!",
    ];
    return {
      title: titles[Math.floor(Math.random() * titles.length)],
      body: "Keep sharing your wisdom with the community.",
    };
  }

  if (helpfulCount === 5) {
    return {
      title: "5 people found your advice helpful!",
      body: "Your guidance is making a real impact in the community.",
    };
  }

  if (helpfulCount === 10) {
    return {
      title: "10 people found your advice helpful!",
      body: "You're becoming a trusted voice in the Global Community!",
    };
  }

  if (helpfulCount === 25) {
    return {
      title: "25 people found your advice helpful!",
      body: "Your wisdom is blessing many in our community. Thank you!",
    };
  }

  if (helpfulCount === 50) {
    return {
      title: "50 people found your advice helpful!",
      body: "You're making a significant impact! Consider becoming a regular contributor.",
    };
  }

  if (helpfulCount >= 100) {
    return {
      title: `${helpfulCount} people found your advice helpful!`,
      body: "Your faithfulness in helping others is truly inspiring.",
    };
  }

  return {
    title: `${helpfulCount} people found your advice helpful`,
    body: "Thank you for contributing to the community.",
  };
}
