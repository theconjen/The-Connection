import express from "express";
import rateLimit from "express-rate-limit";
import { storage } from "../storage-optimized";
import { sendPushNotification } from "../services/pushService";
import { ensureCleanText, handleModerationError } from "../utils/moderation";
import { buildErrorResponse } from "../utils/errors";
import { getSessionUserId } from '../utils/session';

const router = express.Router();
const dmLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  message: 'You are sending messages too quickly.',
});

// Fetch DMs between two users
router.get("/:userId", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const otherUserId = Number(req.params.userId);
  if (!Number.isFinite(otherUserId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const chat = await storage.getDirectMessages(currentUserId, otherUserId);
    res.json(chat);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json(buildErrorResponse('Error fetching messages', error));
  }
});

// Send a new DM
router.post("/send", dmLimiter, async (req, res) => {
  const senderId = getSessionUserId(req);
  if (!senderId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { receiverId, content } = req.body;
  const parsedReceiverId = Number(receiverId);
  if (!Number.isFinite(parsedReceiverId)) {
    return res.status(400).json({ message: 'Invalid receiverId' });
  }

  if (!content) return res.status(400).json({ message: "Message content required" });

  try {
    ensureCleanText(content, 'Direct message');
    const message = await storage.createDirectMessage({
      senderId: senderId,
      receiverId: parsedReceiverId,
      content: content
    });

    // Send push notification to the receiver
    try {
      // TODO: Retrieve the receiver's push token from storage
      // const receiverUser = await storage.getUser(parseInt(receiverId));
      // const pushToken = receiverUser?.pushToken;
      
      // For now, we'll just log that we would send a notification
      // Once the push_tokens table is created, uncomment the actual implementation
      
      // if (pushToken) {
      //   const sender = await storage.getUser(senderId);
      //   const senderName = sender?.displayName || sender?.username || 'Someone';
      //   
      //   await sendPushNotification(
      //     pushToken,
      //     `New message from ${senderName}`,
      //     content,
      //     { type: 'dm', senderId, messageId: message.id }
      //   );
      //   console.log('Push notification sent to receiver');
      // }
      
      console.log('Push notification would be sent here once push_tokens table is created');
    } catch (pushError) {
      // Don't fail the request if push notification fails
      console.error('Error sending push notification:', pushError);
    }

    res.json(message);
  } catch (error) {
    if (handleModerationError(res, error)) return;
    console.error('Error sending direct message:', error);
    res.status(500).json(buildErrorResponse('Error sending message', error));
  }
});

export default router;
