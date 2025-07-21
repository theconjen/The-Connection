import { Router } from "express";
import { db } from "../db";
import { messages, users } from "../../shared/schema";
import { eq, or, and, desc, ne } from "drizzle-orm";
import { insertMessageSchema } from "../../shared/schema";
import { z } from "zod";

const router = Router();

// Get conversations for the current user
router.get("/conversations", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = parseInt(req.session.userId);

    // Get all unique conversation partners
    const conversations = await db
      .select({
        partnerId: users.id,
        partnerUsername: users.username,
        partnerDisplayName: users.displayName,
        partnerAvatarUrl: users.avatarUrl,
        lastMessage: messages.content,
        lastMessageTime: messages.createdAt,
      })
      .from(messages)
      .innerJoin(users, 
        or(
          and(eq(messages.senderId, userId), eq(users.id, messages.receiverId)),
          and(eq(messages.receiverId, userId), eq(users.id, messages.senderId))
        )
      )
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt))
      .groupBy(users.id, users.username, users.displayName, users.avatarUrl, messages.content, messages.createdAt);

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get messages between current user and another user
router.get("/messages/:partnerId", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = parseInt(req.session.userId);
    const partnerId = parseInt(req.params.partnerId);

    const messageList = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        createdAt: messages.createdAt,
        senderUsername: users.username,
        senderDisplayName: users.displayName,
        senderAvatarUrl: users.avatarUrl,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, partnerId)),
          and(eq(messages.senderId, partnerId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(messages.createdAt);

    res.json(messageList);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Send a new message
router.post("/messages", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = parseInt(req.session.userId);
    
    const messageData = insertMessageSchema.parse({
      ...req.body,
      senderId: userId,
    });

    const [newMessage] = await db
      .insert(messages)
      .values(messageData)
      .returning();

    // Get the complete message with sender info
    const messageWithSender = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        createdAt: messages.createdAt,
        senderUsername: users.username,
        senderDisplayName: users.displayName,
        senderAvatarUrl: users.avatarUrl,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.id, newMessage.id))
      .limit(1);

    res.status(201).json(messageWithSender[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid message data", errors: error.errors });
    }
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Search users to start new conversations
router.get("/users/search", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { query } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const userId = parseInt(req.session.userId);
    
    const searchResults = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(
        ne(users.id, userId)
      )
      .limit(10);

    res.json(searchResults);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;