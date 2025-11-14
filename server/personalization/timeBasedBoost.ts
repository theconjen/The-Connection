/**
 * Time-Based Content Boosting
 * Adjusts content visibility based on time of day and day of week
 */

export interface TimeBasedBoosts {
  morning: Record<string, number>;
  afternoon: Record<string, number>;
  evening: Record<string, number>;
  night: Record<string, number>;
  weekend: Record<string, number>;
}

/**
 * Content type boosts based on time of day
 * Values > 1.0 increase visibility, < 1.0 decrease visibility
 */
export const TIME_BASED_BOOSTS: TimeBasedBoosts = {
  // Morning (5 AM - 11 AM): Devotional, spiritual start to the day
  morning: {
    'devotional': 1.8,
    'bible_study': 1.6,
    'verse': 1.9,
    'prayer_request': 1.5,
    'worship': 1.4,
    'encouragement': 1.6,
    'testimony': 1.2,
    'post': 1.0,
    'event': 0.8,
    'discussion': 0.9,
  },

  // Afternoon (11 AM - 5 PM): Community engagement, learning
  afternoon: {
    'discussion': 1.6,
    'apologetics': 1.5,
    'post': 1.4,
    'community': 1.5,
    'event': 1.7,  // Event planning for later
    'bible_study': 1.3,
    'ministry_opportunity': 1.4,
    'testimony': 1.2,
    'prayer_request': 1.1,
    'verse': 1.0,
  },

  // Evening (5 PM - 10 PM): Reflection, prayer, community
  evening: {
    'prayer_request': 1.9,  // Evening prayers are common
    'testimony': 1.7,
    'reflection': 1.6,
    'devotional': 1.5,
    'worship': 1.4,
    'community': 1.3,
    'discussion': 1.2,
    'encouragement': 1.6,
    'post': 1.1,
    'event': 1.4,  // Event check-ins
  },

  // Night (10 PM - 5 AM): Light, encouraging content
  night: {
    'verse': 1.7,
    'encouragement': 1.8,
    'blessing': 1.9,
    'worship': 1.5,
    'testimony': 1.3,
    'prayer_request': 1.4,
    'devotional': 1.2,
    // Reduce heavy content
    'apologetics': 0.7,
    'long_form_post': 0.6,
    'bible_study': 0.8,
  },

  // Weekend (Saturday & Sunday): Community events, service, worship
  weekend: {
    'event': 2.0,  // Highest boost for weekend events
    'community': 1.8,
    'worship': 1.7,
    'testimony': 1.6,
    'ministry_opportunity': 1.9,
    'group_activity': 1.8,
    'fellowship': 1.7,
    'service_project': 1.9,
    'prayer_request': 1.4,
    'devotional': 1.3,
    'discussion': 1.2,
  }
};

/**
 * Get the appropriate time period based on current hour
 */
export function getCurrentTimePeriod(): keyof TimeBasedBoosts {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Check if it's currently the weekend
 */
export function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;  // Sunday or Saturday
}

/**
 * Get the time-based boost multiplier for a content type
 */
export function getTimeBasedBoost(
  contentType: string,
  customTime?: Date
): number {
  const time = customTime || new Date();
  const hour = time.getHours();
  const day = time.getDay();

  // Weekend boost takes precedence
  if (day === 0 || day === 6) {
    const weekendBoost = TIME_BASED_BOOSTS.weekend[contentType];
    if (weekendBoost) return weekendBoost;
  }

  // Get time-of-day boost
  let timePeriod: keyof TimeBasedBoosts;
  if (hour >= 5 && hour < 11) timePeriod = 'morning';
  else if (hour >= 11 && hour < 17) timePeriod = 'afternoon';
  else if (hour >= 17 && hour < 22) timePeriod = 'evening';
  else timePeriod = 'night';

  const boost = TIME_BASED_BOOSTS[timePeriod][contentType];
  return boost || 1.0;  // Default to 1.0 (no change) if not specified
}

/**
 * Get a human-readable explanation of why content is boosted at this time
 */
export function getTimeBasedReason(contentType: string): string {
  const period = getCurrentTimePeriod();
  const weekend = isWeekend();

  if (weekend && TIME_BASED_BOOSTS.weekend[contentType] > 1.2) {
    return `Great for weekend ${contentType === 'event' ? 'activities' : 'reflection'}`;
  }

  switch (period) {
    case 'morning':
      if (contentType === 'devotional' || contentType === 'verse') {
        return 'Perfect for morning devotion';
      }
      if (contentType === 'prayer_request') {
        return 'Start your day with prayer';
      }
      break;

    case 'afternoon':
      if (contentType === 'discussion' || contentType === 'apologetics') {
        return 'Great for midday learning';
      }
      if (contentType === 'event') {
        return 'Plan ahead for upcoming events';
      }
      break;

    case 'evening':
      if (contentType === 'prayer_request') {
        return 'Join evening prayer time';
      }
      if (contentType === 'testimony') {
        return 'Evening reflection and testimony';
      }
      break;

    case 'night':
      if (contentType === 'encouragement' || contentType === 'blessing') {
        return 'End your day with encouragement';
      }
      break;
  }

  return '';
}

/**
 * Apply time-based boost to a score
 */
export function applyTimeBasedBoost(
  baseScore: number,
  contentType: string,
  customTime?: Date
): number {
  const boost = getTimeBasedBoost(contentType, customTime);
  return baseScore * boost;
}

/**
 * Sort content by time-optimized score
 */
export function sortByTimeOptimizedScore<T extends { type: string; score?: number }>(
  content: T[],
  customTime?: Date
): T[] {
  return content.map(item => ({
    ...item,
    timeOptimizedScore: applyTimeBasedBoost(item.score || 0, item.type, customTime),
    timeBoost: getTimeBasedBoost(item.type, customTime),
    timeReason: getTimeBasedReason(item.type)
  }))
  .sort((a, b) => (b.timeOptimizedScore || 0) - (a.timeOptimizedScore || 0));
}
