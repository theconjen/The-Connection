import { Router } from "express";
import { storage } from "../storage-optimized.js";
const router = Router();
function getSessionUserId(req) {
  const raw = req.session?.userId;
  if (raw === void 0 || raw === null) return void 0;
  if (typeof raw === "number") return raw;
  const n = parseInt(String(raw));
  return Number.isFinite(n) ? n : void 0;
}
router.get("/feed", async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    let posts = await storage.getAllPosts();
    posts = posts.slice(0, 100);
    if (userId) {
      const blockedIds = await storage.getBlockedUserIdsFor(userId);
      if (blockedIds?.length) {
        posts = posts.filter((p) => !blockedIds.includes(p.authorId));
      }
    }
    res.json(posts);
  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ message: "Error fetching feed" });
  }
});
var feed_default = router;
export {
  feed_default as default
};
