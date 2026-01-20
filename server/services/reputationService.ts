/**
 * User Reputation Service
 * Manages user trust scores and reputation tracking
 */

import { storage } from '../storage-optimized';
import type { ModerationResult } from './aiModeration';

export interface ReputationUpdate {
  userId: number;
  change: number;
  reason: string;
  contentType?: string;
  contentId?: number;
  moderatorId?: number;
}

/**
 * Initialize reputation for a new user
 */
export async function initializeUserReputation(userId: number): Promise<void> {
  try {
    const existing = await storage.getUserReputation?.(userId);
    if (existing) return; // Already initialized

    await storage.createUserReputation?.({
      userId,
      reputationScore: 100, // Starting score
      trustLevel: 1, // Starting trust level
      totalReports: 0,
      validReports: 0,
      falseReports: 0,
      contentCreated: 0,
      contentRemoved: 0,
      helpfulFlags: 0,
      warnings: 0,
      suspensions: 0,
    } as any);

  } catch (error) {
    console.error('[Reputation] Error initializing user reputation:', error);
  }
}

/**
 * Update user reputation score
 */
export async function updateReputation(update: ReputationUpdate): Promise<void> {
  try {
    const { userId, change, reason, contentType, contentId, moderatorId } = update;

    // Ensure user has reputation record
    await initializeUserReputation(userId);

    // Get current reputation
    const current = await storage.getUserReputation?.(userId);
    if (!current) {
      console.error(`[Reputation] No reputation record found for user ${userId}`);
      return;
    }

    // Calculate new score (minimum 0, maximum 1000)
    const newScore = Math.max(0, Math.min(1000, current.reputationScore + change));

    // Calculate new trust level (1-5)
    const newTrustLevel = calculateTrustLevel(newScore, current);

    // Update reputation
    await storage.updateUserReputation?.(userId, {
      reputationScore: newScore,
      trustLevel: newTrustLevel,
    } as any);

    // Record history
    await storage.createReputationHistory?.({
      userId,
      change,
      reason,
      contentType: contentType || null,
      contentId: contentId || null,
      moderatorId: moderatorId || null,
    } as any);

     - ${reason}`);

    // Check if user should be restricted
    if (newScore < 20) {
      console.warn(`[Reputation] User ${userId} has low reputation (${newScore}), consider restrictions`);
    }
  } catch (error) {
    console.error('[Reputation] Error updating reputation:', error);
  }
}

/**
 * Calculate trust level based on reputation score and history
 */
function calculateTrustLevel(score: number, current: any): number {
  // Base trust level on score
  let trustLevel = 1;
  if (score >= 500) trustLevel = 5;
  else if (score >= 300) trustLevel = 4;
  else if (score >= 150) trustLevel = 3;
  else if (score >= 75) trustLevel = 2;

  // Penalize for violations
  if (current.suspensions > 0) {
    trustLevel = Math.max(1, trustLevel - 1);
  }
  if (current.validReports > 5) {
    trustLevel = Math.max(1, trustLevel - 1);
  }

  // Reward for helpful behavior
  if (current.helpfulFlags > 10 && current.contentRemoved === 0) {
    trustLevel = Math.min(5, trustLevel + 1);
  }

  return trustLevel;
}

/**
 * Handle content creation (increase reputation)
 */
export async function onContentCreated(userId: number, contentType: string, contentId: number): Promise<void> {
  await updateReputation({
    userId,
    change: 1,
    reason: 'content_created',
    contentType,
    contentId,
  });

  // Increment content created counter
  const current = await storage.getUserReputation?.(userId);
  if (current) {
    await storage.updateUserReputation?.(userId, {
      contentCreated: current.contentCreated + 1,
    } as any);
  }
}

/**
 * Handle content approved by AI moderation (small bonus)
 */
export async function onContentApproved(
  userId: number,
  contentType: string,
  contentId: number,
  moderationResult: ModerationResult
): Promise<void> {
  if (moderationResult.confidence > 0.9 && moderationResult.violations.length === 0) {
    await updateReputation({
      userId,
      change: 2,
      reason: 'high_quality_content',
      contentType,
      contentId,
    });
  }
}

/**
 * Handle content removed (decrease reputation)
 */
export async function onContentRemoved(
  userId: number,
  contentType: string,
  contentId: number,
  reason: string,
  moderatorId?: number
): Promise<void> {
  const penalties: Record<string, number> = {
    spam: -20,
    hate_speech: -50,
    harassment: -40,
    sexual_content: -35,
    violence: -30,
    misinformation: -15,
    profanity: -10,
    other: -10,
  };

  const change = penalties[reason] || -15;

  await updateReputation({
    userId,
    change,
    reason: `content_removed_${reason}`,
    contentType,
    contentId,
    moderatorId,
  });

  // Increment content removed counter and update last violation
  const current = await storage.getUserReputation?.(userId);
  if (current) {
    await storage.updateUserReputation?.(userId, {
      contentRemoved: current.contentRemoved + 1,
      lastViolation: new Date(),
    } as any);
  }
}

/**
 * Handle user warned by moderator
 */
export async function onUserWarned(
  userId: number,
  reason: string,
  moderatorId: number
): Promise<void> {
  await updateReputation({
    userId,
    change: -15,
    reason: `warned_${reason}`,
    moderatorId,
  });

  // Increment warnings counter
  const current = await storage.getUserReputation?.(userId);
  if (current) {
    await storage.updateUserReputation?.(userId, {
      warnings: current.warnings + 1,
      lastViolation: new Date(),
    } as any);
  }
}

/**
 * Handle user suspended
 */
export async function onUserSuspended(
  userId: number,
  reason: string,
  moderatorId?: number
): Promise<void> {
  await updateReputation({
    userId,
    change: -100,
    reason: `suspended_${reason}`,
    moderatorId,
  });

  // Increment suspensions counter
  const current = await storage.getUserReputation?.(userId);
  if (current) {
    await storage.updateUserReputation?.(userId, {
      suspensions: current.suspensions + 1,
      lastViolation: new Date(),
    } as any);
  }
}

/**
 * Handle user report filed
 */
export async function onReportFiled(
  reporterId: number,
  reportedUserId: number,
  reason: string
): Promise<void> {
  // Increment total reports for reported user
  const reported = await storage.getUserReputation?.(reportedUserId);
  if (reported) {
    await storage.updateUserReputation?.(reportedUserId, {
      totalReports: reported.totalReports + 1,
    } as any);
  }

}

/**
 * Handle report resolved (valid or false)
 */
export async function onReportResolved(
  reporterId: number,
  reportedUserId: number,
  isValid: boolean,
  moderatorId: number
): Promise<void> {
  if (isValid) {
    // Report was valid - penalize reported user, reward reporter
    const reported = await storage.getUserReputation?.(reportedUserId);
    if (reported) {
      await storage.updateUserReputation?.(reportedUserId, {
        validReports: reported.validReports + 1,
      } as any);
    }

    await updateReputation({
      userId: reportedUserId,
      change: -10,
      reason: 'valid_report_against',
      moderatorId,
    });

    // Small reward for reporter
    const reporter = await storage.getUserReputation?.(reporterId);
    if (reporter) {
      await storage.updateUserReputation?.(reporterId, {
        helpfulFlags: reporter.helpfulFlags + 1,
      } as any);
    }

    await updateReputation({
      userId: reporterId,
      change: 3,
      reason: 'helpful_report',
      moderatorId,
    });
  } else {
    // Report was false - penalize reporter slightly
    const reported = await storage.getUserReputation?.(reportedUserId);
    if (reported) {
      await storage.updateUserReputation?.(reportedUserId, {
        falseReports: reported.falseReports + 1,
      } as any);
    }

    await updateReputation({
      userId: reporterId,
      change: -2,
      reason: 'false_report_filed',
      moderatorId,
    });
  }

}

/**
 * Get reputation badge based on score
 */
export function getReputationBadge(score: number): {
  name: string;
  color: string;
  icon: string;
} {
  if (score >= 500) {
    return { name: 'Trusted Member', color: '#FFD700', icon: 'star' };
  } else if (score >= 300) {
    return { name: 'Respected Member', color: '#C0C0C0', icon: 'shield-checkmark' };
  } else if (score >= 150) {
    return { name: 'Active Member', color: '#CD7F32', icon: 'checkmark-circle' };
  } else if (score >= 75) {
    return { name: 'Member', color: '#4A90E2', icon: 'person' };
  } else if (score < 20) {
    return { name: 'New/Restricted', color: '#FF6B6B', icon: 'warning' };
  }
  return { name: 'New Member', color: '#95A5A6', icon: 'person-add' };
}

/**
 * Check if user should have posting restrictions based on reputation
 */
export function shouldRestrictUser(reputation: any): {
  restricted: boolean;
  reason?: string;
  restrictions?: string[];
} {
  if (!reputation) {
    return { restricted: false };
  }

  const restrictions: string[] = [];

  // Low reputation score
  if (reputation.reputationScore < 20) {
    restrictions.push('Low reputation score - content requires manual review');
  }

  // Too many suspensions
  if (reputation.suspensions >= 3) {
    restrictions.push('Multiple suspensions - account under review');
  }

  // Too many valid reports
  if (reputation.validReports >= 5) {
    restrictions.push('Multiple confirmed violations - restricted posting');
  }

  // Recent violation
  if (reputation.lastViolation) {
    const daysSinceViolation = (Date.now() - new Date(reputation.lastViolation).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceViolation < 7 && reputation.reputationScore < 50) {
      restrictions.push('Recent violation - temporary posting restrictions');
    }
  }

  return {
    restricted: restrictions.length > 0,
    reason: restrictions[0],
    restrictions,
  };
}
