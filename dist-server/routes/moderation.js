import express from "express";
import { isAuthenticated, isAdmin } from "../auth.js";
import { storage } from "../storage-optimized.js";
const router = express.Router();
router.post("/moderation/report", isAuthenticated, async (req, res) => {
  try {
    const reporterId = req.session?.userId;
    const { contentType, contentId, reason, description } = req.body;
    if (!reporterId) return res.status(401).json({ message: "Not authenticated" });
    if (!contentType || !contentId) return res.status(400).json({ message: "Missing contentType or contentId" });
    const report = await storage.createContentReport({
      reporterId,
      contentType,
      contentId: parseInt(contentId) || contentId,
      reason: reason || "other",
      description: description || null
    });
    res.json({ ok: true, report });
  } catch (error) {
    console.error("Error creating moderation report:", error);
    res.status(500).json({ message: "Error creating report" });
  }
});
router.post("/moderation/block", isAuthenticated, async (req, res) => {
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
router.get("/moderation/blocked-users", isAuthenticated, async (req, res) => {
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
router.get("/moderation/admin/reports", isAdmin, async (req, res) => {
  try {
    const status = req.query.status;
    const limit = Math.min(1e3, parseInt(String(req.query.limit || "50")) || 50);
    const rows = await storage.getReports?.({ status, limit });
    res.json(rows || []);
  } catch (error) {
    console.error("Error listing reports:", error);
    res.status(500).json({ message: "Error listing reports" });
  }
});
router.get("/moderation/admin/reports/:id", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const row = await storage.getReportById?.(id);
    if (!row) return res.status(404).json({ message: "Report not found" });
    res.json(row);
  } catch (error) {
    console.error("Error getting report:", error);
    res.status(500).json({ message: "Error getting report" });
  }
});
router.patch("/moderation/admin/reports/:id", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, notes } = req.body;
    const moderatorId = req.session?.userId;
    if (!id) return res.status(400).json({ message: "Invalid id" });
    if (!status || !["pending", "resolved", "dismissed"].includes(status)) return res.status(400).json({ message: "Invalid status" });
    const update = {
      status,
      moderatorId: moderatorId || null,
      moderatorNotes: notes || null,
      resolvedAt: status === "pending" ? null : /* @__PURE__ */ new Date()
    };
    const updated = await storage.updateReport?.(id, update);
    res.json(updated);
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ message: "Error updating report" });
  }
});
var moderation_default = router;
export {
  moderation_default as default
};
