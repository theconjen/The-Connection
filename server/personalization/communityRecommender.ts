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
 * Matches age group, gender, life stage, etc.
 */
export function calculateDemographicScore(user: User, community: Community): number {
  let score = 50; // Start neutral

  // Age group matching (we don't have user age, but could infer from profile)
  // For now, "All Ages" communities get a small boost
  if (community.ageGroup === 'All Ages') {
    score += 10;
  }

  // Gender matching
  if (community.gender === 'Co-Ed' || !community.gender) {
    score += 10; // Inclusive communities
  }

  // Life stage matching (would need user life stage data)
  const lifeStages = community.lifeStages || [];
  if (lifeStages.includes('All') || lifeStages.length === 0) {
    score += 10;
  }

  // Meeting type preference
  if (community.meetingType === 'Hybrid') {
    score += 10; // Hybrid is most flexible
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
 * Calculate overall recommendation score for a community
 * Combines all factors with weighted importance
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
  };
}

export function calculateCommunityRecommendationScore(
  user: User,
  community: Community
): RecommendationScore {
  const interestScore = calculateInterestScore(user, community);
  const locationScore = calculateLocationScore(user, community);
  const demographicScore = calculateDemographicScore(user, community);
  const professionScore = calculateProfessionActivityScore(user, community);
  const denominationScore = calculateDenominationScore(user, community);
  const popularityScore = calculatePopularityScore(community);
  const recoveryScore = calculateRecoverySupportScore(user, community);

  // Weighted scoring (total = 100%)
  const totalScore =
    interestScore * 0.30 +        // 30% - Most important: shared interests
    locationScore * 0.25 +         // 25% - Location matters for in-person
    demographicScore * 0.15 +      // 15% - Age/gender/life stage fit
    denominationScore * 0.10 +     // 10% - Denomination alignment
    popularityScore * 0.10 +       // 10% - Community health
    professionScore * 0.05 +       // 5%  - Profession/activity match
    recoveryScore * 0.05;          // 5%  - Recovery support relevance

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
    },
  };
}

/**
 * Sort communities by recommendation score
 */
export function sortCommunitiesByRecommendation(
  user: User,
  communities: Community[]
): Array<Community & { recommendationScore?: number }> {
  return communities
    .map(community => {
      const { totalScore } = calculateCommunityRecommendationScore(user, community);
      return {
        ...community,
        recommendationScore: totalScore,
      };
    })
    .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
}
