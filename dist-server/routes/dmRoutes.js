import express from "express";
import { storage } from "../storage-optimized.js";
const router = express.Router();
router.get("/:userId", async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const currentUserId = parseInt(String(req.session.userId));
  const otherUserId = parseInt(req.params.userId);
  try {
    const chat = await storage.getDirectMessages(currentUserId, otherUserId);
    res.json(chat);
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});
router.post("/send", async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const senderId = parseInt(String(req.session.userId));
  const { receiverId, content } = req.body;
  if (!content) return res.status(400).send("Message content required");
  try {
    const message = await storage.createDirectMessage({
      senderId,
      receiverId: parseInt(receiverId),
      content
    });
    try {
      console.log("Push notification would be sent here once push_tokens table is created");
    } catch (pushError) {
      console.error("Error sending push notification:", pushError);
    }
    res.json(message);
  } catch (error) {
    console.error("Error sending direct message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
});
var dmRoutes_default = router;
export {
  dmRoutes_default as default
};
