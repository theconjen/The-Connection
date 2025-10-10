import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

export interface PushNotificationPayload {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: any;
}

/**
 * Send push notifications to users
 * @param notifications Array of push notification payloads
 * @returns Array of push tickets from Expo
 */
export async function sendPushNotifications(
  notifications: PushNotificationPayload[]
): Promise<ExpoPushTicket[]> {
  // Filter out invalid tokens
  const messages: ExpoPushMessage[] = [];
  
  for (const notification of notifications) {
    // Check that the push token is valid
    if (!Expo.isExpoPushToken(notification.to)) {
      console.error(`Push token ${notification.to} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: notification.to,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
    });
  }

  // The Expo push notification service accepts batches of notifications
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  // Send the chunks to the Expo push notification service
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log('Push notification sent:', ticketChunk);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  return tickets;
}

/**
 * Send a push notification to a single user
 * @param token Expo push token
 * @param title Notification title
 * @param body Notification body
 * @param data Optional additional data
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: any
): Promise<ExpoPushTicket[]> {
  return sendPushNotifications([{ to: token, title, body, data }]);
}
