import { storage } from '../storage';
import { sendPushNotification } from './pushService';

/**
 * Notification Helper Service
 *
 * Implements the dual notification system for The Connection:
 * 1. ALWAYS creates in-app notification record (so user can see in notification center)
 * 2. Sends push notification to user's devices (if they have tokens and preference enabled)
 *
 * This ensures notifications are never lost even if push delivery fails.
 */

// User notification preferences cache
// Reduces database queries by caching preferences for 5 minutes
interface CachedPreferences {
  notifyDms: boolean;
  notifyCommunities: boolean;
  notifyForums: boolean;
  notifyFeed: boolean;
  cachedAt: number;
}

const preferencesCache = new Map<number, CachedPreferences>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Notification categories mapped to user preference fields
 */
const CATEGORY_TO_PREFERENCE: Record<string, keyof CachedPreferences> = {
  dm: 'notifyDms',
  community: 'notifyCommunities',
  event: 'notifyCommunities', // Events are part of communities
  forum: 'notifyForums',
  feed: 'notifyFeed',
};

/**
 * Check if user wants push notifications for this category
 * Uses cache to reduce database hits
 *
 * @param userId - User ID to check preferences for
 * @param category - Notification category (dm, community, forum, feed, event)
 * @returns True if user wants push notifications for this category
 */
export async function shouldSendNotification(
  userId: number,
  category: 'dm' | 'community' | 'forum' | 'feed' | 'event'
): Promise<boolean> {
  try {
    // Check cache first
    const cached = preferencesCache.get(userId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      return getPreferenceForCategory(cached, category);
    }

    // Fetch from database
    const user = await storage.getUser(userId);
    if (!user) {
      console.warn(`[NotificationHelper] User ${userId} not found`);
      return false;
    }

    // Build preferences object (default to true if not set)
    const prefs: CachedPreferences = {
      notifyDms: user.notifyDms ?? true,
      notifyCommunities: user.notifyCommunities ?? true,
      notifyForums: user.notifyForums ?? true,
      notifyFeed: user.notifyFeed ?? true,
      cachedAt: Date.now(),
    };

    // Cache for future calls
    preferencesCache.set(userId, prefs);

    return getPreferenceForCategory(prefs, category);
  } catch (error) {
    console.error('[NotificationHelper] Error checking preferences:', error);
    // Default to true on error (better to send than miss)
    return true;
  }
}

/**
 * Get preference value for specific category
 */
function getPreferenceForCategory(prefs: CachedPreferences, category: string): boolean {
  const prefKey = CATEGORY_TO_PREFERENCE[category];
  if (!prefKey) {
    console.warn(`[NotificationHelper] Unknown category: ${category}`);
    return true;
  }
  return prefs[prefKey];
}

/**
 * Clear preferences cache for a user
 * Call this after user updates their notification settings
 */
export function clearPreferencesCache(userId: number): void {
  preferencesCache.delete(userId);
}

/**
 * Clear all preferences cache
 * Useful for testing or manual cache invalidation
 */
export function clearAllPreferencesCache(): void {
  preferencesCache.clear();
}

/**
 * Send notification using dual system
 *
 * CRITICAL: This is the main function to use for all notifications!
 *
 * What it does:
 * 1. ALWAYS creates in-app notification record (visible in notification center)
 * 2. Checks user's notification preferences for this category
 * 3. If enabled, sends push notification to all user's devices
 *
 * @param userId - User to notify
 * @param notification - Notification data
 * @returns The created in-app notification record
 */
export async function notifyUserWithPreferences(
  userId: number,
  notification: {
    title: string;
    body: string;
    data: any;
    category: 'dm' | 'community' | 'forum' | 'feed' | 'event';
  }
) {
  try {
    // 1. ALWAYS create in-app notification
    // This ensures user can always see notifications in the notification center
    const inAppNotification = await storage.createNotification({
      userId,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      category: notification.category,
    });

    console.info(`[NotificationHelper] Created in-app notification for user ${userId}: ${notification.title}`);

    // 2. Check if user wants push notifications for this category
    const shouldPush = await shouldSendNotification(userId, notification.category);
    if (!shouldPush) {
      console.info(`[NotificationHelper] User ${userId} disabled push for category: ${notification.category}`);
      return inAppNotification;
    }

    // 3. Get user's push tokens
    const pushTokens = await storage.getUserPushTokens(userId);
    if (!pushTokens || pushTokens.length === 0) {
      console.info(`[NotificationHelper] No push tokens for user ${userId}`);
      return inAppNotification;
    }

    // 4. Send push notification to all user's devices
    console.info(`[NotificationHelper] Sending push to ${pushTokens.length} device(s) for user ${userId}`);

    for (const tokenRecord of pushTokens) {
      try {
        await sendPushNotification(
          tokenRecord.token,
          notification.title,
          notification.body,
          notification.data
        );
        console.info(`[NotificationHelper] Push sent to device: ${tokenRecord.platform}`);
      } catch (error) {
        console.error(`[NotificationHelper] Failed to send push to token ${tokenRecord.id}:`, error);
        // Don't fail the whole operation if one token fails
        // Continue sending to other devices
      }
    }

    return inAppNotification;
  } catch (error) {
    console.error('[NotificationHelper] Error in notifyUserWithPreferences:', error);
    throw error;
  }
}

/**
 * Batch notify multiple users
 * Useful for notifying all community members, event attendees, etc.
 *
 * @param userIds - Array of user IDs to notify
 * @param notification - Notification data (same for all users)
 */
export async function notifyMultipleUsers(
  userIds: number[],
  notification: {
    title: string;
    body: string;
    data: any;
    category: 'dm' | 'community' | 'forum' | 'feed' | 'event';
  }
): Promise<void> {
  console.info(`[NotificationHelper] Batch notifying ${userIds.length} users`);

  // Send notifications in parallel for better performance
  await Promise.allSettled(
    userIds.map(userId => notifyUserWithPreferences(userId, notification))
  );

  console.info(`[NotificationHelper] Batch notification complete`);
}

/**
 * Notify community members (excluding specific users)
 *
 * @param communityId - Community ID
 * @param notification - Notification data
 * @param excludeUserIds - User IDs to exclude (e.g., post author)
 */
export async function notifyCommunityMembers(
  communityId: number,
  notification: {
    title: string;
    body: string;
    data: any;
    category: 'community' | 'event';
  },
  excludeUserIds: number[] = []
): Promise<void> {
  try {
    // Get all community members
    const members = await storage.getCommunityMembers(communityId);

    // Filter out excluded users
    const userIds = members
      .map(m => m.userId)
      .filter(userId => !excludeUserIds.includes(userId));

    console.info(`[NotificationHelper] Notifying ${userIds.length} community members (excluded ${excludeUserIds.length})`);

    // Batch notify
    await notifyMultipleUsers(userIds, notification);
  } catch (error) {
    console.error('[NotificationHelper] Error in notifyCommunityMembers:', error);
    throw error;
  }
}

/**
 * Notify event attendees (users who RSVPed)
 *
 * @param eventId - Event ID
 * @param notification - Notification data
 * @param excludeUserIds - User IDs to exclude
 */
export async function notifyEventAttendees(
  eventId: number,
  notification: {
    title: string;
    body: string;
    data: any;
    category: 'event';
  },
  excludeUserIds: number[] = []
): Promise<void> {
  try {
    // Get all event RSVPs
    const rsvps = await storage.getEventRSVPs(eventId);

    // Only notify users who responded 'going' or 'interested'
    const userIds = rsvps
      .filter(rsvp => rsvp.status === 'going' || rsvp.status === 'interested')
      .map(rsvp => rsvp.userId)
      .filter(userId => !excludeUserIds.includes(userId));

    console.info(`[NotificationHelper] Notifying ${userIds.length} event attendees`);

    // Batch notify
    await notifyMultipleUsers(userIds, notification);
  } catch (error) {
    console.error('[NotificationHelper] Error in notifyEventAttendees:', error);
    throw error;
  }
}

/**
 * Helper to truncate long text for notification body
 * Keeps notifications concise and readable
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Helper to get user's display name
 * Falls back to username if displayName not set
 */
export async function getUserDisplayName(userId: number): Promise<string> {
  try {
    const user = await storage.getUser(userId);
    return user?.displayName || user?.username || 'Someone';
  } catch (error) {
    console.error('[NotificationHelper] Error getting user display name:', error);
    return 'Someone';
  }
}
