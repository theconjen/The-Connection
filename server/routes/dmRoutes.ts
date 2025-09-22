import express from "express";
import { storage } from "../storage";

const router = express.Router();

// Fetch DMs between two users
router.get("/:userId", async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const currentUserId = parseInt(req.session.userId); // Logged-in user
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

  const senderId = parseInt(req.session.userId);
  const { receiverId, content } = req.body;

  if (!content) return res.status(400).send("Message content required");

  try {
    const message = await storage.createDirectMessage({
      senderId: senderId,
      receiverId: parseInt(receiverId),
      content: content
    });

    res.json(message);
  } catch (error) {
    console.error('Error sending direct message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

export default router;