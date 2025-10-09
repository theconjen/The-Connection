import { Router } from "express";
import { isAuthenticated } from "../../auth.js";
import { storage } from "../../storage-optimized.js";
const router = Router();
router.use(isAuthenticated);
router.get("/profile", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(resolvedUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});
router.patch("/profile", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { displayName, bio, avatarUrl, email, city, state, zipCode } = req.body;
    const updateData = {};
    if (displayName !== void 0) updateData.displayName = displayName;
    if (bio !== void 0) updateData.bio = bio;
    if (avatarUrl !== void 0) updateData.avatarUrl = avatarUrl;
    if (email !== void 0) updateData.email = email;
    if (city !== void 0) updateData.city = city;
    if (state !== void 0) updateData.state = state;
    if (zipCode !== void 0) updateData.zipCode = zipCode;
    const updatedUser = await storage.updateUser(resolvedUserId, updateData);
    const { password, ...userData } = updatedUser;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});
router.patch("/:id", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    const targetUserId = parseInt(req.params.id);
    if (!userId || resolvedUserId !== targetUserId) {
      return res.status(401).json({ message: "Not authorized to update this profile" });
    }
    const { displayName, bio, avatarUrl, email, city, state, zipCode } = req.body;
    const updateData = {};
    if (displayName !== void 0) updateData.displayName = displayName;
    if (bio !== void 0) updateData.bio = bio;
    if (avatarUrl !== void 0) updateData.avatarUrl = avatarUrl;
    if (email !== void 0) updateData.email = email;
    if (city !== void 0) updateData.city = city;
    if (state !== void 0) updateData.state = state;
    if (zipCode !== void 0) updateData.zipCode = zipCode;
    const updatedUser = await storage.updateUser(targetUserId, updateData);
    const { password, ...userData } = updatedUser;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});
router.get("/communities", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const communities = await storage.getAllCommunities();
    res.json(communities);
  } catch (error) {
    next(error);
  }
});
router.get("/prayer-requests", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const prayerRequests = await storage.getUserPrayerRequests(resolvedUserId);
    res.json(prayerRequests);
  } catch (error) {
    next(error);
  }
});
router.get("/posts", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const posts = await storage.getAllPosts();
    res.json(posts);
  } catch (error) {
    next(error);
  }
});
router.get("/events", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const events = await storage.getAllEvents();
    res.json(events);
  } catch (error) {
    next(error);
  }
});
router.get("/settings", async (req, res) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(resolvedUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user settings" });
  }
});
router.put("/settings", async (req, res) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { displayName, email, bio, city, state, zipCode } = req.body;
    const updateData = {};
    if (displayName !== void 0) updateData.displayName = displayName;
    if (email !== void 0) updateData.email = email;
    if (bio !== void 0) updateData.bio = bio;
    if (city !== void 0) updateData.city = city;
    if (state !== void 0) updateData.state = state;
    if (zipCode !== void 0) updateData.zipCode = zipCode;
    await storage.updateUser(resolvedUserId, updateData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error updating user settings" });
  }
});
var user_default = router;
export {
  user_default as default
};
