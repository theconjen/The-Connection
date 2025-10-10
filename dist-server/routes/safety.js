import express from "express";
import { isAuthenticated } from "../auth.js";
import { storage } from "../storage-optimized.js";
const router = express.Router();
router.post("/reports", isAuthenticated, async (req, res) => {
  try {
    const reporterId = req.session?.userId;
    const { subjectType, subjectId, reason, description } = req.body;
    if (!reporterId) return res.status(401).json({ message: "Not authenticated" });
    if (!subjectType || !subjectId) return res.status(400).json({ message: "Missing subjectType or subjectId" });
    const allowed = ["post", "community", "event"];
    if (!allowed.includes(String(subjectType))) return res.status(400).json({ message: "Invalid subjectType" });
    const report = await storage.createContentReport({
      reporterId,
      contentType: subjectType,
      contentId: parseInt(subjectId) || subjectId,
      reason: reason || "other",
      description: description || null
    });
    res.json({ ok: true, report });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Error creating report" });
  }
});
router.post("/blocks", isAuthenticated, async (req, res) => {
  try {
    const blockerId = req.session?.userId;
    const { userId, reason } = req.body;
    if (!blockerId) return res.status(401).json({ message: "Not authenticated" });
    const blockedUserId = parseInt(userId);
    if (!blockedUserId || blockedUserId === blockerId) return res.status(400).json({ message: "Invalid userId" });
    const block = await storage.createUserBlock({
      blockerId,
      blockedId: blockedUserId,
      reason: reason || null
    });
    res.json({ ok: true, block });
  } catch (error) {
    console.error("Error creating block:", error);
    res.status(500).json({ message: "Error creating block" });
  }
});
router.get("/blocked-users", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const blockedIds = await storage.getBlockedUserIdsFor(userId);
    const blockedUsers = await Promise.all((blockedIds || []).map(async (id) => {
      const u = await storage.getUser(id);
      if (!u) return null;
      const { password, ...rest } = u;
      return { blockedUser: rest, createdAt: null };
    }));
    res.json(blockedUsers.filter(Boolean));
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    res.status(500).json({ message: "Error fetching blocked users" });
  }
});
var safety_default = router;
export {
  safety_default as default
};
