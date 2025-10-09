import express from "express";
import { storage } from "../storage-optimized";
import { sendPushNotification } from "../services/pushService";

const router = express.Router();

// Fetch DMs between two users
router.get("/:userId", async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const currentUserId = parseInt(String(req.session.userId)); // Logged-in user
  const otherUserId = parseInt(req.params.userId);

  try {
    const chat = await storage.getDirectMessages(currentUserId, otherUserId);
    res.json(chat);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send a new DM
router.post("/send", async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const senderId = parseInt(String(req.session.userId));
  const { receiverId, content } = req.body;

  if (!content) return res.status(400).send("Message content required");

  try {
    const message = await storage.createDirectMessage({
      senderId: senderId,
      receiverId: parseInt(receiverId),
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
    console.error('Error sending direct message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

export default router;