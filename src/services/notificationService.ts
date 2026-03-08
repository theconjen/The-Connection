import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from '../lib/apiClient';
import { router } from 'expo-router';

/**
 * Notification Service for The Connection Mobile App
 *
 * Handles:
 * - Notification permissions
 * - Expo push token registration
 * - Notification handlers (received, tapped)
 * - Android notification channels
 * - Deep linking from notifications
 */

// Configure how notifications should be handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Android notification channels
const NOTIFICATION_CHANNELS = {
  COMMUNITY: {
    id: 'community',
    name: 'Community Posts',
    description: 'Notifications for new posts in your communities',
    importance: Notifications.AndroidImportance.HIGH,
  },
  EVENT: {
    id: 'event',
    name: 'Events',
    description: 'Event notifications and reminders',
    importance: Notifications.AndroidImportance.HIGH,
  },
  FORUM: {
    id: 'forum',
    name: 'Post Interactions',
    description: 'Comments, replies, and interactions on your posts',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
  FEED: {
    id: 'feed',
    name: 'Feed Activity',
    description: 'Likes and reposts on your content',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
  DM: {
    id: 'dm',
    name: 'Direct Messages',
    description: 'New direct messages',
    importance: Notifications.AndroidImportance.HIGH,
  },
};

/**
 * Set up Android notification channels
 * Must be called on Android devices before sending notifications
 */
async function setupAndroidChannels() {
  if (Platform.OS === 'android') {
    for (const channel of Object.values(NOTIFICATION_CHANNELS)) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: channel.importance,
        sound: 'default',
        enableVibrate: true,
      });
    }
  }
}

/**
 * Request notification permissions from the user
 * Shows system permission prompt on first call
 *
 * @returns {Promise<boolean>} True if permissions granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    // Check if we're on a physical device
    if (!Device.isDevice) {
      return false;
    }

    // Get current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted:', finalStatus);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Get Expo push token for this device
 *
 * @returns {Promise<string | null>} Expo push token or null if failed
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Must have permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get the Expo push token using projectId from app config
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.error('[Notifications] EAS projectId not found in app config');
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    const token = tokenData.data;
    return token;
  } catch (error) {
    console.error('[Notifications] Error getting push token:', error);
    return null;
  }
}

/**
 * Register push token with backend API
 * Sends token to server for push notification delivery
 *
 * @param {string} token - Expo push token
 * @returns {Promise<boolean>} True if registration successful
 */
export async function registerPushToken(token: string, retries = 3): Promise<boolean> {
  const platform = Platform.OS;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await apiClient.post('/api/push-tokens', {
        token,
        platform,
      });
      console.log('[Notifications] Push token registered successfully');
      return true;
    } catch (error: any) {
      const status = error?.response?.status;
      console.error(`[Notifications] Token registration failed (attempt ${attempt}/${retries}):`, status || error.message);

      // Don't retry on client errors (except 5xx / network)
      if (status && status >= 400 && status < 500) {
        return false;
      }

      // Wait before retrying (exponential backoff: 2s, 4s, 8s)
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }
  return false;
}

/**
 * Unregister push token from backend
 * Call this on logout to stop receiving notifications
 *
 * @param {string} token - Expo push token to remove
 */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await apiClient.delete(`/api/push-tokens/${encodeURIComponent(token)}`);
  } catch (error: any) {
    // Suppress expected errors:
    // - 401: not logged in
    // - 404: token doesn't exist
    // - Network errors: device offline (non-critical for logout)
    const status = error?.response?.status;
    const isNetworkError = error?.message === 'Network Error' || !error?.response;

    if (status !== 401 && status !== 404 && !isNetworkError) {
    } else if (isNetworkError) {
    }
  }
}

/**
 * Handle notification deep linking
 * Routes user to appropriate screen based on notification data
 *
 * @param {any} data - Notification data payload
 */
export function handleNotificationNavigation(data: any) {
  if (!data || !data.type) {
    return;
  }


  try {
    switch (data.type) {
      case 'community_post':
        if (data.postId) {
          router.push(`/posts/${data.postId}`);
        } else if (data.communityId) {
          router.push(`/communities/${data.communityId}`);
        }
        break;

      case 'event_created':
      case 'event_updated':
      case 'event_reminder':
        if (data.eventId) {
          router.push(`/events/${data.eventId}`);
        }
        break;

      case 'post_comment':
      case 'comment_reply':
        if (data.postId) {
          router.push(`/posts/${data.postId}`);
        }
        break;

      case 'post_liked':
      case 'post_reposted':
        if (data.postId) {
          router.push(`/posts/${data.postId}`);
        }
        break;

      case 'dm':
        if (data.senderId) {
          router.push(`/messages/${data.senderId}`);
        } else {
          router.push('/messages');
        }
        break;

      default:
        // Fallback to notifications center
        router.push('/notifications');
    }
  } catch (error) {
    // Fallback to notifications center on error
    router.push('/notifications');
  }
}

/**
 * Initialize notification service
 * Call this once when app starts (in _layout.tsx)
 *
 * Sets up:
 * - Android channels
 * - Notification listeners
 * - Token registration
 *
 * @param {boolean} isAuthenticated - Whether user is logged in
 * @returns {Promise<Notifications.Subscription | null>} Notification subscription (to clean up on unmount)
 */
export async function initializeNotifications(
  isAuthenticated: boolean
): Promise<{
  receivedListener: Notifications.Subscription | null;
  responseListener: Notifications.Subscription | null;
} | null> {
  try {

    // Set up Android notification channels
    await setupAndroidChannels();

    // Don't register token if user not logged in
    if (!isAuthenticated) {
      return null;
    }

    // Request permissions and get token
    const token = await getExpoPushToken();
    if (!token) {
      return null;
    }

    // Register token with backend
    await registerPushToken(token);

    // Set up notification received listener (while app is open)
    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      // Notification will be shown automatically due to setNotificationHandler
    });

    // Set up notification response listener (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    });

    return { receivedListener, responseListener };
  } catch (error) {
    console.error('[Notifications] Error initializing notifications:', error);
    return null;
  }
}

/**
 * Clean up notification listeners
 * Call this when unmounting or on logout
 *
 * @param {Notifications.Subscription | null} receivedListener
 * @param {Notifications.Subscription | null} responseListener
 */
export function cleanupNotifications(
  receivedListener: Notifications.Subscription | null,
  responseListener: Notifications.Subscription | null
) {
  try {
    if (receivedListener) {
      receivedListener.remove();
    }
    if (responseListener) {
      responseListener.remove();
    }
  } catch (error) {
    // Silently handle cleanup errors (common when running in Expo Go)
  }
}

/**
 * Get current Expo push token (if already registered)
 * Useful for debugging
 */
export async function getCurrentToken(): Promise<string | null> {
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) return null;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    return null;
  }
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    return 0;
  }
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
  }
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
  }
}
