import express from "express";
import { storage } from "../storage-optimized";
import { sendPushNotification } from "../services/pushService";
import { ensureCleanText, handleModerationError } from "../utils/moderation";
import { getSessionUserId } from '../utils/session';
import { dmSendLimiter } from '../rate-limiters';

const router = express.Router();

async function checkBlockingRelationship(currentUserId: number, otherUserId: number): Promise<
  | { status: 'ok' }
  | { status: 'selfBlocked' }
  | { status: 'blockedByOther' }
> {
  const [currentUserBlocks, otherUserBlocks] = await Promise.all([
    storage.getBlockedUserIdsFor(currentUserId),
    storage.getBlockedUserIdsFor(otherUserId),
  ]);

  if (currentUserBlocks?.includes(otherUserId)) {
    return { status: 'selfBlocked' };
  }

  if (otherUserBlocks?.includes(currentUserId)) {
    return { status: 'blockedByOther' };
  }

  return { status: 'ok' };
}

// Get all conversations for current user
router.get("/conversations", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const conversations = await storage.getUserConversations(currentUserId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

// Get unread message count
router.get("/unread-count", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const count = await storage.getUnreadMessageCount(currentUserId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
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
    const blockStatus = await checkBlockingRelationship(currentUserId, otherUserId);
    if (blockStatus.status === 'selfBlocked') {
      return res.status(403).json({ message: 'You have blocked this user' });
    }
    if (blockStatus.status === 'blockedByOther') {
      return res.status(403).json({ message: 'You cannot message this user' });
    }

    const chat = await storage.getDirectMessages(currentUserId, otherUserId);
    res.json(chat);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send a new DM
router.post("/send", dmSendLimiter, async (req, res) => {
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
    const blockStatus = await checkBlockingRelationship(senderId, parsedReceiverId);
    if (blockStatus.status === 'selfBlocked') {
      return res.status(403).json({ message: 'You have blocked this user' });
    }
    if (blockStatus.status === 'blockedByOther') {
      return res.status(403).json({ message: 'You cannot message this user' });
    }

    ensureCleanText(content, 'Direct message');
    const message = await storage.createDirectMessage({
      senderId: senderId,
      receiverId: parsedReceiverId,
      content: content
    });

    // Send push notification to the receiver
    try {
      // Get push tokens for the receiver
      const pushTokens = await storage.getUserPushTokens(parsedReceiverId);

      if (pushTokens && pushTokens.length > 0) {
        const sender = await storage.getUser(senderId);
        const senderName = sender?.displayName || sender?.username || 'Someone';

        // Send to all registered devices
        for (const tokenData of pushTokens) {
          try {
            await sendPushNotification(
              tokenData.token,
              `New message from ${senderName}`,
              content,
              { type: 'dm', senderId, messageId: message.id }
            );
          } catch (tokenError) {
            console.error('Error sending to specific token:', tokenError);
          }
        }
        console.log(`Push notifications sent to ${pushTokens.length} device(s)`);
      }
    } catch (pushError) {
      // Don't fail the request if push notification fails
      console.error('Error sending push notification:', pushError);
    }

    res.json(message);
  } catch (error) {
    if (handleModerationError(res, error)) return;
    console.error('Error sending direct message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Mark a message as read
router.post("/mark-read/:messageId", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const messageId = req.params.messageId;
  if (!messageId) {
    return res.status(400).json({ message: 'Invalid message id' });
  }

  try {
    const success = await storage.markMessageAsRead(messageId, currentUserId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ message: 'Message not found or not authorized' });
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Error marking message as read' });
  }
});

// Mark all messages in a conversation as read
router.post("/mark-conversation-read/:userId", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const otherUserId = Number(req.params.userId);
  if (!Number.isFinite(otherUserId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const blockStatus = await checkBlockingRelationship(currentUserId, otherUserId);
    if (blockStatus.status === 'selfBlocked') {
      return res.status(403).json({ message: 'You have blocked this user' });
    }
    if (blockStatus.status === 'blockedByOther') {
      return res.status(403).json({ message: 'You cannot modify messages in this conversation' });
    }

    const count = await storage.markConversationAsRead(currentUserId, otherUserId);
    res.json({ success: true, markedCount: count });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ message: 'Error marking conversation as read' });
  }
});

export default router;
