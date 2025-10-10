import { Router } from "express";
import { insertPostSchema, insertCommentSchema } from "./shared/schema.js";
import { isAuthenticated } from "../auth.js";
import { storage } from "../storage-optimized.js";
const router = Router();
function getSessionUserId(req) {
  const raw = req.session?.userId;
  if (raw === void 0 || raw === null) return void 0;
  if (typeof raw === "number") return raw;
  const n = parseInt(String(raw));
  return Number.isFinite(n) ? n : void 0;
}
router.get("/api/posts", async (req, res) => {
  try {
    const filter = req.query.filter;
    const userId = getSessionUserId(req);
    let posts = await storage.getAllPosts(filter);
    if (userId) {
      const blockedIds = await storage.getBlockedUserIdsFor(userId);
      if (blockedIds && blockedIds.length > 0) {
        posts = posts.filter((p) => !blockedIds.includes(p.authorId));
      }
    }
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});
router.get("/api/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await storage.getPost(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Error fetching post" });
  }
});
router.post("/api/posts", isAuthenticated, async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const { text, communityId } = req.body || {};
    if (!text || typeof text !== "string") return res.status(400).json({ message: "text required" });
    const content = text.trim();
    if (content.length === 0 || content.length > 500) return res.status(400).json({ message: "text must be 1-500 chars" });
    const payload = {
      title: content.slice(0, 60),
      content,
      imageUrl: null,
      communityId: communityId ? Number(communityId) : null,
      groupId: null,
      authorId: userId
    };
    const validatedData = insertPostSchema.parse(payload);
    const post = await storage.createPost(validatedData);
    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
  }
});
router.post("/api/posts/:id/upvote", isAuthenticated, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await storage.upvotePost(postId);
    res.json(post);
  } catch (error) {
    console.error("Error upvoting post:", error);
    res.status(500).json({ message: "Error upvoting post" });
  }
});
router.get("/api/posts/:id/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const comments = await storage.getCommentsByPostId(postId);
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
});
router.post("/api/comments", isAuthenticated, async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const validatedData = insertCommentSchema.parse({ ...req.body, authorId: userId });
    const comment = await storage.createComment(validatedData);
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Error creating comment" });
  }
});
router.post("/api/comments/:id/upvote", isAuthenticated, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const comment = await storage.upvoteComment(commentId);
    res.json(comment);
  } catch (error) {
    console.error("Error upvoting comment:", error);
    res.status(500).json({ message: "Error upvoting comment" });
  }
});
var posts_default = router;
export {
  posts_default as default
};
