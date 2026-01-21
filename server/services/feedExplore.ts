/**
 * Feed Explore Service
 *
 * Single source of truth for explore feed operations following the hardened pattern:
 * - Deterministic scoring function
 * - Anti-farm measures (downweight suspicious activity)
 * - Explicit result codes
 * - RequestId logging for traceability
 * - Structured diagnostics
 */

import { db as dbInstance } from '../db';
import { posts, users, comments } from '@shared/schema';
import { eq, and, desc, sql, isNull, gt, ne } from 'drizzle-orm';

// Ensure db is available
function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Ensure USE_DB=true and DATABASE_URL is set.');
  }
  return dbInstance;
}

// ============================================================================
// TYPES
// ============================================================================

export interface FeedScoringConfig {
  weights: {
    recency: number;    // Weight for time-based decay
    replies: number;    // Weight for unique commenters (highest)
    bookmarks: number;  // Weight for bookmarks
    reposts: number;    // Weight for reposts/shares
    likes: number;      // Weight for likes (lowest)
  };
  antiFarm: {
    minAccountAgeDays: number;        // Minimum account age for full weight
    maxPerUserContribution: number;   // Cap posts per user in any feed page
    suspiciousRatio: number;          // likes/uniqueCommenters threshold
    newAccountMultiplier: number;     // Multiplier for new accounts
  };
  recencyDecay: {
    halfLifeHours: number;  // Hours until score halves
    minScore: number;       // Minimum recency score
  };
}

export const DEFAULT_SCORING_CONFIG: FeedScoringConfig = {
  weights: {
    recency: 0.25,
    replies: 0.30,      // Unique commenters weighted highest
    bookmarks: 0.20,
    reposts: 0.15,
    likes: 0.10,        // Raw likes weighted lowest
  },
  antiFarm: {
    minAccountAgeDays: 7,
    maxPerUserContribution: 3,
    suspiciousRatio: 0.05,  // likes/uniqueCommenters < 0.05 = suspicious
    newAccountMultiplier: 0.5,
  },
  recencyDecay: {
    halfLifeHours: 12,
    minScore: 0.1,
  },
};

export interface FeedExploreResult {
  status: 'OK' | 'ERROR';
  success: boolean;
  code: string;
  requestId: string;
  diagnostics: {
    totalCandidates: number;
    afterAntiFarm: number;
    perUserCapped: number;
    finalCount: number;
    scoringVersion: string;
  };
  data: {
    items: FeedItem[];
    nextCursor: string | null;
  };
}

export interface FeedItem {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorUsername?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  communityId?: number | null;
  imageUrl?: string | null;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  uniqueCommenters?: number;
  bookmarkCount?: number;
  repostCount?: number;
  createdAt: Date;
  exploreScore: number;
  scoreBreakdown?: {
    recency: number;
    replies: number;
    bookmarks: number;
    reposts: number;
    likes: number;
    antiFarmPenalty: number;
  };
}

export interface ExploreOptions {
  limit?: number;
  cursor?: string;
  excludeUserId?: number;
  config?: Partial<FeedScoringConfig>;
}

// Scoring version for cache invalidation
export const SCORING_VERSION = '1.0.0';

// ============================================================================
// LOGGING HELPERS
// ============================================================================

function log(
  operation: string,
  stage: 'START' | 'COMPLETE' | 'ERROR',
  requestId: string,
  details: Record<string, any> = {}
): void {
  const detailStr = Object.entries(details)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(' ');
  console.log(`[FEED_EXPLORE][${operation}] stage=${stage} requestId=${requestId} ${detailStr}`);
}

// ============================================================================
// SCORING FUNCTION
// ============================================================================

/**
 * Calculate explore score for a post
 * This is a DETERMINISTIC function - same inputs always produce same output
 */
export function calculateExploreScore(
  post: {
    upvotes?: number;
    downvotes?: number;
    commentCount?: number;
    uniqueCommenters?: number;
    bookmarkCount?: number;
    repostCount?: number;
    createdAt: Date | string;
    authorAccountAge?: number; // days
  },
  config: FeedScoringConfig = DEFAULT_SCORING_CONFIG,
  now: number = Date.now()
): { score: number; breakdown: any } {
  const { weights, antiFarm, recencyDecay } = config;

  // Parse post age in hours
  const postTime = new Date(post.createdAt).getTime();
  const ageHours = (now - postTime) / (1000 * 60 * 60);

  // 1. Recency score (exponential decay)
  // Score = e^(-ln(2) * age / halfLife)
  const decayFactor = Math.LN2 / recencyDecay.halfLifeHours;
  const recencyScore = Math.max(
    recencyDecay.minScore,
    Math.exp(-decayFactor * ageHours)
  );

  // 2. Engagement scores (normalized 0-1)
  const likes = (post.upvotes || 0) - (post.downvotes || 0);
  const uniqueCommenters = post.uniqueCommenters || post.commentCount || 0;
  const bookmarks = post.bookmarkCount || 0;
  const reposts = post.repostCount || 0;

  // Normalize using log scale (prevents outliers from dominating)
  const normalizeEngagement = (value: number, scale: number = 10) =>
    Math.min(1, Math.log1p(value) / Math.log1p(scale));

  const repliesScore = normalizeEngagement(uniqueCommenters, 20);
  const bookmarksScore = normalizeEngagement(bookmarks, 50);
  const repostsScore = normalizeEngagement(reposts, 30);
  const likesScore = normalizeEngagement(Math.max(0, likes), 100);

  // 3. Anti-farm penalty
  let antiFarmPenalty = 1.0; // 1.0 = no penalty

  // Penalty for posts with high likes but low unique commenters (bot-like)
  if (likes > 10 && uniqueCommenters > 0) {
    const ratio = uniqueCommenters / likes;
    if (ratio < antiFarm.suspiciousRatio) {
      antiFarmPenalty *= 0.3; // Heavy penalty for suspicious ratio
    }
  }

  // Penalty for new accounts
  if (post.authorAccountAge !== undefined && post.authorAccountAge < antiFarm.minAccountAgeDays) {
    antiFarmPenalty *= antiFarm.newAccountMultiplier;
  }

  // 4. Calculate weighted score
  const rawScore =
    recencyScore * weights.recency +
    repliesScore * weights.replies +
    bookmarksScore * weights.bookmarks +
    repostsScore * weights.reposts +
    likesScore * weights.likes;

  // Apply anti-farm penalty
  const finalScore = rawScore * antiFarmPenalty;

  return {
    score: finalScore,
    breakdown: {
      recency: recencyScore,
      replies: repliesScore,
      bookmarks: bookmarksScore,
      reposts: repostsScore,
      likes: likesScore,
      antiFarmPenalty,
    },
  };
}

// ============================================================================
// GET EXPLORE FEED
// ============================================================================

/**
 * Get explore feed with anti-farm measures and deterministic scoring
 */
export async function getExploreFeed(
  userId: number | undefined,
  options: ExploreOptions,
  requestId: string
): Promise<FeedExploreResult> {
  const { limit = 25, cursor, excludeUserId, config: customConfig } = options;
  const config = { ...DEFAULT_SCORING_CONFIG, ...customConfig };

  log('GET_FEED', 'START', requestId, { userId, limit, cursor });

  try {
    const db = getDb();
    const now = Date.now();

    // Get candidate posts (recent, not deleted)
    const candidates = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        authorId: posts.authorId,
        communityId: posts.communityId,
        imageUrl: posts.imageUrl,
        upvotes: posts.upvotes,
        downvotes: posts.downvotes,
        commentCount: posts.commentCount,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(
        and(
          isNull(posts.deletedAt),
          // Only posts from last 7 days for explore
          gt(posts.createdAt as any, new Date(now - 7 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(500); // Get top 500 candidates

    const totalCandidates = candidates.length;

    // Enrich with author info and compute scores
    const enrichedPosts: (FeedItem & { authorAccountAge?: number })[] = [];

    for (const post of candidates) {
      // Get author info
      let author: any = null;
      if (post.authorId) {
        const [authorResult] = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, post.authorId))
          .limit(1);
        author = authorResult;
      }

      // Get unique commenters count
      let uniqueCommenters = 0;
      try {
        const commenterResult = await db.execute(sql`
          SELECT COUNT(DISTINCT author_id) as unique_commenters
          FROM comments
          WHERE post_id = ${post.id} AND deleted_at IS NULL
        `);
        uniqueCommenters = parseInt((commenterResult.rows[0] as any)?.unique_commenters || '0', 10);
      } catch {
        // Comments table might not have required structure
        uniqueCommenters = post.commentCount || 0;
      }

      // Calculate account age in days
      const authorAccountAge = author?.createdAt
        ? Math.floor((now - new Date(author.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      // Calculate explore score
      const { score, breakdown } = calculateExploreScore(
        {
          upvotes: post.upvotes || 0,
          downvotes: post.downvotes || 0,
          commentCount: post.commentCount || 0,
          uniqueCommenters,
          bookmarkCount: 0, // Would need bookmarks table
          repostCount: 0,   // Would need reposts table
          createdAt: post.createdAt!,
          authorAccountAge,
        },
        config,
        now
      );

      enrichedPosts.push({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.authorId!,
        authorUsername: author?.username,
        authorDisplayName: author?.displayName,
        authorAvatarUrl: author?.avatarUrl,
        communityId: post.communityId,
        imageUrl: post.imageUrl,
        upvotes: post.upvotes || 0,
        downvotes: post.downvotes || 0,
        commentCount: post.commentCount || 0,
        uniqueCommenters,
        createdAt: post.createdAt!,
        exploreScore: score,
        scoreBreakdown: breakdown,
        authorAccountAge,
      });
    }

    // Apply anti-farm filtering
    let filtered = enrichedPosts;

    // Filter out posts with very low scores (likely spam/low quality)
    // Use a very low threshold (0.001) to avoid filtering legitimate posts on new platforms
    // with low engagement. The scoring already accounts for engagement levels.
    filtered = filtered.filter(p => p.exploreScore > 0.001);
    const afterAntiFarm = filtered.length;

    // Cap posts per user (prevent single user from dominating)
    const userPostCounts = new Map<number, number>();
    const userCapped: FeedItem[] = [];

    for (const post of filtered) {
      const count = userPostCounts.get(post.authorId) || 0;
      if (count < config.antiFarm.maxPerUserContribution) {
        userCapped.push(post);
        userPostCounts.set(post.authorId, count + 1);
      }
    }
    const perUserCappedCount = userCapped.length;

    // Sort by explore score (deterministic - same scores always in same order)
    userCapped.sort((a, b) => {
      if (b.exploreScore !== a.exploreScore) {
        return b.exploreScore - a.exploreScore;
      }
      // Tie-breaker: newer posts first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Exclude current user's posts if requested
    let finalPosts = excludeUserId
      ? userCapped.filter(p => p.authorId !== excludeUserId)
      : userCapped;

    // Apply cursor pagination
    if (cursor) {
      const cursorIndex = finalPosts.findIndex(p => String(p.id) === cursor);
      if (cursorIndex !== -1) {
        finalPosts = finalPosts.slice(cursorIndex + 1);
      }
    }

    // Apply limit
    const hasMore = finalPosts.length > limit;
    const items = finalPosts.slice(0, limit);
    const nextCursor = hasMore ? String(items[items.length - 1].id) : null;

    // Clean up score breakdown for production (optional)
    const cleanItems = items.map(({ authorAccountAge, scoreBreakdown, ...item }) => ({
      ...item,
      // Optionally include scoreBreakdown for debugging
      // scoreBreakdown,
    }));

    log('GET_FEED', 'COMPLETE', requestId, {
      status: 'OK',
      totalCandidates,
      afterAntiFarm,
      perUserCappedCount,
      finalCount: items.length
    });

    return {
      status: 'OK',
      success: true,
      code: 'FEED_EXPLORE_SUCCESS',
      requestId,
      diagnostics: {
        totalCandidates,
        afterAntiFarm,
        perUserCapped: perUserCappedCount,
        finalCount: items.length,
        scoringVersion: SCORING_VERSION,
      },
      data: {
        items: cleanItems as FeedItem[],
        nextCursor,
      },
    };
  } catch (error) {
    log('GET_FEED', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'FEED_EXPLORE_FAILED',
      requestId,
      diagnostics: {
        totalCandidates: 0,
        afterAntiFarm: 0,
        perUserCapped: 0,
        finalCount: 0,
        scoringVersion: SCORING_VERSION,
      },
      data: {
        items: [],
        nextCursor: null,
      },
    };
  }
}
