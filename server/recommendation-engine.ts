/**
 * Content Recommendation Engine for The Connection
 * 
 * This module provides algorithms and utilities for generating personalized content
 * recommendations based on user preferences, interaction history, and content similarity.
 */
import { 
  Post, 
  Microblog, 
  ApologeticsTopic, 
  BibleReadingPlan, 
  Event,
  Community,
  PrayerRequest
} from "@shared/schema";
import { storage } from "./storage";

/**
 * Different types of content that can be recommended
 */
export type ContentType = 
  | 'post' 
  | 'microblog' 
  | 'apologetics' 
  | 'bible_study' 
  | 'event' 
  | 'community'
  | 'prayer_request';

/**
 * Structure representing a content item with its metadata
 */
export interface ContentItem {
  id: number;
  type: ContentType;
  title: string;
  description?: string;
  tags?: string[];
  topics?: string[];
  createdAt: Date | null;
  author?: {
    id: number;
    username: string;
  };
  engagementScore?: number;
  relevanceScore?: number;
}

/**
 * Constants for recommendation algorithm weights
 */
const WEIGHTS = {
  INTEREST_MATCH: 0.35,       // How closely content matches user interests
  RECENCY: 0.25,              // How recent the content is
  POPULARITY: 0.20,           // How popular/engaged the content is
  AUTHOR_AFFINITY: 0.10,      // User's history with this author's content
  CONTENT_DIVERSITY: 0.10,    // Prioritize diverse content types
};

/**
 * Get content recommendations for a specific user
 * 
 * @param userId The user ID to get recommendations for
 * @param limit Maximum number of recommendations to return (default 10)
 * @returns Array of content items sorted by recommendation score
 */
export async function getRecommendationsForUser(userId: number, limit = 10): Promise<ContentItem[]> {
  try {
    // Get user's preferences
    const userPreferences = await storage.getUserPreferences(userId);
    
    if (!userPreferences) {
      // If user has no preferences yet, return popular content
      return getPopularContent(limit);
    }
    
    // Get content pools from different sources
    const posts = await storage.getAllPosts();
    const microblogs = await storage.getAllMicroblogs();
    const apologeticsTopics = await storage.getAllApologeticsTopics();
    const bibleReadingPlans = await storage.getAllBibleReadingPlans();
    const events = await storage.getAllEvents();
    const communities = await storage.getAllCommunities();
    const prayerRequests = await storage.getPrayerRequestsVisibleToUser(userId);
    
    // Convert each content type to a standard ContentItem format
    const allContent: ContentItem[] = [
      ...posts.map(postToContentItem),
      ...microblogs.map(microblogToContentItem),
      ...apologeticsTopics.map(apologeticsToContentItem),
      ...bibleReadingPlans.map(bibleReadingPlanToContentItem),
      ...events.map(eventToContentItem),
      ...communities.map(communityToContentItem),
      ...prayerRequests.map(prayerRequestToContentItem)
    ];
    
    // Calculate scores for each content item
    const scoredContent = allContent.map(item => ({
      ...item,
      score: calculateRecommendationScore(item, userPreferences)
    }));
    
    // Sort by score (descending) and take the top 'limit' items
    return scoredContent
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

/**
 * Get popular content when user preferences aren't available
 */
async function getPopularContent(limit: number): Promise<ContentItem[]> {
  try {
    // Get recent content from various sources
    const posts = await storage.getAllPosts();
    const microblogs = await storage.getAllMicroblogs();
    const apologeticsTopics = await storage.getAllApologeticsTopics();
    const events = await storage.getAllEvents();
    
    // Convert to standard format
    const allContent: ContentItem[] = [
      ...posts.map(postToContentItem),
      ...microblogs.map(microblogToContentItem),
      ...apologeticsTopics.map(apologeticsToContentItem),
      ...events.map(eventToContentItem),
    ];
    
    // Prioritize by engagement metrics and recency
    const scoredContent = allContent.map(item => ({
      ...item,
      score: (item.engagementScore || 0) + (isRecent(item.createdAt) ? 5 : 0)
    }));
    
    // Sort by score and return top items, ensuring diversity
    return ensureContentDiversity(
      scoredContent.sort((a, b) => (b.score || 0) - (a.score || 0)),
      limit
    );
  } catch (error) {
    console.error('Error getting popular content:', error);
    return [];
  }
}

/**
 * Calculate a recommendation score for a content item based on user preferences
 */
function calculateRecommendationScore(item: ContentItem, userPreferences: any): number {
  // Interest match score
  const interestScore = calculateInterestScore(item, userPreferences.interests) * WEIGHTS.INTEREST_MATCH;
  
  // Recency score (newer content gets higher score)
  const recencyScore = calculateRecencyScore(item.createdAt) * WEIGHTS.RECENCY;
  
  // Popularity score based on engagement
  const popularityScore = (item.engagementScore || 0) * WEIGHTS.POPULARITY;
  
  // Author affinity score
  const authorAffinityScore = calculateAuthorAffinityScore(
    item.author?.id, 
    userPreferences.engagementHistory
  ) * WEIGHTS.AUTHOR_AFFINITY;
  
  // Content diversity score (to ensure variety)
  const diversityScore = calculateDiversityScore(
    item.type, 
    userPreferences.engagementHistory
  ) * WEIGHTS.CONTENT_DIVERSITY;
  
  // Calculate the final score
  return interestScore + recencyScore + popularityScore + authorAffinityScore + diversityScore;
}

/**
 * Calculate how closely content matches user interests
 */
function calculateInterestScore(item: ContentItem, userInterests: string[]): number {
  if (!userInterests || userInterests.length === 0 || !item.tags) {
    return 0.5; // Neutral score if we can't make a determination
  }
  
  // Count matches between content tags/topics and user interests
  const contentKeywords = [...(item.tags || []), ...(item.topics || [])];
  let matchCount = 0;
  
  for (const interest of userInterests) {
    if (contentKeywords.some(keyword => 
      keyword.toLowerCase().includes(interest.toLowerCase()) ||
      interest.toLowerCase().includes(keyword.toLowerCase())
    )) {
      matchCount++;
    }
  }
  
  // Calculate match percentage
  return userInterests.length > 0 ? (matchCount / userInterests.length) : 0;
}

/**
 * Calculate recency score for content
 */
function calculateRecencyScore(createdAt: Date | null): number {
  if (!createdAt) return 0;
  
  const now = new Date();
  const contentDate = new Date(createdAt);
  const ageInDays = (now.getTime() - contentDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Content less than a day old gets highest score
  if (ageInDays < 1) return 1;
  
  // Content less than a week old gets high score
  if (ageInDays < 7) return 0.8;
  
  // Content less than a month old gets medium score
  if (ageInDays < 30) return 0.5;
  
  // Content less than 3 months old gets lower score
  if (ageInDays < 90) return 0.3;
  
  // Old content gets lowest score
  return 0.1;
}

/**
 * Calculate author affinity score based on user's history with an author
 */
function calculateAuthorAffinityScore(authorId: number | undefined, engagementHistory: any[]): number {
  if (!authorId || !engagementHistory || engagementHistory.length === 0) {
    return 0.5; // Neutral score
  }
  
  // Count interactions with this author
  const authorInteractions = engagementHistory.filter(
    item => item.authorId === authorId
  ).length;
  
  // More interactions = higher score, up to a maximum
  return Math.min(authorInteractions / 5, 1);
}

/**
 * Calculate diversity score to ensure variety in recommendations
 */
/**
 * Calculate diversity score to ensure variety in recommendations
 */
function calculateDiversityScore(contentType: ContentType, engagementHistory: any[]): number {
  if (!engagementHistory || engagementHistory.length === 0) {
    return 0.5; // Neutral score
  }
  
  // Count recent interactions with this content type
  const recentHistory = engagementHistory.slice(0, 20);
  const typeInteractions = recentHistory.filter(
    item => item.contentType === contentType
  ).length;
  
  // If user has interacted with this type a lot recently, lower score to promote diversity
  return 1 - (typeInteractions / recentHistory.length);
}

/**
 * Check if content was created recently
 */
function isRecent(createdAt: Date | null): boolean {
  if (!createdAt) return false;
  
  const now = new Date();
  const contentDate = new Date(createdAt);
  const ageInDays = (now.getTime() - contentDate.getTime()) / (1000 * 60 * 60 * 24);
  
  return ageInDays < 7; // Content less than a week old is considered recent
}

/**
 * Ensure a diverse mix of content types in recommendations
 */
function ensureContentDiversity(content: ContentItem[], limit: number): ContentItem[] {
  // Group by content type
  const contentByType = content.reduce((groups, item) => {
    groups[item.type] = groups[item.type] || [];
    groups[item.type].push(item);
    return groups;
  }, {} as Record<string, ContentItem[]>);
  
  // Get all content types present
  const contentTypes = Object.keys(contentByType);
  
  // Calculate how many items to take from each type
  const itemsPerType = Math.max(1, Math.floor(limit / contentTypes.length));
  
  // Select items from each type
  let result: ContentItem[] = [];
  for (const type of contentTypes) {
    result = result.concat(contentByType[type].slice(0, itemsPerType));
  }
  
  // If we still need more items to reach the limit, add highest scored remaining items
  if (result.length < limit) {
    const remaining = content.filter(item => !result.includes(item));
    result = result.concat(remaining.slice(0, limit - result.length));
  }
  
  return result.slice(0, limit);
}

// Helper functions to convert different content types to a standard ContentItem format

function postToContentItem(post: Post): ContentItem {
  return {
    id: post.id,
    type: 'post',
    title: post.title,
    description: post.content,
    createdAt: post.createdAt,
    author: post.authorId ? { id: post.authorId, username: '' } : undefined,
    engagementScore: (post.upvotes || 0) + (post.commentCount || 0) * 2,
  };
}

function microblogToContentItem(microblog: Microblog): ContentItem {
  return {
    id: microblog.id,
    type: 'microblog',
    title: microblog.content.substring(0, 50) + (microblog.content.length > 50 ? '...' : ''),
    description: microblog.content,
    createdAt: microblog.createdAt,
    author: microblog.authorId ? { id: microblog.authorId, username: '' } : undefined,
    engagementScore: (microblog.likes || 0) + (microblog.replyCount || 0) * 2,
  };
}

function apologeticsToContentItem(topic: ApologeticsTopic): ContentItem {
  return {
    id: topic.id,
    type: 'apologetics',
    title: topic.name,
    description: topic.description,
    topics: [topic.name],
    createdAt: topic.createdAt,
    engagementScore: 5, // Base engagement score for apologetics topics
  };
}

function bibleReadingPlanToContentItem(plan: BibleReadingPlan): ContentItem {
  return {
    id: plan.id,
    type: 'bible_study',
    title: plan.title,
    description: plan.description,
    createdAt: plan.createdAt,
    author: plan.creatorId ? { id: plan.creatorId, username: '' } : undefined,
    tags: ['bible', 'study', 'reading plan'],
  };
}

function eventToContentItem(event: Event): ContentItem {
  return {
    id: event.id,
    type: 'event',
    title: event.title,
    description: event.description,
    createdAt: event.createdAt,
    tags: ['event', event.isVirtual ? 'virtual' : 'in-person'],
    engagementScore: 5, // Base engagement score for events
  };
}

function communityToContentItem(community: Community): ContentItem {
  return {
    id: community.id,
    type: 'community',
    title: community.name,
    description: community.description,
    createdAt: community.createdAt,
    tags: ['community', community.iconName],
    engagementScore: (community.memberCount || 0),
  };
}

function prayerRequestToContentItem(prayer: PrayerRequest): ContentItem {
  return {
    id: prayer.id,
    type: 'prayer_request',
    title: prayer.title,
    description: prayer.content,
    createdAt: prayer.createdAt,
    author: prayer.authorId ? { id: prayer.authorId, username: '' } : undefined,
    tags: ['prayer', prayer.privacyLevel],
    engagementScore: (prayer.prayerCount || 0),
  };
}