import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db.js";
import { users, microblogs, communities, userFollows, microblogLikes, communityMembers, userInteractions } from "../../shared/schema.js";
class RecommendationService {
  INTERACTION_WEIGHTS = {
    like: 1,
    // +1 for likes
    comment: 3,
    // +3 for comments (more valuable)
    share: 5,
    // +5 for shares (highest engagement)
    save: 2,
    // +2 for bookmarks
    view: 0.5,
    // +0.5 for views
    follow: 8,
    // Strong relationship signal
    join_community: 6,
    // Community engagement
    prayer_request: 4,
    // Faith-based interaction
    bible_study: 3
    // Educational engagement
  };
  // Faith-based scoring formula: Score(P, U) = w_e*E + w_r*R + w_t*T + w_f*F
  CONTENT_WEIGHTS = {
    engagement: 0.4,
    // 40% - Engagement Score (likes, replies, shares)
    relationship: 0.3,
    // 30% - Relationship Score (user interaction with author)
    topic_match: 0.2,
    // 20% - Topic Match (interest overlap)
    freshness: 0.1
    // 10% - Freshness (time decay factor)
  };
  // Faith-based content categories for topic matching
  FAITH_CATEGORIES = [
    "bible_study",
    "prayer_requests",
    "worship",
    "testimony",
    "devotional",
    "apologetics",
    "ministry",
    "church_life",
    "christian_living",
    "missions",
    "youth_ministry",
    "family_faith",
    "spiritual_growth",
    "scripture_study",
    "christian_community",
    "worship_music",
    "biblical_theology"
  ];
  async generatePersonalizedFeed(userId, limit = 20) {
    const userProfile = await this.getUserProfile(userId);
    const followedUsers = await this.getFollowedUsers(userId);
    const userInteractionHistory = await this.getUserInteractions(userId);
    const candidateMicroblogs = await this.getCandidateMicroblogs(userId, followedUsers);
    const candidateCommunities = await this.getCandidateCommunities(userId);
    const scoredMicroblogs = await this.scoreMicroblogs(
      candidateMicroblogs,
      userProfile,
      followedUsers,
      userInteractionHistory
    );
    const scoredCommunities = await this.scoreCommunities(
      candidateCommunities,
      userProfile,
      userInteractionHistory
    );
    const diversifiedMicroblogs = this.applyDiversification(scoredMicroblogs);
    const diversifiedCommunities = this.applyDiversification(scoredCommunities);
    return {
      microblogs: diversifiedMicroblogs.slice(0, limit),
      communities: diversifiedCommunities.slice(0, Math.floor(limit / 3))
    };
  }
  async getUserProfile(userId) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return null;
    const interactionTags = await db.select({
      tag: sql`unnest(string_to_array(${microblogs.content}, ' '))`.as("tag"),
      count: sql`count(*)`.as("count")
    }).from(microblogLikes).innerJoin(microblogs, eq(microblogLikes.microblogId, microblogs.id)).where(eq(microblogLikes.userId, userId)).groupBy(sql`unnest(string_to_array(${microblogs.content}, ' '))`).orderBy(desc(sql`count(*)`)).limit(20);
    return {
      ...user[0],
      preferredTags: interactionTags.map((t) => t.tag).filter(
        (tag) => tag && typeof tag === "string" && tag.length > 3 && !["the", "and", "for", "are", "but", "not", "you", "all"].includes(tag.toLowerCase())
      )
    };
  }
  async getFollowedUsers(userId) {
    const follows = await db.select({ followingId: userFollows.followingId }).from(userFollows).where(eq(userFollows.followerId, userId));
    return follows.map((f) => f.followingId);
  }
  async getUserInteractions(userId) {
    const interactions = await db.select({
      contentId: userInteractions.contentId,
      contentType: userInteractions.contentType,
      interactionType: userInteractions.interactionType,
      createdAt: userInteractions.createdAt
    }).from(userInteractions).where(eq(userInteractions.userId, userId)).orderBy(desc(userInteractions.createdAt)).limit(100);
    return interactions;
  }
  async getCandidateMicroblogs(userId, followedUsers) {
    const allCandidates = await db.select({
      id: microblogs.id,
      content: microblogs.content,
      userId: microblogs.userId,
      createdAt: microblogs.createdAt,
      likesCount: sql`COALESCE(${microblogs.likesCount}, 0)`.as("likesCount"),
      commentsCount: sql`COALESCE(${microblogs.commentsCount}, 0)`.as("commentsCount"),
      user: {
        id: users.id,
        username: users.username,
        displayName: users.displayName
      },
      isLiked: sql`EXISTS(
          SELECT 1 FROM ${microblogLikes} ml 
          WHERE ml.microblog_id = ${microblogs.id} 
          AND ml.user_id = ${userId}
        )`.as("isLiked")
    }).from(microblogs).innerJoin(users, eq(microblogs.userId, users.id)).where(
      and(
        // Don't show user's own posts in recommendations
        sql`${microblogs.userId} != ${userId}`,
        // Only recent content (last 30 days)
        sql`${microblogs.createdAt} > NOW() - INTERVAL '30 days'`
      )
    ).orderBy(desc(microblogs.createdAt)).limit(200);
    return allCandidates;
  }
  async getCandidateCommunities(userId) {
    const userCommunityIds = await db.select({ communityId: communityMembers.communityId }).from(communityMembers).where(eq(communityMembers.userId, userId));
    const joinedIds = userCommunityIds.map((c) => c.communityId);
    const candidates = await db.select({
      id: communities.id,
      name: communities.name,
      description: communities.description,
      memberCount: communities.memberCount,
      interestTags: communities.interestTags,
      createdAt: communities.createdAt
    }).from(communities).where(
      joinedIds.length > 0 ? sql`${communities.id} NOT IN (${joinedIds.join(",")})` : void 0
    ).orderBy(desc(communities.memberCount)).limit(50);
    return candidates;
  }
  async scoreMicroblogs(microblogs2, userProfile, followedUsers, interactions) {
    const scoredMicroblogs = microblogs2.map((microblog) => {
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
      const totalScore = this.CONTENT_WEIGHTS.engagement * engagementScore + this.CONTENT_WEIGHTS.relationship * relationshipScore + this.CONTENT_WEIGHTS.topic_match * topicMatchScore + this.CONTENT_WEIGHTS.freshness * freshnessScore;
      const trustBoost = this.calculateTrustScore(microblog);
      const finalScore = totalScore * (1 + trustBoost);
      return {
        ...microblog,
        score: Math.round(finalScore * 100) / 100,
        // Round to 2 decimal places
        scoreBreakdown: {
          engagement: Math.round(engagementScore * 100) / 100,
          relationship: Math.round(relationshipScore * 100) / 100,
          topicMatch: Math.round(topicMatchScore * 100) / 100,
          freshness: Math.round(freshnessScore * 100) / 100,
          trustBoost: Math.round(trustBoost * 100) / 100
        },
        reason: this.generateRecommendationReason(engagementScore, relationshipScore, topicMatchScore, trustBoost)
      };
    });
    return scoredMicroblogs.sort((a, b) => b.score - a.score);
  }
  async scoreCommunities(communities2, userProfile, interactions) {
    const scoredCommunities = communities2.map((community) => {
      const scores = {
        recency: 0.5,
        // Communities don't have recency in same way
        engagement: Math.min(community.memberCount / 100, 1),
        // Normalize member count
        similarity: this.calculateCommunitySimilarityScore(
          community.interestTags || [],
          userProfile.preferredTags || []
        ),
        socialProof: 0.3,
        // Base social proof for communities
        diversity: 0.5
      };
      const totalScore = Object.entries(scores).reduce(
        (sum, [key, score]) => sum + score * this.CONTENT_WEIGHTS[key],
        0
      );
      return {
        ...community,
        score: totalScore,
        scoreBreakdown: scores
      };
    });
    return scoredCommunities.sort((a, b) => b.score - a.score);
  }
  calculateEngagementScore(likes, comments, shares = 0) {
    const weightedEngagement = likes * this.INTERACTION_WEIGHTS.like + comments * this.INTERACTION_WEIGHTS.comment + shares * this.INTERACTION_WEIGHTS.share;
    return Math.min(Math.log10(weightedEngagement + 1) / 2, 1);
  }
  calculateRelationshipScore(authorId, followedUsers, interactions, userId) {
    if (followedUsers.includes(authorId)) return 1;
    const userInteractions2 = interactions.filter(
      (i) => i.contentType === "microblog" && // Check if user has interacted with this author's content before
      true
      // Simplified for now
    );
    if (userInteractions2.length > 0) {
      return Math.min(userInteractions2.length * 0.1, 0.7);
    }
    return 0.1;
  }
  calculateTopicMatchScore(content, userPreferredTags, userInterestTags) {
    const contentLower = content.toLowerCase();
    const allUserTags = [...userPreferredTags || [], ...userInterestTags || []];
    if (!allUserTags.length) return 0.3;
    const faithKeywords = [
      "bible",
      "scripture",
      "prayer",
      "worship",
      "church",
      "faith",
      "god",
      "jesus",
      "christ",
      "holy",
      "spirit",
      "blessing",
      "testimony",
      "ministry",
      "gospel",
      "salvation",
      "grace",
      "christian",
      "biblical",
      "devotional",
      "sermon",
      "praise",
      "lord",
      "heavenly"
    ];
    let matchScore = 0;
    let totalWords = 0;
    allUserTags.forEach((tag) => {
      if (contentLower.includes(tag.toLowerCase())) {
        matchScore += 0.2;
      }
      totalWords++;
    });
    const faithMatches = faithKeywords.filter(
      (keyword) => contentLower.includes(keyword)
    ).length;
    if (faithMatches > 0) {
      matchScore += Math.min(faithMatches * 0.1, 0.3);
    }
    return Math.min(matchScore, 1);
  }
  calculateFreshnessScore(createdAt) {
    const now = /* @__PURE__ */ new Date();
    const ageInHours = (now.getTime() - new Date(createdAt).getTime()) / (1e3 * 60 * 60);
    if (ageInHours < 1) return 1;
    if (ageInHours < 6) return 0.9;
    if (ageInHours < 24) return 0.7;
    if (ageInHours < 72) return 0.4;
    if (ageInHours < 168) return 0.2;
    return 0.05;
  }
  calculateTrustScore(microblog) {
    let trustBoost = 0;
    if (microblog.user?.isVerifiedApologeticsAnswerer) {
      trustBoost += 0.3;
    }
    const authorEngagement = (microblog.likesCount || 0) + (microblog.commentsCount || 0) * 2;
    if (authorEngagement > 10) {
      trustBoost += 0.1;
    }
    const engagementRatio = (microblog.likesCount || 0) / Math.max(microblog.commentsCount || 0, 1);
    if (engagementRatio > 2) {
      trustBoost += 0.1;
    }
    return Math.min(trustBoost, 0.5);
  }
  generateRecommendationReason(engagement, relationship, topicMatch, trust) {
    if (relationship > 0.8) return "From someone you follow";
    if (trust > 0.2) return "From verified faith leader";
    if (engagement > 0.7) return "Highly engaging content";
    if (topicMatch > 0.6) return "Matches your interests";
    if (engagement > 0.4) return "Popular in community";
    return "Recommended for you";
  }
  calculateSimilarityScore(content, preferredTags) {
    if (!preferredTags?.length) return 0.3;
    const contentLower = content.toLowerCase();
    const matchingTags = preferredTags.filter(
      (tag) => contentLower.includes(tag.toLowerCase())
    );
    return Math.min(matchingTags.length / preferredTags.length, 1);
  }
  calculateCommunitySimilarityScore(communityTags, userTags) {
    if (!userTags?.length || !communityTags?.length) return 0.3;
    const intersection = communityTags.filter(
      (tag) => userTags.some((userTag) => userTag.toLowerCase().includes(tag.toLowerCase()))
    );
    return Math.min(intersection.length / Math.max(communityTags.length, userTags.length), 1);
  }
  calculateSocialProofScore(authorId, followedUsers) {
    return followedUsers.includes(authorId) ? 1 : 0.2;
  }
  applyDiversification(scoredContent) {
    const diversified = [];
    const authorCounts = /* @__PURE__ */ new Map();
    for (const item of scoredContent) {
      const authorId = item.userId || item.id;
      const currentCount = authorCounts.get(authorId) || 0;
      if (currentCount < 2) {
        diversified.push(item);
        authorCounts.set(authorId, currentCount + 1);
      }
    }
    return diversified;
  }
  async recordInteraction(userId, contentId, contentType, interactionType) {
    await db.insert(userInteractions).values({
      userId,
      contentId,
      contentType,
      interactionType,
      createdAt: /* @__PURE__ */ new Date()
    });
  }
}
export {
  RecommendationService
};
