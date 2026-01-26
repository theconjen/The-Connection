// Community chat endpoints (DM routes are in dmRoutes.ts)
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

// Get community chat messages
router.get('/communities/:id/chat/messages', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const limit = parseInt(req.query.limit as string) || 50;

    if (!Number.isFinite(communityId)) {
      return res.status(400).json({ message: 'Invalid community ID' });
    }

    // Check if user is a member
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member) {
      return res.status(403).json({ message: 'Must be a community member to view chat' });
    }

    // Get default chat room for community
    const rooms = await storage.getCommunityRooms(communityId);
    if (!rooms || rooms.length === 0) {
      // No room exists, return empty array
      return res.json([]);
    }

    const defaultRoom = rooms[0];
    const messages = await storage.getChatMessages(defaultRoom.id, limit);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json(buildErrorResponse('Error fetching chat messages', error));
  }
});

// Get or create default chat room for community
router.get('/communities/:id/chat/room', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    console.info(`[Chat Room] Fetching room for community ${communityId}`);

    const userId = requireSessionUserId(req);
    console.info(`[Chat Room] User ${userId} requesting room`);

    if (!Number.isFinite(communityId)) {
      return res.status(400).json({ message: 'Invalid community ID' });
    }

    // Check if user is a member
    console.info(`[Chat Room] Checking membership for user ${userId} in community ${communityId}`);
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member) {
      console.info(`[Chat Room] User ${userId} is not a member of community ${communityId}`);
      return res.status(403).json({ message: 'Must be a community member to access chat' });
    }
    console.info(`[Chat Room] User ${userId} is a member with role: ${member.role}`);

    // Get or create default chat room
    console.info(`[Chat Room] Getting rooms for community ${communityId}`);
    let rooms = await storage.getCommunityRooms(communityId);
    console.info(`[Chat Room] Found ${rooms?.length || 0} rooms`);

    if (!rooms || rooms.length === 0) {
      // Create default room
      console.info(`[Chat Room] No rooms found, creating default room`);
      const community = await storage.getCommunity(communityId);
      console.info(`[Chat Room] Community name: ${community?.name}`);
      const room = await storage.createCommunityRoom({
        communityId,
        name: `${community?.name || 'Community'} Chat`,
        isPrivate: false,
        createdBy: userId,
      });
      console.info(`[Chat Room] Created room with id: ${room.id}`);
      rooms = [room];
    }

    res.json(rooms[0]);
  } catch (error: any) {
    console.error('[Chat Room] Error:', error.message, error.stack);
    res.status(500).json(buildErrorResponse('Error fetching chat room', error));
  }
});

export default router;
