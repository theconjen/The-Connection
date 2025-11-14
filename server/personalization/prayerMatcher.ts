/**
 * Prayer Request Matching Algorithm
 * Intelligently matches users with prayer requests they can relate to and care about
 */

import { PrayerRequest, User } from '@shared/schema';

export interface PrayerMatchResult {
  prayerRequest: PrayerRequest;
  matchScore: number;
  reasons: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface UserPrayerContext {
  // Experiences they've shared or prayed about
  experiencedTopics: string[];

  // Current struggles indicated by recent prayer requests
  currentStruggles: string[];

  // Areas they serve or show interest in
  ministryAreas: string[];

  // Geographic location
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };

  // Demographic info (optional)
  demographic?: {
    ageRange?: string;
    lifeStage?: string;  // 'student', 'young_adult', 'parent', 'senior', etc.
    familyStatus?: string;
  };

  // Prayer history
  prayerHistory: {
    categories: Map<string, number>;  // Category -> count of prayers
    totalPrayers: number;
    recentPrayers: Array<{ category: string; date: Date }>;
  };
}

/**
 * Prayer request categories and their related topics
 */
export const PRAYER_CATEGORIES = {
  health: ['healing', 'surgery', 'illness', 'medical', 'hospital', 'recovery', 'wellness'],
  family: ['marriage', 'children', 'parenting', 'relationships', 'divorce', 'adoption'],
  work: ['job', 'career', 'unemployment', 'workplace', 'business', 'finances'],
  spiritual: ['faith', 'salvation', 'discipleship', 'calling', 'ministry', 'spiritual_growth'],
  mental_health: ['anxiety', 'depression', 'stress', 'grief', 'loss', 'trauma'],
  addiction: ['recovery', 'substance', 'freedom', 'deliverance', 'sobriety'],
  education: ['school', 'college', 'studies', 'exams', 'wisdom', 'decisions'],
  missions: ['evangelism', 'outreach', 'missionary', 'global', 'unreached'],
  persecution: ['persecution', 'suffering', 'refugee', 'injustice', 'freedom'],
  community: ['church', 'community', 'unity', 'fellowship', 'leaders'],
} as const;

/**
 * Calculate how well a prayer request matches a user's context
 */
export function calculatePrayerMatch(
  prayerRequest: PrayerRequest,
  userContext: UserPrayerContext
): PrayerMatchResult {
  let score = 0;
  const reasons: string[] = [];
  let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';

  // 1. SHARED EXPERIENCE MATCH (40 points max)
  // Users who've experienced similar challenges can offer empathetic prayer
  const sharedExperience = findSharedExperience(
    prayerRequest,
    userContext.experiencedTopics
  );
  if (sharedExperience) {
    score += 40;
    reasons.push(`You've experienced similar challenges with ${sharedExperience}`);
    priority = 'high';
  }

  // 2. MINISTRY AREA MATCH (30 points max)
  // Users serving in related ministry areas
  const ministryMatch = matchesMinistryArea(
    prayerRequest,
    userContext.ministryAreas
  );
  if (ministryMatch) {
    score += 30;
    reasons.push(`Aligns with your ${ministryMatch} ministry`);
    if (priority === 'low') priority = 'high';
  }

  // 3. CURRENT STRUGGLE SOLIDARITY (25 points max)
  // Users currently facing similar challenges (mutual support)
  const currentStruggle = findCurrentStruggles(
    prayerRequest,
    userContext.currentStruggles
  );
  if (currentStruggle) {
    score += 25;
    reasons.push(`You're also navigating ${currentStruggle}`);
    if (priority !== 'high') priority = 'medium';
  }

  // 4. GEOGRAPHIC PROXIMITY (15 points max)
  // Nearby requests for local connection
  const locationMatch = calculateLocationMatch(
    prayerRequest,
    userContext.location
  );
  if (locationMatch > 0) {
    score += locationMatch * 15;
    if (locationMatch > 0.7) {
      reasons.push('From your local area');
    } else {
      reasons.push('From your region');
    }
  }

  // 5. LIFE STAGE MATCH (15 points max)
  // Similar life circumstances (parents, students, etc.)
  const lifeStageMatch = matchesLifeStage(
    prayerRequest,
    userContext.demographic
  );
  if (lifeStageMatch) {
    score += 15;
    reasons.push(`Relevant to ${lifeStageMatch}`);
  }

  // 6. PRAYER HISTORY AFFINITY (20 points max)
  // Categories they've shown interest in praying for
  const historyMatch = matchesPrayerHistory(
    prayerRequest,
    userContext.prayerHistory
  );
  if (historyMatch > 0) {
    score += historyMatch * 20;
    if (historyMatch > 0.5) {
      reasons.push('Category you often pray for');
    }
  }

  // 7. URGENCY BOOST
  // Critical/urgent requests get priority
  if (prayerRequest.isUrgent || prayerRequest.category === 'critical') {
    score *= 1.5;  // 50% boost
    priority = 'critical';
    reasons.unshift('⚡ URGENT prayer need');
  }

  // 8. UNANSWERED REQUESTS BOOST
  // Requests with few prayers get extra visibility
  const prayerCount = prayerRequest.prayerCount || 0;
  if (prayerCount < 5) {
    score += 10;
    reasons.push('Needs more prayer support');
  }

  // Normalize score to 0-100
  const normalizedScore = Math.min(Math.round(score), 100);

  // If no reasons, add generic one
  if (reasons.length === 0) {
    reasons.push('Join others in prayer');
  }

  return {
    prayerRequest,
    matchScore: normalizedScore,
    reasons,
    priority
  };
}

/**
 * Find shared experiences between user and prayer request
 */
function findSharedExperience(
  prayerRequest: PrayerRequest,
  experiencedTopics: string[]
): string | null {
  const requestTopics = extractTopics(prayerRequest.content + ' ' + (prayerRequest.category || ''));

  for (const experienced of experiencedTopics) {
    if (requestTopics.some(topic =>
      topic.toLowerCase().includes(experienced.toLowerCase()) ||
      experienced.toLowerCase().includes(topic.toLowerCase())
    )) {
      return experienced;
    }
  }

  return null;
}

/**
 * Check if prayer request matches user's ministry area
 */
function matchesMinistryArea(
  prayerRequest: PrayerRequest,
  ministryAreas: string[]
): string | null {
  const requestTopics = extractTopics(prayerRequest.content + ' ' + (prayerRequest.category || ''));

  // Check each ministry area
  for (const [category, keywords] of Object.entries(PRAYER_CATEGORIES)) {
    if (ministryAreas.includes(category)) {
      // Check if request contains related keywords
      if (keywords.some(keyword =>
        requestTopics.some(topic => topic.toLowerCase().includes(keyword))
      )) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Find if user is currently struggling with similar issues
 */
function findCurrentStruggles(
  prayerRequest: PrayerRequest,
  currentStruggles: string[]
): string | null {
  const requestTopics = extractTopics(prayerRequest.content);

  for (const struggle of currentStruggles) {
    if (requestTopics.some(topic =>
      topic.toLowerCase().includes(struggle.toLowerCase())
    )) {
      return struggle;
    }
  }

  return null;
}

/**
 * Calculate geographic match (0-1 score)
 */
function calculateLocationMatch(
  prayerRequest: PrayerRequest,
  userLocation?: UserPrayerContext['location']
): number {
  if (!userLocation || !prayerRequest.authorLocation) {
    return 0;
  }

  // Same city = perfect match
  if (userLocation.city && prayerRequest.authorLocation.city &&
      userLocation.city.toLowerCase() === prayerRequest.authorLocation.city.toLowerCase()) {
    return 1.0;
  }

  // Same state = high match
  if (userLocation.state && prayerRequest.authorLocation.state &&
      userLocation.state.toLowerCase() === prayerRequest.authorLocation.state.toLowerCase()) {
    return 0.7;
  }

  // Same country = medium match
  if (userLocation.country && prayerRequest.authorLocation.country &&
      userLocation.country.toLowerCase() === prayerRequest.authorLocation.country.toLowerCase()) {
    return 0.4;
  }

  return 0;
}

/**
 * Check if prayer request matches user's life stage
 */
function matchesLifeStage(
  prayerRequest: PrayerRequest,
  demographic?: UserPrayerContext['demographic']
): string | null {
  if (!demographic) return null;

  const content = prayerRequest.content.toLowerCase();

  // Life stage keywords
  const lifeStageKeywords: Record<string, string[]> = {
    'parenting': ['children', 'kids', 'parenting', 'baby', 'toddler', 'teenager'],
    'student life': ['school', 'college', 'university', 'studies', 'exams', 'classes'],
    'young adult': ['career', 'dating', 'young adult', 'twenties', 'thirties'],
    'senior life': ['retirement', 'senior', 'elderly', 'aging', 'grandchildren'],
    'marriage': ['marriage', 'spouse', 'husband', 'wife', 'married']
  };

  for (const [stage, keywords] of Object.entries(lifeStageKeywords)) {
    if (demographic.lifeStage?.includes(stage) &&
        keywords.some(keyword => content.includes(keyword))) {
      return stage;
    }
  }

  return null;
}

/**
 * Match against user's prayer history (0-1 score)
 */
function matchesPrayerHistory(
  prayerRequest: PrayerRequest,
  prayerHistory: UserPrayerContext['prayerHistory']
): number {
  if (prayerHistory.totalPrayers === 0) {
    return 0;
  }

  const requestCategory = categorizeRequest(prayerRequest);
  const categoryCount = prayerHistory.categories.get(requestCategory) || 0;

  // Calculate percentage of prayers in this category
  const categoryPercentage = categoryCount / prayerHistory.totalPrayers;

  // Also boost if this category was prayed for recently
  const recentBoost = prayerHistory.recentPrayers
    .slice(0, 10)  // Last 10 prayers
    .filter(p => p.category === requestCategory).length / 10;

  return Math.min((categoryPercentage * 0.7) + (recentBoost * 0.3), 1);
}

/**
 * Categorize a prayer request
 */
function categorizeRequest(prayerRequest: PrayerRequest): string {
  const content = prayerRequest.content.toLowerCase();

  // Check explicit category first
  if (prayerRequest.category) {
    return prayerRequest.category;
  }

  // Try to auto-categorize based on keywords
  for (const [category, keywords] of Object.entries(PRAYER_CATEGORIES)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      return category;
    }
  }

  return 'general';
}

/**
 * Extract topics from text
 */
function extractTopics(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const topics: string[] = [];

  // Extract all prayer category keywords
  for (const keywords of Object.values(PRAYER_CATEGORIES)) {
    for (const keyword of keywords) {
      if (words.some(word => word.includes(keyword) || keyword.includes(word))) {
        topics.push(keyword);
      }
    }
  }

  return [...new Set(topics)];  // Remove duplicates
}

/**
 * Recommend prayer requests for a user
 */
export async function recommendPrayersForUser(
  userId: number,
  userContext: UserPrayerContext,
  allPrayerRequests: PrayerRequest[],
  limit = 10
): Promise<PrayerMatchResult[]> {
  // Get prayers user hasn't prayed for yet
  const unprayed = allPrayerRequests.filter(pr =>
    // Filter logic would go here - checking if user already prayed
    true  // Simplified for now
  );

  // Calculate match scores for each prayer
  const matches = unprayed.map(pr =>
    calculatePrayerMatch(pr, userContext)
  );

  // Sort by priority first, then score
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = matches.sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by match score
    return b.matchScore - a.matchScore;
  });

  return sorted.slice(0, limit);
}

/**
 * Build user prayer context from their history and profile
 */
export async function buildUserPrayerContext(
  user: User,
  prayerHistory: any[]
): Promise<UserPrayerContext> {
  // Extract experienced topics from user's own prayer requests
  const userRequests = prayerHistory.filter(p => p.authorId === user.id);
  const experiencedTopics = userRequests.flatMap(pr =>
    extractTopics(pr.content)
  );

  // Recent prayer requests indicate current struggles
  const recentRequests = userRequests
    .filter(pr => {
      const daysAgo = (Date.now() - new Date(pr.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo < 30;  // Last 30 days
    });
  const currentStruggles = recentRequests.flatMap(pr =>
    extractTopics(pr.content)
  );

  // Build prayer history stats
  const categories = new Map<string, number>();
  const recentPrayers: Array<{ category: string; date: Date }> = [];

  prayerHistory.forEach(p => {
    const category = categorizeRequest(p);
    categories.set(category, (categories.get(category) || 0) + 1);

    // Track recent prayers
    const daysAgo = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 30) {
      recentPrayers.push({ category, date: new Date(p.createdAt) });
    }
  });

  return {
    experiencedTopics: [...new Set(experiencedTopics)],
    currentStruggles: [...new Set(currentStruggles)],
    ministryAreas: [],  // Would come from user profile
    location: {
      city: user.city,
      state: user.state,
    },
    prayerHistory: {
      categories,
      totalPrayers: prayerHistory.length,
      recentPrayers,
    }
  };
}
