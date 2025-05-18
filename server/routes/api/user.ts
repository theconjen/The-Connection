import { Router } from 'express';
import { isAuthenticated } from '../../auth';
import { storage } from '../../storage';

const router = Router();

// Apply authentication middleware to all routes in this file
router.use(isAuthenticated);

// Get current user's profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data without sensitive fields
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/profile', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { displayName, bio, avatarUrl } = req.body;
    
    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    
    const updatedUser = await storage.updateUser(userId, updateData);
    
    // Return updated user data without sensitive fields
    const { password, ...userData } = updatedUser;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});

// Get communities the user is a member of
router.get('/communities', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const communities = await storage.getUserCommunities(userId);
    res.json(communities);
  } catch (error) {
    next(error);
  }
});

// Get user's prayer requests
router.get('/prayer-requests', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const prayerRequests = await storage.getUserPrayerRequests(userId);
    res.json(prayerRequests);
  } catch (error) {
    next(error);
  }
});

// Get user's feed posts
router.get('/posts', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const posts = await storage.getUserPosts(userId);
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Get user's upcoming events (RSVPs)
router.get('/events', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const events = await storage.getUserEventRSVPs(userId);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

export default router;