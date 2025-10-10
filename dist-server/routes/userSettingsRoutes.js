import express from "express";
import { storage } from "../storage.js";
const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};
const router = express.Router();
router.use(isAuthenticated);
router.get("/settings", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    const user = await storage.getUser(resolvedUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ message: "Error fetching user settings" });
  }
});
router.put("/settings", async (req, res) => {
  try {
    const userId = req.session.userId;
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
    const resolvedUserId2 = typeof userId === "number" ? userId : parseInt(String(userId));
    await storage.updateUser(resolvedUserId2, updateData);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ message: "Error updating user settings" });
  }
});
var userSettingsRoutes_default = router;
export {
  userSettingsRoutes_default as default
};
