/**
 * Community Recommendation Engine
 * Matches users to communities based on interests, location, demographics, and preferences
 */

import { Community, User } from '@shared/schema';

// Haversine distance calculation (in miles)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

/**
 * Calculate interest matching score (0-100)
 * Matches user interests with community tags and ministry types
 */
export function calculateInterestScore(user: User, community: Community): number {
  // Parse user interests (could be comma-separated string or array)
  const userInterests = (user.interests || '')
    .toLowerCase()
    .split(',')
    .map(i => i.trim())
    .filter(i => i.length > 0);

  // Get community interest tags and ministry types
  const communityTags = [
    ...(community.interestTags || []),
    ...(community.ministryTypes || []),
    ...(community.activities || []),
  ].map(tag => tag.toLowerCase());

  if (userInterests.length === 0 || communityTags.length === 0) {
    return 50; // Neutral score if no data
  }

  // Count matches
  let matches = 0;
  for (const interest of userInterests) {
    for (const tag of communityTags) {
      if (tag.includes(interest) || interest.includes(tag)) {
        matches++;
      }
    }
  }

  // Score based on percentage of interests matched
  const matchPercentage = (matches / userInterests.length) * 100;
  return Math.min(matchPercentage * 2, 100); // Amplify and cap at 100
}

/**
 * Calculate location proximity score (0-100)
 * Closer communities get higher scores
 */
export function calculateLocationScore(user: User, community: Community): number {
  // If community is online, give it a decent score
  if (community.meetingType === 'Online') {
    return 75; // Online communities are accessible to everyone
  }

  // If either user or community has no location data
  const userLat = parseFloat(user.latitude || '0');
  const userLon = parseFloat(user.longitude || '0');
  const commLat = parseFloat(community.latitude || '0');
  const commLon = parseFloat(community.longitude || '0');

  if (!userLat || !userLon || !commLat || !commLon) {
    // Try city/state match as fallback
    if (user.city && community.city) {
      if (user.city.toLowerCase() === community.city.toLowerCase()) {
        return 90; // Same city
      }
      if (user.state && community.state && user.state === community.state) {
        return 60; // Same state, different city
      }
    }
    return 40; // Unknown location
  }

  // Calculate distance
  const distance = haversineDistance(userLat, userLon, commLat, commLon);

  // Score based on distance (exponential decay)
  if (distance <= 5) return 100;   // Within 5 miles
  if (distance <= 10) return 90;   // Within 10 miles
  if (distance <= 25) return 75;   // Within 25 miles
  if (distance <= 50) return 50;   // Within 50 miles
  if (distance <= 100) return 30;  // Within 100 miles
  return 10; // Beyond 100 miles
}

/**
 * Calculate demographic alignment score (0-100)
 * Matches age group, gender, life stage, and cultural background
 */
export function calculateDemographicScore(user: User, community: Community): number {
  let score = 40; // Start slightly below neutral

  // Gender matching
  const communityGender = (community.gender || '').toLowerCase();
  const userGender = (user as any).gender; // "male", "female", or null
  if (!communityGender || communityGender === 'co-ed') {
    score += 5; // Inclusive communities get a small boost
  } else if (userGender) {
    // Match men's communities to male users, women's to female
    if ((communityGender.includes('men') && userGender === 'male') ||
        (communityGender.includes('women') && userGender === 'female')) {
      score += 25; // Strong gender match
    } else if ((communityGender.includes('men') && userGender === 'female') ||
               (communityGender.includes('women') && userGender === 'male')) {
      return 10; // Mismatch — low score
    }
  }

  // Life stage matching
  const communityLifeStages = community.lifeStages || [];
  const userLifeStage = (user as any).lifeStage; // e.g. "college", "young_professional", "married"
  if (userLifeStage && communityLifeStages.length > 0) {
    const lifeStageMap: Record<string, string[]> = {
      'college': ['Students', 'Young Adults'],
      'young_professional': ['Young Professionals', 'Young Adults'],
      'single': ['Singles'],
      'married': ['Married', 'Couples'],
      'parent': ['Parents', 'Families'],
      'empty_nester': ['Empty Nesters', 'Seniors'],
      'retired': ['Seniors', 'Retirees'],
    };
    const matchTerms = lifeStageMap[userLifeStage] || [];
    const hasMatch = matchTerms.some(term =>
      communityLifeStages.some(cls => cls.toLowerCase().includes(term.toLowerCase()))
    );
    if (hasMatch) score += 20;
  } else if (communityLifeStages.includes('All') || communityLifeStages.length === 0) {
    score += 5;
  }

  // Cultural background matching — boost communities that mention user's culture
  const userCulture = (user as any).culturalBackground;
  if (userCulture) {
    const communityText = `${community.name} ${(community as any).description || ''}`.toLowerCase();
    const cultureKeywords: Record<string, string[]> = {
      'African American': ['african american', 'black', 'african'],
      'African': ['african', 'nigeria', 'ghana', 'kenya', 'ethiopia'],
      'Latino/Hispanic': ['latino', 'latina', 'hispanic', 'spanish'],
      'East Asian': ['chinese', 'korean', 'japanese', 'east asian', 'asian'],
      'South Asian': ['south asian', 'indian', 'pakistani', 'sri lankan'],
      'Southeast Asian': ['filipino', 'vietnamese', 'southeast asian'],
      'Middle Eastern': ['middle eastern', 'arab', 'persian'],
      'Caribbean': ['caribbean', 'jamaican', 'haitian', 'island'],
      'Pacific Islander': ['pacific islander', 'hawaiian', 'samoan', 'polynesian'],
      'European': ['european'],
      'Mixed/Multicultural': ['multicultural', 'diverse', 'multi-ethnic'],
    };
    const keywords = cultureKeywords[userCulture] || [userCulture.toLowerCase()];
    const hasCultureMatch = keywords.some(kw => communityText.includes(kw));
    if (hasCultureMatch) score += 20;
  }

  // Age group matching
  if (community.ageGroup === 'All Ages') {
    score += 5;
  }

  // Meeting type preference
  if (community.meetingType === 'Hybrid') {
    score += 5; // Hybrid is most flexible
  }

  return Math.min(score, 100);
}

/**
 * Calculate profession/activity matching score (0-100)
 */
export function calculateProfessionActivityScore(user: User, community: Community): number {
  // This would require user profession data
  // For now, give communities with activities a slight boost
  const activities = community.activities || [];
  const professions = community.professions || [];

  if (activities.length > 0) {
    return 60 + Math.min(activities.length * 5, 20); // More activities = better
  }

  if (professions.length > 0) {
    return 60 + Math.min(professions.length * 5, 20);
  }

  return 50; // Neutral
}

/**
 * Calculate denomination alignment score (0-100)
 */
export function calculateDenominationScore(user: User, community: Community): number {
  // For denomination, we'd need to add it to community schema
  // Or match against ministry types
  const ministryTypes = community.ministryTypes || [];

  // Check if user denomination matches any ministry types or tags
  if (user.denomination && ministryTypes.length > 0) {
    const userDenom = user.denomination.toLowerCase();
    for (const ministry of ministryTypes) {
      if (ministry.toLowerCase().includes(userDenom) || 
          userDenom.includes(ministry.toLowerCase())) {
        return 90; // Strong match
      }
    }
  }

  return 50; // Neutral if no match or no data
}

/**
 * Calculate community popularity/engagement score (0-100)
 */
export function calculatePopularityScore(community: Community): number {
  const memberCount = community.memberCount || 0;

  // Score based on member count (sweet spot is 20-100 members)
  if (memberCount === 0) return 20;     // New community
  if (memberCount <= 10) return 40;     // Very small
  if (memberCount <= 20) return 60;     // Small but viable
  if (memberCount <= 50) return 80;     // Good size
  if (memberCount <= 100) return 100;   // Optimal size
  if (memberCount <= 200) return 90;    // Large
  return 70; // Very large (might be less personal)
}

/**
 * Calculate recovery support relevance (0-100)
 * Boosts communities with recovery support for users who might need it
 */
export function calculateRecoverySupportScore(user: User, community: Community): number {
  const recoverySupport = community.recoverySupport || [];
  
  if (recoverySupport.length > 0) {
    // Communities offering support get a moderate boost
    return 65;
  }

  return 50; // Neutral
}

/**
 * Calculate adaptive behavior score (0-100)
 * Uses recent user signals to boost communities matching evolving interests.
 * This is the key to the algorithm "learning" over time.
 */
export function calculateAdaptiveScore(
  community: Community,
  adaptiveInterests: Record<string, number>
): number {
  if (Object.keys(adaptiveInterests).length === 0) return 50; // Neutral if no signals

  // Get community's categories
  const communityTags = [
    ...(community.interestTags || []),
    ...(community.ministryTypes || []),
    ...(community.activities || []),
    ...(community.lifeStages || []),
    ...(community.professions || []),
    ...(community.recoverySupport || []),
  ].map(tag => tag.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));

  if (communityTags.length === 0) return 50;

  // Sum up matching signal scores
  let matchScore = 0;
  let matchCount = 0;

  for (const tag of communityTags) {
    // Direct match
    if (adaptiveInterests[tag] !== undefined) {
      matchScore += adaptiveInterests[tag];
      matchCount++;
      continue;
    }
    // Partial match (e.g. "bible_study" matches "bible")
    for (const [interestKey, interestScore] of Object.entries(adaptiveInterests)) {
      if (tag.includes(interestKey) || interestKey.includes(tag)) {
        matchScore += interestScore * 0.6; // Partial match = 60% credit
        matchCount++;
        break;
      }
    }
  }

  if (matchCount === 0) return 40; // No match — slightly below neutral

  // Normalize: positive signals boost, negative signals (from leaves) penalize
  // Clamp to 0-100 range
  const normalized = 50 + (matchScore / matchCount) * 15;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Calculate overall recommendation score for a community
 * Combines static profile factors with adaptive behavioral signals
 */
export interface RecommendationScore {
  totalScore: number;
  breakdown: {
    interests: number;
    location: number;
    demographics: number;
    profession: number;
    denomination: number;
    popularity: number;
    recovery: number;
    adaptive: number;
  };
}

export function calculateCommunityRecommendationScore(
  user: User,
  community: Community,
  adaptiveInterests?: Record<string, number>
): RecommendationScore {
  const interestScore = calculateInterestScore(user, community);
  const locationScore = calculateLocationScore(user, community);
  const demographicScore = calculateDemographicScore(user, community);
  const professionScore = calculateProfessionActivityScore(user, community);
  const denominationScore = calculateDenominationScore(user, community);
  const popularityScore = calculatePopularityScore(community);
  const recoveryScore = calculateRecoverySupportScore(user, community);
  const adaptiveScore = adaptiveInterests
    ? calculateAdaptiveScore(community, adaptiveInterests)
    : 50;

  // If we have adaptive signals, shift weight from static interests toward adaptive
  const hasAdaptiveData = adaptiveInterests && Object.keys(adaptiveInterests).length > 0;

  let totalScore: number;
  if (hasAdaptiveData) {
    // Blend: adaptive signals get 20% weight, taken from interests and profession
    totalScore =
      interestScore * 0.20 +        // 20% (was 30%) - Static interests
      adaptiveScore * 0.20 +         // 20% (NEW) - Behavioral signals
      locationScore * 0.25 +         // 25% - Location
      demographicScore * 0.15 +      // 15% - Demographics
      denominationScore * 0.10 +     // 10% - Denomination
      popularityScore * 0.05 +       // 5% (was 10%) - Community health
      professionScore * 0.03 +       // 3% (was 5%) - Profession
      recoveryScore * 0.02;          // 2% (was 5%) - Recovery
  } else {
    // No adaptive data — use original static weights
    totalScore =
      interestScore * 0.30 +
      locationScore * 0.25 +
      demographicScore * 0.15 +
      denominationScore * 0.10 +
      popularityScore * 0.10 +
      professionScore * 0.05 +
      recoveryScore * 0.05;
  }

  return {
    totalScore,
    breakdown: {
      interests: interestScore,
      location: locationScore,
      demographics: demographicScore,
      profession: professionScore,
      denomination: denominationScore,
      popularity: popularityScore,
      recovery: recoveryScore,
      adaptive: adaptiveScore,
    },
  };
}

/**
 * Sort communities by recommendation score (with optional adaptive signals)
 */
export function sortCommunitiesByRecommendation(
  user: User,
  communities: Community[],
  adaptiveInterests?: Record<string, number>
): Array<Community & { recommendationScore?: number }> {
  return communities
    .map(community => {
      const { totalScore } = calculateCommunityRecommendationScore(user, community, adaptiveInterests);
      return {
        ...community,
        recommendationScore: totalScore,
      };
    })
    .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
}
