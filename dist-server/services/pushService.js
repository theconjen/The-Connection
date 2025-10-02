import { Expo } from "expo-server-sdk";
const expo = new Expo();
async function sendPushNotifications(notifications) {
  const messages = [];
  for (const notification of notifications) {
    if (!Expo.isExpoPushToken(notification.to)) {
      console.error(`Push token ${notification.to} is not a valid Expo push token`);
      continue;
    }
    messages.push({
      to: notification.to,
      sound: "default",
      title: notification.title,
      body: notification.body,
      data: notification.data
    });
  }
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log("Push notification sent:", ticketChunk);
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }
  return tickets;
}
async function sendPushNotification(token, title, body, data) {
  return sendPushNotifications([{ to: token, title, body, data }]);
}
export {
  sendPushNotification,
  sendPushNotifications
};
