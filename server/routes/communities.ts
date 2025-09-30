import { Router } from 'express';
import { insertCommunitySchema } from '@shared/schema';
import { isAuthenticated } from '../auth';
import { storage as storageReal } from '../storage';

const storage: any = storageReal;
const router = Router();

function getSessionUserId(req: any): number | undefined {
  const raw = req.session?.userId;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number') return raw;
  const n = parseInt(String(raw));
  return Number.isFinite(n) ? n : undefined;
}

router.get('/api/communities', async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const searchQuery = req.query.search as string;
    let communities = await storage.getPublicCommunitiesAndUserCommunities(userId, searchQuery);
    if (userId) {
      const blockedIds = await storage.getBlockedUserIdsFor(userId);
      if (blockedIds && blockedIds.length > 0) {
        communities = communities.filter(c => !blockedIds.includes(c.createdBy));
      }
    }
    res.json(communities);
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ message: 'Error fetching communities' });
  }
});

router.get('/api/communities/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNumeric = /^\d+$/.test(idOrSlug);
    let community;
    if (isNumeric) {
      const communityId = parseInt(idOrSlug);
      community = await storage.getCommunity(communityId);
    } else {
      community = await storage.getCommunityBySlug(idOrSlug);
    }
    if (!community) return res.status(404).json({ message: 'Community not found' });
    res.json(community);
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ message: 'Error fetching community' });
  }
});

router.post('/api/communities', isAuthenticated, async (req, res) => {
  try {
    const userId = getSessionUserId(req)!;
    const validatedData = insertCommunitySchema.parse({ ...req.body, createdBy: userId });
    const community = await storage.createCommunity(validatedData);
    await storage.addCommunityMember({ communityId: community.id, userId: userId, role: 'owner' });
    res.status(201).json(community);
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ message: 'Error creating community' });
  }
});

// join/leave/invite/etc. endpoints were intentionally omitted from this initial split to keep the first
// pass minimal. Existing behavior remains in server/routes.ts until further extraction.

export default router;
