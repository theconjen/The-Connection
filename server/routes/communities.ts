import { Router } from 'express';
import { insertCommunitySchema } from '@shared/schema';
import { isAuthenticated } from '../auth';
import { storage } from '../storage-optimized';

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
        communities = communities.filter((c: any) => !blockedIds.includes(c.createdBy));
      }
    }
    // Recent 50 (assume createdAt desc order downstream or sort here)
    communities = communities.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
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

router.get('/api/communities/:id/feed', async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    if (!Number.isFinite(communityId)) return res.status(400).json({ message: 'invalid id' });

    // storage helper expects slug; we can fetch community to get slug
    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    const userId = getSessionUserId(req);
    let posts = await storage.getPostsByCommunitySlug(community.slug);

    if (userId) {
      const blockedIds = await storage.getBlockedUserIdsFor(userId);
      if (blockedIds?.length) posts = posts.filter((p: any) => !blockedIds.includes(p.authorId));
    }

    // Exclude deleted handled in storage; cap 100 for scoped feed
    res.json(posts.slice(0, 100));
  } catch (error) {
    console.error('Error fetching community feed:', error);
    res.status(500).json({ message: 'Error fetching community feed' });
  }
});

router.post('/api/communities', isAuthenticated, async (req, res) => {
  try {
    const userId = getSessionUserId(req)!;
    // Allow title/desc inputs; set defaults for required fields
    const { title, desc, name, description, iconName, iconColor } = req.body || {};
    const effectiveName = name || title;
    const effectiveDescription = description || desc || '';
    if (!effectiveName) return res.status(400).json({ message: 'title/name required' });
    // Simple slug
    const slug = String(effectiveName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload = {
      name: effectiveName,
      description: effectiveDescription,
      slug,
      iconName: iconName || 'users',
      iconColor: iconColor || 'primary',
      interestTags: [],
      isLocalCommunity: false,
      hasPrivateWall: false,
      hasPublicWall: true,
      createdBy: userId,
    };
    const validatedData = insertCommunitySchema.parse(payload as any);
    const community = await storage.createCommunity(validatedData);
    await storage.addCommunityMember({ communityId: community.id, userId: userId, role: 'owner' });
    res.status(201).json(community);
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ message: 'Error creating community' });
  }
});

router.delete('/api/communities/:id', isAuthenticated, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = getSessionUserId(req)!;
    if (!Number.isFinite(communityId)) return res.status(400).json({ message: 'invalid id' });

    const isOwner = await storage.isCommunityOwner(communityId, userId);
    if (!isOwner) return res.status(403).json({ message: 'Only owner can delete community' });

    const ok = await storage.deleteCommunity(communityId);
    if (!ok) return res.status(404).json({ message: 'Community not found' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ message: 'Error deleting community' });
  }
});

export default router;
