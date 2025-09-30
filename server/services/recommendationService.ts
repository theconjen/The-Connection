import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db';
import { users, microblogs, communities, userFollows, microblogLikes, communityMembers, userInteractions } from '../../shared/schema';
import { whereNotDeleted } from '../db/helpers';

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
    like: 1,             // +1 for likes
    comment: 3,          // +3 for comments (more valuable)
    share: 5,            // +5 for shares (highest engagement)
    save: 2,             // +2 for bookmarks
    view: 0.5,           // +0.5 for views
    follow: 8,           // Strong relationship signal
    join_community: 6,   // Community engagement
    prayer_request: 4,   // Faith-based interaction
    bible_study: 3,      // Educational engagement
  };

  // Faith-based scoring formula: Score(P, U) = w_e*E + w_r*R + w_t*T + w_f*F
  private readonly CONTENT_WEIGHTS = {
    engagement: 0.4,     // 40% - Engagement Score (likes, replies, shares)
    relationship: 0.3,   // 30% - Relationship Score (user interaction with author)
    topic_match: 0.2,    // 20% - Topic Match (interest overlap)
    freshness: 0.1,      // 10% - Freshness (time decay factor)
  };

  // Faith-based content categories for topic matching
  private readonly FAITH_CATEGORIES = [
    'bible_study', 'prayer_requests', 'worship', 'testimony', 'devotional',
    'apologetics', 'ministry', 'church_life', 'christian_living', 'missions',
    'youth_ministry', 'family_faith', 'spiritual_growth', 'scripture_study',
    'christian_community', 'worship_music', 'biblical_theology'
  ];

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
  const user = await db.select().from(users).where(and(eq(users.id, userId), whereNotDeleted(users))).limit(1);
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
        tag && typeof tag === 'string' && tag.length > 3 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'].includes(tag.toLowerCase())
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
          sql`${microblogs.createdAt} > NOW() - INTERVAL '30 days'`,
          // Exclude microblogs whose author has been soft-deleted
          whereNotDeleted(users)
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
        and(
          joinedIds.length > 0 
            ? sql`${communities.id} NOT IN (${joinedIds.join(',')})`
            : sql`TRUE`,
          whereNotDeleted(communities)
        )
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
      // Calculate individual score components
      const engagementScore = this.calculateEngagementScore(
        microblog.likesCount || 0, 
        microblog.commentsCount || 0,
        microblog.repostCount || 0
      );
      
      const relationshipScore = this.calculateRelationshipScore(
        microblog.userId, 
        followedUsers, 
        interactions,
        userProfile.id
      );
      
      const topicMatchScore = this.calculateTopicMatchScore(
        microblog.content,
        userProfile.preferredTags || [],
        userProfile.interestTags || []
      );
      
      const freshnessScore = this.calculateFreshnessScore(microblog.createdAt);

      // Apply faith-based scoring formula
      const totalScore = 
        (this.CONTENT_WEIGHTS.engagement * engagementScore) +
        (this.CONTENT_WEIGHTS.relationship * relationshipScore) +
        (this.CONTENT_WEIGHTS.topic_match * topicMatchScore) +
        (this.CONTENT_WEIGHTS.freshness * freshnessScore);

      // Trust & safety boost for verified content
      const trustBoost = this.calculateTrustScore(microblog);
      const finalScore = totalScore * (1 + trustBoost);

      return {
        ...microblog,
        score: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
        scoreBreakdown: {
          engagement: Math.round(engagementScore * 100) / 100,
          relationship: Math.round(relationshipScore * 100) / 100,
          topicMatch: Math.round(topicMatchScore * 100) / 100,
          freshness: Math.round(freshnessScore * 100) / 100,
          trustBoost: Math.round(trustBoost * 100) / 100,
        },
        reason: this.generateRecommendationReason(engagementScore, relationshipScore, topicMatchScore, trustBoost),
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

  private calculateEngagementScore(likes: number, comments: number, shares: number = 0): number {
    // Faith-based engagement weighting: likes(+1) + comments(+3) + shares(+5)
    const weightedEngagement = 
      (likes * this.INTERACTION_WEIGHTS.like) +
      (comments * this.INTERACTION_WEIGHTS.comment) +
      (shares * this.INTERACTION_WEIGHTS.share);
    
    // Normalize to 0-1 scale with logarithmic scaling for high engagement
    return Math.min(Math.log10(weightedEngagement + 1) / 2, 1);
  }

  private calculateRelationshipScore(
    authorId: number, 
    followedUsers: number[], 
    interactions: any[], 
    userId: number
  ): number {
    // High score for followed users
    if (followedUsers.includes(authorId)) return 1.0;
    
    // Medium score for users with previous interactions
    const userInteractions = interactions.filter(i => 
      i.contentType === 'microblog' && 
      // Check if user has interacted with this author's content before
      true // Simplified for now
    );
    
    if (userInteractions.length > 0) {
      return Math.min(userInteractions.length * 0.1, 0.7); // Cap at 0.7
    }
    
    return 0.1; // Base score for unknown users
  }

  private calculateTopicMatchScore(
    content: string, 
    userPreferredTags: string[], 
    userInterestTags: string[]
  ): number {
    const contentLower = content.toLowerCase();
    const allUserTags = [...(userPreferredTags || []), ...(userInterestTags || [])];
    
    if (!allUserTags.length) return 0.3; // Default score if no user interests
    
    // Check for faith-based keyword matches
    const faithKeywords = [
      'bible', 'scripture', 'prayer', 'worship', 'church', 'faith', 'god', 'jesus', 'christ',
      'holy', 'spirit', 'blessing', 'testimony', 'ministry', 'gospel', 'salvation', 'grace',
      'christian', 'biblical', 'devotional', 'sermon', 'praise', 'lord', 'heavenly'
    ];
    
    let matchScore = 0;
    let totalWords = 0;
    
    // Score for user interest matches
    allUserTags.forEach(tag => {
      if (contentLower.includes(tag.toLowerCase())) {
        matchScore += 0.2; // Each tag match adds 0.2
      }
      totalWords++;
    });
    
    // Bonus for faith-based content
    const faithMatches = faithKeywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length;
    
    if (faithMatches > 0) {
      matchScore += Math.min(faithMatches * 0.1, 0.3); // Faith bonus, capped at 0.3
    }
    
    return Math.min(matchScore, 1.0);
  }

  private calculateFreshnessScore(createdAt: Date): number {
    const now = new Date();
    const ageInHours = (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    
    // Aggressive boost for fresh content in faith community
    if (ageInHours < 1) return 1.0;      // Perfect score for content <1h
    if (ageInHours < 6) return 0.9;      // High score for <6h
    if (ageInHours < 24) return 0.7;     // Good score for daily content
    if (ageInHours < 72) return 0.4;     // Decent score for 3-day content
    if (ageInHours < 168) return 0.2;    // Low score for week-old content
    return 0.05; // Minimal score for older content
  }

  private calculateTrustScore(microblog: any): number {
    let trustBoost = 0;
    
    // Boost for verified users (simulated)
    if (microblog.user?.isVerifiedApologeticsAnswerer) {
      trustBoost += 0.3;
    }
    
    // Boost for high-engagement authors
    const authorEngagement = (microblog.likesCount || 0) + (microblog.commentsCount || 0) * 2;
    if (authorEngagement > 10) {
      trustBoost += 0.1;
    }
    
    // Boost for content with positive engagement ratio
    const engagementRatio = (microblog.likesCount || 0) / Math.max((microblog.commentsCount || 0), 1);
    if (engagementRatio > 2) { // More likes than comments indicates positive reception
      trustBoost += 0.1;
    }
    
    return Math.min(trustBoost, 0.5); // Cap trust boost at 50%
  }

  private generateRecommendationReason(
    engagement: number, 
    relationship: number, 
    topicMatch: number, 
    trust: number
  ): string {
    if (relationship > 0.8) return 'From someone you follow';
    if (trust > 0.2) return 'From verified faith leader';
    if (engagement > 0.7) return 'Highly engaging content';
    if (topicMatch > 0.6) return 'Matches your interests';
    if (engagement > 0.4) return 'Popular in community';
    return 'Recommended for you';
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