import { Router } from 'express';
import { isAuthenticated } from '../../auth';
import { storage } from '../../storage-optimized';

const router = Router();

// Apply authentication middleware to all routes in this file
router.use(isAuthenticated);

// Get current user's profile
router.get('/profile', async (req, res, next) => {
  try {
  const userId = req.session.userId;
  const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
  const user = await storage.getUser(resolvedUserId);
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
// Update user profile - supports both /profile and /:id endpoints
router.patch('/profile', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { displayName, bio, avatarUrl, email, city, state, zipCode } = req.body;
    
    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (email !== undefined) updateData.email = email;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    
  const updatedUser = await storage.updateUser(resolvedUserId, updateData);
    
    // Return updated user data without sensitive fields
    const { password, ...userData } = updatedUser;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});

// Alternative endpoint for updating user by ID (same functionality)
router.patch('/:id', async (req, res, next) => {
  try {
  const userId = req.session.userId;
  const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
  const targetUserId = parseInt(req.params.id);
    
    // Only allow users to update their own profile
    if (!userId || resolvedUserId !== targetUserId) {
      return res.status(401).json({ message: 'Not authorized to update this profile' });
    }
    
    const { displayName, bio, avatarUrl, email, city, state, zipCode } = req.body;
    
    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (email !== undefined) updateData.email = email;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    
  const updatedUser = await storage.updateUser(targetUserId, updateData);
    
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
    const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get communities where user is a member (this would need to be implemented in storage)
    const communities = await storage.getAllCommunities(); // Temporary - should filter by user membership
    res.json(communities);
  } catch (error) {
    next(error);
  }
});

// Get user's prayer requests
router.get('/prayer-requests', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const prayerRequests = await storage.getUserPrayerRequests(resolvedUserId);
    res.json(prayerRequests);
  } catch (error) {
    next(error);
  }
});

// Get user's feed posts
router.get('/posts', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get user's posts (this would need to be implemented in storage)
  const posts = await storage.getAllPosts(); // Temporary - should filter by user
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Get user's upcoming events (RSVPs)
router.get('/events', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get user's event RSVPs (this would need to be implemented in storage)
  const events = await storage.getAllEvents(); // Temporary - should filter by user RSVPs
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// User settings endpoints using your approach
router.get("/settings", async (req, res) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
  const user = await storage.getUser(resolvedUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data without sensitive fields
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user settings' });
  }
});

// Update user settings using your approach
router.put("/settings", async (req, res) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
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
    
  await storage.updateUser(resolvedUserId, updateData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user settings' });
  }
});

export default router;