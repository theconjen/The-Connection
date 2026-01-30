import express from "express";
import { storage } from "../storage-optimized";
import { sendPushNotification } from "../services/pushService";
import { ensureCleanText, handleModerationError } from "../utils/moderation";
import { getSessionUserId } from '../utils/session';
import { dmSendLimiter } from '../rate-limiters';
import { notifyUserWithPreferences, truncateText } from '../services/notificationHelper';
import { emitNewDM, emitToUser, emitDMReaction } from '../socketInstance';

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

async function checkDmPrivacy(senderId: number, receiverId: number): Promise<
  | { allowed: true }
  | { allowed: false; reason: string }
> {
  try {
    // Get receiver's privacy settings
    const receiver = await storage.getUser(receiverId);
    if (!receiver) {
      return { allowed: false, reason: 'User not found' };
    }

    // If dmPrivacy is 'everyone', allow
    const dmPrivacy = receiver.dmPrivacy || 'everyone';
    if (dmPrivacy === 'everyone') {
      return { allowed: true };
    }

    // If dmPrivacy is 'followers' or 'friends', check if sender follows receiver
    if (dmPrivacy === 'followers' || dmPrivacy === 'friends') {
      const isFollowing = await storage.isUserFollowing?.(senderId, receiverId);
      if (!isFollowing) {
        return { allowed: false, reason: 'You must follow this user to send them messages' };
      }
      return { allowed: true };
    }

    // If dmPrivacy is 'nobody', deny
    if (dmPrivacy === 'nobody') {
      return { allowed: false, reason: 'This user has disabled direct messages' };
    }

    // Default to allowing
    return { allowed: true };
  } catch (error) {
    console.error('Error checking DM privacy:', error);
    // On error, allow (fail open)
    return { allowed: true };
  }
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

    // Check DM privacy settings
    const privacyCheck = await checkDmPrivacy(senderId, parsedReceiverId);
    if (!privacyCheck.allowed) {
      return res.status(403).json({ message: privacyCheck.reason });
    }

    ensureCleanText(content, 'Direct message');
    const message = await storage.createDirectMessage({
      senderId: senderId,
      receiverId: parsedReceiverId,
      content: content
    });

    // CRITICAL: Emit socket event so recipient sees message in realtime
    // This was missing - HTTP route wasn't emitting socket events
    const messagePayload = {
      id: message.id,
      senderId: senderId,
      receiverId: parsedReceiverId,
      content: content,
      createdAt: message.createdAt || new Date().toISOString(),
      isRead: false,
    };

    // Emit to recipient for realtime update
    emitNewDM(parsedReceiverId, messagePayload);
    // Also emit to sender so their UI updates immediately
    emitToUser(senderId, 'dm:new', messagePayload);
    emitToUser(senderId, 'new_message', messagePayload);

    // Notify receiver using dual notification system (async, don't block response)
    // Check if receiver has muted this conversation before sending notification
    const isMuted = await storage.isConversationMuted(parsedReceiverId, senderId);

    if (!isMuted) {
      const sender = await storage.getUser(senderId);
      const senderName = sender?.displayName || sender?.username || 'Someone';

      notifyUserWithPreferences(parsedReceiverId, {
        title: `New message from ${senderName}`,
        body: truncateText(content, 80),
        data: {
          type: 'dm',
          senderId,
          messageId: message.id,
        },
        category: 'dm',
      }).catch(error => console.error('[DM] Error sending notification:', error));
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

// Toggle reaction on a message (double-tap to heart)
router.post("/messages/:messageId/reactions", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const messageId = req.params.messageId;
  const { reaction = 'heart' } = req.body;

  if (!messageId) {
    return res.status(400).json({ message: 'Invalid message id' });
  }

  try {
    // Get the message to verify the user is part of the conversation
    const message = await storage.getMessageById?.(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender or receiver can react
    if (message.senderId !== currentUserId && message.receiverId !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized to react to this message' });
    }

    // Toggle the reaction
    const result = await storage.toggleMessageReaction(messageId, currentUserId, reaction);

    // Emit socket event to both users for realtime update
    const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
    emitDMReaction(currentUserId, otherUserId, {
      messageId,
      reaction,
      userId: currentUserId,
      added: result.added,
    });

    res.json(result);
  } catch (error) {
    console.error('Error toggling message reaction:', error);
    res.status(500).json({ message: 'Error toggling reaction' });
  }
});

// Get reactions for a message
router.get("/messages/:messageId/reactions", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const messageId = req.params.messageId;

  try {
    const reactions = await storage.getMessageReactions?.(messageId) || [];
    res.json(reactions);
  } catch (error) {
    console.error('Error fetching message reactions:', error);
    res.status(500).json({ message: 'Error fetching reactions' });
  }
});

// Mute a conversation (stop receiving notifications)
router.post("/mute/:userId", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const mutedUserId = parseInt(req.params.userId);
  if (!Number.isFinite(mutedUserId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const success = await storage.muteConversation(currentUserId, mutedUserId);
    if (success) {
      res.json({ success: true, message: 'Conversation muted' });
    } else {
      res.status(500).json({ message: 'Failed to mute conversation' });
    }
  } catch (error) {
    console.error('Error muting conversation:', error);
    res.status(500).json({ message: 'Error muting conversation' });
  }
});

// Unmute a conversation
router.delete("/mute/:userId", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const mutedUserId = parseInt(req.params.userId);
  if (!Number.isFinite(mutedUserId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const success = await storage.unmuteConversation(currentUserId, mutedUserId);
    if (success) {
      res.json({ success: true, message: 'Conversation unmuted' });
    } else {
      res.status(500).json({ message: 'Failed to unmute conversation' });
    }
  } catch (error) {
    console.error('Error unmuting conversation:', error);
    res.status(500).json({ message: 'Error unmuting conversation' });
  }
});

// Check if a conversation is muted
router.get("/mute/:userId", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const otherUserId = parseInt(req.params.userId);
  if (!Number.isFinite(otherUserId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const isMuted = await storage.isConversationMuted(currentUserId, otherUserId);
    res.json({ isMuted });
  } catch (error) {
    console.error('Error checking mute status:', error);
    res.status(500).json({ message: 'Error checking mute status' });
  }
});

// Get all muted conversations
router.get("/muted", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const mutedUserIds = await storage.getMutedConversations(currentUserId);
    res.json({ mutedUserIds });
  } catch (error) {
    console.error('Error fetching muted conversations:', error);
    res.status(500).json({ message: 'Error fetching muted conversations' });
  }
});

// Delete a message (only sender can delete their own message)
router.delete("/messages/:messageId", async (req, res) => {
  const currentUserId = getSessionUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const messageId = parseInt(req.params.messageId);
  if (!Number.isFinite(messageId)) {
    return res.status(400).json({ message: 'Invalid message id' });
  }

  try {
    const deleted = await storage.deleteDirectMessage(messageId, currentUserId);
    if (deleted) {
      // Emit socket event to notify other user
      const message = await storage.getMessageById?.(messageId.toString());
      if (message) {
        const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
        emitToUser(otherUserId, 'dm:deleted', { messageId });
        emitToUser(currentUserId, 'dm:deleted', { messageId });
      }
      res.json({ success: true, message: 'Message deleted' });
    } else {
      res.status(404).json({ message: 'Message not found or not authorized to delete' });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

export default router;
