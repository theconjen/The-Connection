import express from "express";
import { storage } from "../storage";
import { buildErrorResponse } from "../utils/errors";
import { getSessionUserId } from "../utils/session";
// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!getSessionUserId(req)) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

const router = express.Router();

const requireUserId = (req: any, res: any): number | undefined => {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return undefined;
  }
  return userId;
};

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Fetch user settings
router.get("/settings", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data without sensitive fields
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json(buildErrorResponse('Error fetching user settings', error));
  }
});

// Update user settings
router.put("/settings", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }
    
    const { displayName, email, bio, city, state, zipCode } = req.body;
    
    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    
    await storage.updateUser(userId, updateData);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json(buildErrorResponse('Error updating user settings', error));
  }
});

export default router;
