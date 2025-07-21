import express from "express";
import { db } from "../db";
import { messages } from "../../shared/schema";
import { eq, or, and } from "drizzle-orm";

const router = express.Router();

// Fetch DMs between two users
router.get("/:userId", async (req, res) => {
  const currentUserId = req.session.userId; // Logged-in user
  const otherUserId = req.params.userId;

  const chat = await db.select().from(messages).where(
    or(
      and(eq(messages.senderId, currentUserId), eq(messages.receiverId, otherUserId)),
      and(eq(messages.senderId, otherUserId), eq(messages.receiverId, currentUserId))
    )
  ).orderBy(messages.createdAt);

  res.json(chat);
});

// Send a new DM
router.post("/send", async (req, res) => {
  const senderId = req.session.userId;
  const { receiverId, content } = req.body;

  if (!content) return res.status(400).send("Message content required");

  const [message] = await db.insert(messages)
    .values({ senderId, receiverId, content })
    .returning();

  res.json(message);
});

export default router;