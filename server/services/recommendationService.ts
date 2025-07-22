import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db';
import { users, microblogs, communities, userFollows, microblogLikes, communityMembers, userInteractions } from '../../shared/schema';

export interface RecommendationScore {
  contentId: number;
  contentType: 'microblog' | 'community' | 'event';
  score: number;
  reasons: string[];
}

export interface PersonalizedFeed {
  microblogs: any[];
  communities: any[];
  totalScore?: number;
}

export class RecommendationService {
  private readonly INTERACTION_WEIGHTS = {
    like: 3,
    comment: 5,
    share: 4,
    view: 1,
    follow: 8,
    join_community: 6,
  };

  private readonly CONTENT_WEIGHTS = {
    recency: 0.3,        // How recent the content is
    engagement: 0.25,    // Likes, comments, shares
    similarity: 0.2,     // Similar to what user interacted with
    social_proof: 0.15,  // What people they follow interact with
    diversity: 0.1,      // Content variety to avoid echo chamber
  };

  async generatePersonalizedFeed(userId: number, limit = 20): Promise<PersonalizedFeed> {
    // Get user's interaction history and preferences
    const userProfile = await this.getUserProfile(userId);
    const followedUsers = await this.getFollowedUsers(userId);
    const userInteractionHistory = await this.getUserInteractions(userId);
    
    // Get candidate content
    const candidateMicroblogs = await this.getCandidateMicroblogs(userId, followedUsers);
    const candidateCommunities = await this.getCandidateCommunities(userId);
    
    // Score and rank microblogs
    const scoredMicroblogs = await this.scoreMicroblogs(
      candidateMicroblogs,
      userProfile,
      followedUsers,
      userInteractionHistory
    );
    
    // Score and rank communities
    const scoredCommunities = await this.scoreCommunities(
      candidateCommunities,
      userProfile,
      userInteractionHistory
    );
    
    // Apply diversity and return top content
    const diversifiedMicroblogs = this.applyDiversification(scoredMicroblogs);
    const diversifiedCommunities = this.applyDiversification(scoredCommunities);
    
    return {
      microblogs: diversifiedMicroblogs.slice(0, limit),
      communities: diversifiedCommunities.slice(0, Math.floor(limit / 3)),
    };
  }

  private async getUserProfile(userId: number) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return null;

    // Get user's interest tags and interaction patterns
    const interactionTags = await db
      .select({
        tag: sql`unnest(string_to_array(${microblogs.content}, ' '))`.as('tag'),
        count: sql`count(*)`.as('count')
      })
      .from(microblogLikes)
      .innerJoin(microblogs, eq(microblogLikes.microblogId, microblogs.id))
      .where(eq(microblogLikes.userId, userId))
      .groupBy(sql`unnest(string_to_array(${microblogs.content}, ' '))`)
      .orderBy(desc(sql`count(*)`))
      .limit(20);

    return {
      ...user[0],
      preferredTags: interactionTags.map(t => t.tag).filter(tag => 
        tag && tag.length > 3 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'].includes(tag.toLowerCase())
      ),
    };
  }

  private async getFollowedUsers(userId: number): Promise<number[]> {
    const follows = await db
      .select({ followingId: userFollows.followingId })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
    
    return follows.map(f => f.followingId);
  }

  private async getUserInteractions(userId: number) {
    // Get recent interactions to understand preferences
    const interactions = await db
      .select({
        contentId: userInteractions.contentId,
        contentType: userInteractions.contentType,
        interactionType: userInteractions.interactionType,
        createdAt: userInteractions.createdAt,
      })
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .orderBy(desc(userInteractions.createdAt))
      .limit(100);

    return interactions;
  }

  private async getCandidateMicroblogs(userId: number, followedUsers: number[]) {
    // Get microblogs from multiple sources
    const allCandidates = await db
      .select({
        id: microblogs.id,
        content: microblogs.content,
        userId: microblogs.userId,
        createdAt: microblogs.createdAt,
        likesCount: sql`COALESCE(${microblogs.likesCount}, 0)`.as('likesCount'),
        commentsCount: sql`COALESCE(${microblogs.commentsCount}, 0)`.as('commentsCount'),
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
        },
        isLiked: sql`EXISTS(
          SELECT 1 FROM ${microblogLikes} ml 
          WHERE ml.microblog_id = ${microblogs.id} 
          AND ml.user_id = ${userId}
        )`.as('isLiked'),
      })
      .from(microblogs)
      .innerJoin(users, eq(microblogs.userId, users.id))
      .where(
        and(
          // Don't show user's own posts in recommendations
          sql`${microblogs.userId} != ${userId}`,
          // Only recent content (last 30 days)
          sql`${microblogs.createdAt} > NOW() - INTERVAL '30 days'`
        )
      )
      .orderBy(desc(microblogs.createdAt))
      .limit(200);

    return allCandidates;
  }

  private async getCandidateCommunities(userId: number) {
    // Get communities user hasn't joined yet
    const userCommunityIds = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));

    const joinedIds = userCommunityIds.map(c => c.communityId);

    const candidates = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        memberCount: communities.memberCount,
        interestTags: communities.interestTags,
        createdAt: communities.createdAt,
      })
      .from(communities)
      .where(
        joinedIds.length > 0 
          ? sql`${communities.id} NOT IN (${joinedIds.join(',')})`
          : undefined
      )
      .orderBy(desc(communities.memberCount))
      .limit(50);

    return candidates;
  }

  private async scoreMicroblogs(
    microblogs: any[],
    userProfile: any,
    followedUsers: number[],
    interactions: any[]
  ) {
    const scoredMicroblogs = microblogs.map(microblog => {
      const scores = {
        recency: this.calculateRecencyScore(microblog.createdAt),
        engagement: this.calculateEngagementScore(microblog.likesCount, microblog.commentsCount),
        similarity: this.calculateSimilarityScore(microblog.content, userProfile.preferredTags),
        socialProof: this.calculateSocialProofScore(microblog.userId, followedUsers),
        diversity: 0.5, // Base diversity score
      };

      const totalScore = Object.entries(scores).reduce((sum, [key, score]) => 
        sum + (score * this.CONTENT_WEIGHTS[key as keyof typeof this.CONTENT_WEIGHTS]), 0
      );

      return {
        ...microblog,
        score: totalScore,
        scoreBreakdown: scores,
      };
    });

    return scoredMicroblogs.sort((a, b) => b.score - a.score);
  }

  private async scoreCommunities(communities: any[], userProfile: any, interactions: any[]) {
    const scoredCommunities = communities.map(community => {
      const scores = {
        recency: 0.5, // Communities don't have recency in same way
        engagement: Math.min(community.memberCount / 100, 1), // Normalize member count
        similarity: this.calculateCommunitySimilarityScore(
          community.interestTags || [], 
          userProfile.preferredTags || []
        ),
        socialProof: 0.3, // Base social proof for communities
        diversity: 0.5,
      };

      const totalScore = Object.entries(scores).reduce((sum, [key, score]) => 
        sum + (score * this.CONTENT_WEIGHTS[key as keyof typeof this.CONTENT_WEIGHTS]), 0
      );

      return {
        ...community,
        score: totalScore,
        scoreBreakdown: scores,
      };
    });

    return scoredCommunities.sort((a, b) => b.score - a.score);
  }

  private calculateRecencyScore(createdAt: Date): number {
    const now = new Date();
    const ageInHours = (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    
    // Score decreases over time, but not too aggressively
    if (ageInHours < 1) return 1;
    if (ageInHours < 6) return 0.8;
    if (ageInHours < 24) return 0.6;
    if (ageInHours < 72) return 0.4;
    return Math.max(0.1, 1 - (ageInHours / (24 * 7))); // Decay over a week
  }

  private calculateEngagementScore(likes: number, comments: number): number {
    const totalEngagement = (likes || 0) + (comments || 0) * 2; // Comments worth more
    return Math.min(totalEngagement / 10, 1); // Normalize to 0-1
  }

  private calculateSimilarityScore(content: string, preferredTags: string[]): number {
    if (!preferredTags?.length) return 0.3; // Default score
    
    const contentLower = content.toLowerCase();
    const matchingTags = preferredTags.filter(tag => 
      contentLower.includes(tag.toLowerCase())
    );
    
    return Math.min(matchingTags.length / preferredTags.length, 1);
  }

  private calculateCommunitySimilarityScore(communityTags: string[], userTags: string[]): number {
    if (!userTags?.length || !communityTags?.length) return 0.3;
    
    const intersection = communityTags.filter(tag => 
      userTags.some(userTag => userTag.toLowerCase().includes(tag.toLowerCase()))
    );
    
    return Math.min(intersection.length / Math.max(communityTags.length, userTags.length), 1);
  }

  private calculateSocialProofScore(authorId: number, followedUsers: number[]): number {
    return followedUsers.includes(authorId) ? 1 : 0.2; // High boost for followed users
  }

  private applyDiversification(scoredContent: any[]) {
    // Simple diversification: avoid too many posts from same user
    const diversified = [];
    const authorCounts = new Map();
    
    for (const item of scoredContent) {
      const authorId = item.userId || item.id;
      const currentCount = authorCounts.get(authorId) || 0;
      
      if (currentCount < 2) { // Max 2 items per author in top results
        diversified.push(item);
        authorCounts.set(authorId, currentCount + 1);
      }
    }
    
    return diversified;
  }

  async recordInteraction(
    userId: number,
    contentId: number,
    contentType: 'microblog' | 'community' | 'event',
    interactionType: 'view' | 'like' | 'comment' | 'share'
  ) {
    // Record interaction for future recommendations
    await db.insert(userInteractions).values({
      userId,
      contentId,
      contentType,
      interactionType,
      createdAt: new Date(),
    });
  }
}