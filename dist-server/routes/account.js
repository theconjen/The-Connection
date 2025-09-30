import { Router } from "express";
import { isAuthenticated } from "../auth.js";
import { db, sql } from "../db.js";
import { users, posts, communities, events } from "./shared/schema.js";
import { eq } from "drizzle-orm";
const router = Router();
router.delete("/me", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await db.transaction(async (tx) => {
      await tx.update(users).set({ deletedAt: sql`NOW()` }).where(eq(users.id, userId));
      await tx.update(posts).set({ deletedAt: sql`NOW()` }).where(eq(posts.authorId, userId));
      await tx.update(communities).set({ deletedAt: sql`NOW()` }).where(eq(communities.createdBy, userId));
      await tx.update(events).set({ deletedAt: sql`NOW()` }).where(eq(events.creatorId, userId));
    });
    try {
      req.session.destroy(() => {
      });
    } catch (e) {
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting account:", err);
    return res.status(500).json({ message: "Error deleting account" });
  }
});
var account_default = router;
export {
  account_default as default
};
