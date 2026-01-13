import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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
    console.info('[Notifications] Android channels configured');
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
      console.warn('[Notifications] Must use physical device for push notifications');
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
      console.warn('[Notifications] Permission denied by user');
      return false;
    }

    console.info('[Notifications] Permissions granted');
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

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'c11dcfad-026c-4c8d-8dca-bec9e2bc049a', // From app.json extra.eas.projectId
    });

    const token = tokenData.data;
    console.info('[Notifications] Expo push token obtained');
    return token;
  } catch (error) {
    console.error('[Notifications] Error getting Expo push token:', error);
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
export async function registerPushToken(token: string): Promise<boolean> {
  try {
    const platform = Platform.OS;

    await apiClient.post('/push-tokens', {
      token,
      platform,
    });

    console.info('[Notifications] Token registered with backend');
    return true;
  } catch (error: any) {
    // Log error but don't block app startup
    if (error?.response?.status === 404) {
      console.warn('[Notifications] Push token endpoint not available (this is normal in development)');
    } else {
      console.error('[Notifications] Error registering token:', error);
    }
    return false;
  }
}

/**
 * Unregister push token from backend
 * Call this on logout to stop receiving notifications
 *
 * @param {string} token - Expo push token to remove
 */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await apiClient.delete(`/push-tokens/${encodeURIComponent(token)}`);
    console.info('[Notifications] Token unregistered from backend');
  } catch (error: any) {
    // Suppress 401 (not logged in) and 404 (token doesn't exist) errors - both are expected
    const status = error?.response?.status;
    if (status !== 401 && status !== 404) {
      console.error('[Notifications] Error unregistering token:', error);
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
    console.warn('[Notifications] No navigation data in notification');
    return;
  }

  console.info('[Notifications] Navigating from notification:', data.type);

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
        console.warn('[Notifications] Unknown notification type:', data.type);
        // Fallback to notifications center
        router.push('/notifications');
    }
  } catch (error) {
    console.error('[Notifications] Navigation error:', error);
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
    console.info('[Notifications] Initializing notification service...');

    // Set up Android notification channels
    await setupAndroidChannels();

    // Don't register token if user not logged in
    if (!isAuthenticated) {
      console.info('[Notifications] User not authenticated, skipping token registration');
      return null;
    }

    // Request permissions and get token
    const token = await getExpoPushToken();
    if (!token) {
      console.warn('[Notifications] Could not get push token');
      return null;
    }

    // Register token with backend
    await registerPushToken(token);

    // Set up notification received listener (while app is open)
    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      console.info('[Notifications] Notification received while app open:', notification.request.content.title);
      // Notification will be shown automatically due to setNotificationHandler
    });

    // Set up notification response listener (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.info('[Notifications] Notification tapped:', response.notification.request.content.title);
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    });

    console.info('[Notifications] Service initialized successfully');
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
    console.info('[Notifications] Listeners cleaned up');
  } catch (error) {
    // Silently handle cleanup errors (common when running in Expo Go)
    console.warn('[Notifications] Error during cleanup (may be running in Expo Go):', error);
  }
}

/**
 * Get current Expo push token (if already registered)
 * Useful for debugging
 */
export async function getCurrentToken(): Promise<string | null> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'c11dcfad-026c-4c8d-8dca-bec9e2bc049a',
    });
    return tokenData.data;
  } catch (error) {
    console.error('[Notifications] Error getting current token:', error);
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
    console.error('[Notifications] Error getting badge count:', error);
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
    console.error('[Notifications] Error setting badge count:', error);
  }
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.info('[Notifications] All notifications cleared');
  } catch (error) {
    console.error('[Notifications] Error clearing notifications:', error);
  }
}
