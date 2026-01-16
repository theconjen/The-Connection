import { Router } from 'express';
import { insertCommunitySchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

// Helper function to calculate distance using Haversine formula (returns miles)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

router.get('/communities', async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const searchQuery = req.query.search as string;

    // Extract location parameters
    const userLat = req.query.userLat ? parseFloat(req.query.userLat as string) : null;
    const userLng = req.query.userLng ? parseFloat(req.query.userLng as string) : null;
    const maxDistance = req.query.maxDistance ? parseFloat(req.query.maxDistance as string) : null; // in miles

    // Extract filter parameters
    const filters = {
      ageGroup: req.query.ageGroup as string,
      gender: req.query.gender as string,
      ministryTypes: req.query.ministryTypes ? (req.query.ministryTypes as string).split(',') : [],
      activities: req.query.activities ? (req.query.activities as string).split(',') : [],
      professions: req.query.professions ? (req.query.professions as string).split(',') : [],
      recoverySupport: req.query.recoverySupport ? (req.query.recoverySupport as string).split(',') : [],
      meetingType: req.query.meetingType as string,
      frequency: req.query.frequency as string,
      lifeStages: req.query.lifeStages ? (req.query.lifeStages as string).split(',') : [],
      parentCategories: req.query.parentCategories ? (req.query.parentCategories as string).split(',') : [],
    };

    let communities = await storage.getPublicCommunitiesAndUserCommunities(userId, searchQuery);

    // Calculate distance for each community if user location is provided
    if (userLat !== null && userLng !== null) {
      communities = communities.map((community: any) => {
        let distance = null;
        if (community.latitude && community.longitude) {
          const communityLat = parseFloat(community.latitude);
          const communityLng = parseFloat(community.longitude);
          if (!isNaN(communityLat) && !isNaN(communityLng)) {
            distance = calculateDistance(userLat, userLng, communityLat, communityLng);
          }
        }
        return { ...community, distance };
      });
    }

    // Apply filters
    communities = communities.filter((community: any) => {
      // Age Group filter
      if (filters.ageGroup && community.ageGroup && community.ageGroup !== filters.ageGroup) {
        return false;
      }

      // Gender filter
      if (filters.gender && community.gender && community.gender !== filters.gender) {
        return false;
      }

      // Meeting Type filter
      if (filters.meetingType && community.meetingType && community.meetingType !== filters.meetingType) {
        return false;
      }

      // Frequency filter
      if (filters.frequency && community.frequency && community.frequency !== filters.frequency) {
        return false;
      }

      // Ministry Types filter (array overlap check)
      if (filters.ministryTypes.length > 0 && community.ministryTypes) {
        const hasMatch = filters.ministryTypes.some((type: string) => community.ministryTypes.includes(type));
        if (!hasMatch) return false;
      }

      // Activities filter (array overlap check)
      if (filters.activities.length > 0 && community.activities) {
        const hasMatch = filters.activities.some((activity: string) => community.activities.includes(activity));
        if (!hasMatch) return false;
      }

      // Professions filter (array overlap check)
      if (filters.professions.length > 0 && community.professions) {
        const hasMatch = filters.professions.some((profession: string) => community.professions.includes(profession));
        if (!hasMatch) return false;
      }

      // Recovery Support filter (array overlap check)
      if (filters.recoverySupport.length > 0 && community.recoverySupport) {
        const hasMatch = filters.recoverySupport.some((support: string) => community.recoverySupport.includes(support));
        if (!hasMatch) return false;
      }

      // Life Stages filter (array overlap check)
      if (filters.lifeStages.length > 0 && community.lifeStages) {
        const hasMatch = filters.lifeStages.some((stage: string) => community.lifeStages.includes(stage));
        if (!hasMatch) return false;
      }

      // Parent Categories filter (array overlap check)
      if (filters.parentCategories.length > 0 && community.parentCategories) {
        const hasMatch = filters.parentCategories.some((category: string) => community.parentCategories.includes(category));
        if (!hasMatch) return false;
      }

      // Distance filter - only apply to in-person communities
      if (maxDistance !== null && community.meetingType === 'In-Person') {
        // If community has no location, filter it out when distance filtering is active
        if (community.distance === null) return false;
        // Filter out communities beyond max distance
        if (community.distance > maxDistance) return false;
      }

      return true;
    });

    if (userId) {
      const blockedIds = await storage.getBlockedUserIdsFor(userId);
      if (blockedIds && blockedIds.length > 0) {
        communities = communities.filter((c: any) => !blockedIds.includes(c.createdBy));
      }
    }

    // Smart sorting: prioritize local in-person communities
    communities = communities.sort((a: any, b: any) => {
      // If both have distances, sort by distance (closest first) for in-person
      if (a.distance !== null && b.distance !== null) {
        // Prioritize in-person communities by distance
        if (a.meetingType === 'In-Person' && b.meetingType === 'In-Person') {
          return a.distance - b.distance;
        }
        // In-person with distance comes before online
        if (a.meetingType === 'In-Person' && b.meetingType !== 'In-Person') {
          return -1;
        }
        if (a.meetingType !== 'In-Person' && b.meetingType === 'In-Person') {
          return 1;
        }
      }
      // Fall back to creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Limit to 50 results
    communities = communities.slice(0, 50);
    res.json(communities);
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json(buildErrorResponse('Error fetching communities', error));
  }
});

// Get communities where user is admin (owner or moderator)
router.get('/communities/admin', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);

    // Get all user's communities
    const userCommunities = await storage.getUserCommunities(userId);

    // Filter to only communities where user is owner or moderator
    const adminCommunities = [];
    for (const community of userCommunities) {
      const member = await storage.getCommunityMember(community.id, userId);
      if (member && (member.role === 'owner' || member.role === 'moderator')) {
        adminCommunities.push({
          ...community,
          role: member.role
        });
      }
    }

    res.json(adminCommunities);
  } catch (error) {
    console.error('Error fetching admin communities:', error);
    res.status(500).json(buildErrorResponse('Error fetching admin communities', error));
  }
});

// Get personalized recommended communities for user
router.get('/communities/recommended', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const limit = parseInt(req.query.limit as string) || 10;

    // Get recommended communities based on user profile, interests, location, etc.
    const recommendations = await storage.getRecommendedCommunities(userId, Math.min(limit, 20));

    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommended communities:', error);
    res.status(500).json(buildErrorResponse('Error fetching recommended communities', error));
  }
});

router.get('/communities/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Debug: Check all auth headers
    console.error('[GET COMMUNITY] Auth headers:', {
      authorization: req.headers.authorization?.substring(0, 20) + '...',
      cookie: req.headers.cookie?.substring(0, 50) + '...',
      sessionUserId: req.session?.userId
    });

    const userId = getSessionUserId(req);
    console.error(`[GET COMMUNITY] User ${userId || 'anonymous'} fetching community ${idOrSlug}`);

    const isNumeric = /^\d+$/.test(idOrSlug);
    let community;
    if (isNumeric) {
      const communityId = parseInt(idOrSlug);
      community = await storage.getCommunity(communityId);
    } else {
      community = await storage.getCommunityBySlug(idOrSlug);
    }
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Include membership info if user is logged in
    let memberInfo = null;
    if (userId) {
      const member = await storage.getCommunityMember(community.id, userId);
      if (member) {
        memberInfo = {
          isMember: true,
          role: member.role,
          isAdmin: member.role === 'owner',
          isModerator: member.role === 'moderator'
        };
        console.error(`[GET COMMUNITY] User ${userId} is a member with role: ${member.role}`);
      } else {
        memberInfo = {
          isMember: false,
          role: null,
          isAdmin: false,
          isModerator: false
        };
        console.error(`[GET COMMUNITY] User ${userId} is NOT a member`);
      }
    }

    // Prevent caching to ensure fresh membership data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Debug-Timestamp', new Date().toISOString());
    res.setHeader('X-Debug-Code-Version', 'v2-with-membership');

    console.error(`[GET COMMUNITY] ===== RETURNING RESPONSE =====`);
    console.error(`[GET COMMUNITY] Community: ${community.name}, Member: ${memberInfo?.isMember}, Role: ${memberInfo?.role}`);

    res.json({ ...community, ...memberInfo });
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json(buildErrorResponse('Error fetching community', error));
  }
});

router.get('/communities/:id/feed', async (req, res) => {
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
    res.status(500).json(buildErrorResponse('Error fetching community feed', error));
  }
});

router.post('/communities', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
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
    res.status(500).json(buildErrorResponse('Error creating community', error));
  }
});

// Join community
router.post('/communities/:id/join', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    console.error(`[JOIN] User ${userId} attempting to join community ${communityId}`);

    if (!Number.isFinite(communityId)) return res.status(400).json({ message: 'invalid id' });

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if already a member
    const existingMember = await storage.getCommunityMember(communityId, userId);
    if (existingMember) {
      console.error(`[JOIN] User ${userId} is already a member with role: ${existingMember.role}`);
      return res.status(400).json({
        message: 'Already a member of this community',
        isMember: true,
        role: existingMember.role
      });
    }

    // Check if community is private
    if (community.isPrivate) {
      // For private communities, create a join request (invitation) instead
      // Check if invitation already exists
      const existingInvitation = await storage.getCommunityInvitationByEmailAndCommunity(
        (await storage.getUser(userId))?.email || '',
        communityId
      );

      if (existingInvitation) {
        return res.status(400).json({
          message: 'Join request already pending',
          isPending: true
        });
      }

      // Create join request
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: 'User not found' });
      }

      // Create join request with 30-day expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await storage.createCommunityInvitation({
        communityId,
        inviterUserId: userId, // Self-invitation indicates a join request
        inviteeEmail: user.email,
        inviteeUserId: userId,
        status: 'pending',
        token: `join-request-${userId}-${communityId}-${Date.now()}`,
        expiresAt
      });

      // Notify community creator about join request
      const owner = await storage.getCommunityMembers(communityId);
      const ownerMember = owner.find(m => m.role === 'owner');
      if (ownerMember) {
        await storage.createNotification({
          userId: ownerMember.userId,
          title: 'New Join Request',
          body: `${user.displayName || user.username} wants to join ${community.name}`,
          data: { communityId, userId, type: 'join_request' },
          category: 'community'
        });
      }

      return res.json({
        success: true,
        message: 'Join request sent. Waiting for approval from community creator.',
        isPending: true,
        isMember: false
      });
    }

    // For public communities, check if this is the first member
    const existingMembers = await storage.getCommunityMembers(communityId);
    const hasOwner = existingMembers.some(m => m.role === 'owner');
    const role = (existingMembers.length === 0 || !hasOwner) ? 'owner' : 'member';

    console.error(`[JOIN] Adding user ${userId} as ${role} (existing members: ${existingMembers.length}, has owner: ${hasOwner})`);
    await storage.addCommunityMember({ communityId, userId, role });

    console.error(`[JOIN] Successfully added user ${userId} to community ${communityId} as ${role}`);
    res.json({
      success: true,
      message: role === 'owner' ? 'Joined community as owner' : 'Joined community successfully',
      isMember: true,
      role
    });
  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json(buildErrorResponse('Error joining community', error));
  }
});

// Leave community
router.post('/communities/:id/leave', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    if (!Number.isFinite(communityId)) return res.status(400).json({ message: 'invalid id' });

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if member
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member) {
      return res.status(400).json({ message: 'Not a member of this community' });
    }

    // Handle owner leaving
    if (member.role === 'owner') {
      const allMembers = await storage.getCommunityMembers(communityId);

      if (allMembers.length === 1) {
        // Owner is the only member - delete the community
        console.error(`[LEAVE] Owner ${userId} is leaving and is the only member - deleting community ${communityId}`);
        await storage.deleteCommunity(communityId);
        return res.json({
          success: true,
          message: 'Community deleted successfully',
          communityDeleted: true
        });
      } else {
        // There are other members - transfer ownership to first moderator or first member
        const otherMembers = allMembers.filter(m => m.userId !== userId);
        const moderators = otherMembers.filter(m => m.role === 'moderator');
        const newOwner = moderators[0] || otherMembers[0];

        if (newOwner) {
          console.error(`[LEAVE] Transferring ownership from ${userId} to ${newOwner.userId}`);
          await storage.updateCommunityMemberRole(communityId, newOwner.userId, 'owner');
        }
      }
    }

    // Remove member
    await storage.removeCommunityMember(communityId, userId);
    console.error(`[LEAVE] Successfully removed user ${userId} from community ${communityId}`);

    res.json({
      success: true,
      message: 'Left community successfully',
      isMember: false
    });
  } catch (error) {
    console.error('Error leaving community:', error);
    res.status(500).json(buildErrorResponse('Error leaving community', error));
  }
});

// Get community members
router.get('/communities/:id/members', async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    if (!Number.isFinite(communityId)) return res.status(400).json({ message: 'invalid id' });

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    const members = await storage.getCommunityMembers(communityId);

    res.json(members);
  } catch (error) {
    console.error('Error fetching community members:', error);
    res.status(500).json(buildErrorResponse('Error fetching community members', error));
  }
});

// Update member role (admin/moderator management)
router.put('/communities/:id/members/:userId', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const adminUserId = requireSessionUserId(req);
    const { role } = req.body;

    if (!Number.isFinite(communityId) || !Number.isFinite(targetUserId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    if (!['member', 'moderator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be member or moderator' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if requester is owner
    const adminMember = await storage.getCommunityMember(communityId, adminUserId);
    if (!adminMember || adminMember.role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can change member roles' });
    }

    // Check if target user is a member
    const targetMember = await storage.getCommunityMember(communityId, targetUserId);
    if (!targetMember) {
      return res.status(404).json({ message: 'User is not a member of this community' });
    }

    // Prevent changing owner role
    if (targetMember.role === 'owner') {
      return res.status(400).json({ message: 'Cannot change owner role' });
    }

    // Update role
    await storage.updateCommunityMemberRole(communityId, targetUserId, role);

    res.json({
      success: true,
      message: `Updated user role to ${role}`,
      role
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json(buildErrorResponse('Error updating member role', error));
  }
});

// Remove member (admin only)
router.delete('/communities/:id/members/:userId', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const adminUserId = requireSessionUserId(req);

    if (!Number.isFinite(communityId) || !Number.isFinite(targetUserId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if requester is owner
    const adminMember = await storage.getCommunityMember(communityId, adminUserId);
    if (!adminMember || adminMember.role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can remove members' });
    }

    // Check if target user is a member
    const targetMember = await storage.getCommunityMember(communityId, targetUserId);
    if (!targetMember) {
      return res.status(404).json({ message: 'User is not a member of this community' });
    }

    // Prevent removing owner
    if (targetMember.role === 'owner') {
      return res.status(400).json({ message: 'Cannot remove owner from community' });
    }

    // Remove member
    await storage.removeCommunityMember(communityId, targetUserId);

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json(buildErrorResponse('Error removing member', error));
  }
});

// Get wall posts
router.get('/communities/:id/wall', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(communityId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if user is a member
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member) {
      return res.status(403).json({ message: 'Must be a community member to view wall posts' });
    }

    // Get wall posts
    const posts = await storage.getCommunityWallPosts(communityId);

    res.json(posts);
  } catch (error) {
    console.error('Error fetching wall posts:', error);
    res.status(500).json(buildErrorResponse('Error fetching wall posts', error));
  }
});

// Create wall post
router.post('/communities/:id/wall', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const { content } = req.body;

    if (!Number.isFinite(communityId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    if (content.trim().length < 5) {
      return res.status(400).json({ message: 'Post must be at least 5 characters long' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if user is a member
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member) {
      return res.status(403).json({ message: 'Must be a community member to post' });
    }

    // Create wall post
    const post = await storage.createCommunityWallPost({
      communityId,
      authorId: userId,
      content: content.trim(),
    });

    // Get post with author info
    const postWithAuthor = await storage.getCommunityWallPost(post.id);

    res.status(201).json(postWithAuthor);
  } catch (error) {
    console.error('Error creating wall post:', error);
    res.status(500).json(buildErrorResponse('Error creating wall post', error));
  }
});

// Delete wall post (admin/moderator only)
router.delete('/communities/:id/wall/:postId', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const postId = parseInt(req.params.postId);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(communityId) || !Number.isFinite(postId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if requester is admin or moderator
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member || (member.role !== 'owner' && member.role !== 'moderator')) {
      return res.status(403).json({ message: 'Only admins and moderators can delete posts' });
    }

    // Delete the post
    await storage.deleteCommunityWallPost(postId);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json(buildErrorResponse('Error deleting post', error));
  }
});

router.delete('/communities/:id', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    if (!Number.isFinite(communityId)) return res.status(400).json({ message: 'invalid id' });

    const isOwner = await storage.isCommunityOwner(communityId, userId);
    if (!isOwner) return res.status(403).json({ message: 'Only owner can delete community' });

    const ok = await storage.deleteCommunity(communityId);
    if (!ok) return res.status(404).json({ message: 'Community not found' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json(buildErrorResponse('Error deleting community', error));
  }
});

// Get pending join requests (owner/moderator only)
router.get('/communities/:id/join-requests', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(communityId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if requester is owner or moderator
    const isModerator = await storage.isCommunityModerator(communityId, userId);
    if (!isModerator) {
      return res.status(403).json({ message: 'Only admins and moderators can view join requests' });
    }

    // Get pending join requests
    const allInvitations = await storage.getCommunityInvitations(communityId);
    const joinRequests = allInvitations.filter((inv: any) =>
      inv.status === 'pending' && inv.inviterUserId === inv.inviteeUserId
    );

    res.json(joinRequests);
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json(buildErrorResponse('Error fetching join requests', error));
  }
});

// Approve join request (owner/moderator only)
router.post('/communities/:id/join-requests/:requestId/approve', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const requestId = parseInt(req.params.requestId);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(communityId) || !Number.isFinite(requestId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if requester is owner or moderator
    const isModerator = await storage.isCommunityModerator(communityId, userId);
    if (!isModerator) {
      return res.status(403).json({ message: 'Only admins and moderators can approve join requests' });
    }

    // Get the invitation
    const invitation = await storage.getCommunityInvitationById(requestId);
    if (!invitation || invitation.communityId !== communityId) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Join request already processed' });
    }

    // Add user to community
    if (invitation.inviteeUserId) {
      // Check if this is the first member or if there's no owner
      const existingMembers = await storage.getCommunityMembers(communityId);
      const hasOwner = existingMembers.some(m => m.role === 'owner');
      const role = (existingMembers.length === 0 || !hasOwner) ? 'owner' : 'member';

      await storage.addCommunityMember({
        communityId,
        userId: invitation.inviteeUserId,
        role
      });

      // Update invitation status
      await storage.updateCommunityInvitationStatus(requestId, 'accepted');

      // Notify the user
      await storage.createNotification({
        userId: invitation.inviteeUserId,
        title: 'Join Request Approved',
        body: `Your request to join ${community.name} has been approved!`,
        data: { communityId, type: 'join_approved' },
        category: 'community'
      });

      res.json({
        success: true,
        message: 'Join request approved'
      });
    } else {
      return res.status(400).json({ message: 'Invalid join request' });
    }
  } catch (error) {
    console.error('Error approving join request:', error);
    res.status(500).json(buildErrorResponse('Error approving join request', error));
  }
});

// Deny join request (owner/moderator only)
router.post('/communities/:id/join-requests/:requestId/deny', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const requestId = parseInt(req.params.requestId);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(communityId) || !Number.isFinite(requestId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if requester is owner or moderator
    const isModerator = await storage.isCommunityModerator(communityId, userId);
    if (!isModerator) {
      return res.status(403).json({ message: 'Only admins and moderators can deny join requests' });
    }

    // Get the invitation
    const invitation = await storage.getCommunityInvitationById(requestId);
    if (!invitation || invitation.communityId !== communityId) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Join request already processed' });
    }

    // Update invitation status
    await storage.updateCommunityInvitationStatus(requestId, 'declined');

    // Notify the user
    if (invitation.inviteeUserId) {
      await storage.createNotification({
        userId: invitation.inviteeUserId,
        title: 'Join Request Declined',
        body: `Your request to join ${community.name} was not approved.`,
        data: { communityId, type: 'join_denied' },
        category: 'community'
      });
    }

    res.json({
      success: true,
      message: 'Join request denied'
    });
  } catch (error) {
    console.error('Error denying join request:', error);
    res.status(500).json(buildErrorResponse('Error denying join request', error));
  }
});

// Invite user to community by email (owner/moderator only)
router.post('/communities/:id/invite', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const { email } = req.body;

    if (!Number.isFinite(communityId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if requester is owner or moderator
    const isModerator = await storage.isCommunityModerator(communityId, userId);
    if (!isModerator) {
      return res.status(403).json({ message: 'Only admins and moderators can send invitations' });
    }

    // Check if invitation already exists
    const existingInvitation = await storage.getCommunityInvitationByEmailAndCommunity(email, communityId);
    if (existingInvitation && existingInvitation.status === 'pending') {
      return res.status(400).json({ message: 'Invitation already sent to this email' });
    }

    // Check if user with this email exists
    const invitedUser = await storage.getUserByEmail(email);

    // Create invitation with 30-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invitation = await storage.createCommunityInvitation({
      communityId,
      inviterUserId: userId,
      inviteeEmail: email,
      inviteeUserId: invitedUser?.id,
      status: 'pending',
      token: `invite-${communityId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      expiresAt
    });

    // Notify the user if they exist
    if (invitedUser) {
      await storage.createNotification({
        userId: invitedUser.id,
        title: 'Community Invitation',
        body: `You've been invited to join ${community.name}`,
        data: { communityId, invitationId: invitation.id, type: 'community_invite' },
        category: 'community'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invitation
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json(buildErrorResponse('Error sending invitation', error));
  }
});

// ============================================================================
// COMMUNITY UPDATE
// ============================================================================

// Update community details (owner only)
router.patch('/communities/:id', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(communityId)) {
      return res.status(400).json({ message: 'Invalid community ID' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if user is owner
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member || member.role !== 'owner') {
      return res.status(403).json({ message: 'Only community owners can update community details' });
    }

    // Update allowed fields
    const {
      name,
      description,
      iconName,
      iconColor,
      interestTags,
      city,
      state,
      isPrivate,
      hasPrivateWall,
      hasPublicWall,
      bannerUrl,
      avatarUrl
    } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (iconName !== undefined) updateData.iconName = iconName;
    if (iconColor !== undefined) updateData.iconColor = iconColor;
    if (interestTags !== undefined) updateData.interestTags = interestTags;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
    if (hasPrivateWall !== undefined) updateData.hasPrivateWall = hasPrivateWall;
    if (hasPublicWall !== undefined) updateData.hasPublicWall = hasPublicWall;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const updatedCommunity = await storage.updateCommunity(communityId, updateData);

    res.json({
      success: true,
      community: updatedCommunity
    });
  } catch (error) {
    console.error('Error updating community:', error);
    res.status(500).json(buildErrorResponse('Error updating community', error));
  }
});

// ============================================================================
// WALL POST LIKES
// ============================================================================

// Like a wall post
router.post('/communities/:id/wall/:postId/like', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const postId = parseInt(req.params.postId);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(communityId) || !Number.isFinite(postId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    // Check if user is member
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member) {
      return res.status(403).json({ message: 'Must be a community member to like posts' });
    }

    // Check if post exists
    const wallPosts = await storage.getCommunityWallPosts(communityId);
    const post = wallPosts.find((p: any) => p.id === postId);
    if (!post) {
      return res.status(404).json({ message: 'Wall post not found' });
    }

    // Toggle like (create or delete)
    const result = await storage.toggleCommunityWallPostLike(postId, userId);

    res.json({
      success: true,
      liked: result.liked,
      likeCount: result.likeCount
    });
  } catch (error) {
    console.error('Error liking wall post:', error);
    res.status(500).json(buildErrorResponse('Error liking wall post', error));
  }
});

// Unlike a wall post (same as POST for toggle)
router.delete('/communities/:id/wall/:postId/like', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const postId = parseInt(req.params.postId);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(communityId) || !Number.isFinite(postId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const result = await storage.toggleCommunityWallPostLike(postId, userId);

    res.json({
      success: true,
      liked: result.liked,
      likeCount: result.likeCount
    });
  } catch (error) {
    console.error('Error unliking wall post:', error);
    res.status(500).json(buildErrorResponse('Error unliking wall post', error));
  }
});

// ============================================================================
// WALL POST COMMENTS
// ============================================================================

// Get comments for a wall post
router.get('/communities/:id/wall/:postId/comments', async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const postId = parseInt(req.params.postId);

    if (!Number.isFinite(communityId) || !Number.isFinite(postId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const comments = await storage.getCommunityWallPostComments(postId);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching wall post comments:', error);
    res.status(500).json(buildErrorResponse('Error fetching wall post comments', error));
  }
});

// Create a comment on a wall post
router.post('/communities/:id/wall/:postId/comments', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const postId = parseInt(req.params.postId);
    const userId = requireSessionUserId(req);
    const { content, parentId } = req.body;

    if (!Number.isFinite(communityId) || !Number.isFinite(postId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Check if user is member
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member) {
      return res.status(403).json({ message: 'Must be a community member to comment' });
    }

    const comment = await storage.createCommunityWallPostComment({
      postId,
      authorId: userId,
      content: content.trim(),
      parentId: parentId || null
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating wall post comment:', error);
    res.status(500).json(buildErrorResponse('Error creating wall post comment', error));
  }
});

// ============================================================================
// PRAYER REQUEST ENDPOINTS
// ============================================================================

// Get community prayer requests
router.get('/communities/:id/prayer-requests', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(communityId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    // Check if user is a member
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member) {
      return res.status(403).json({ message: 'Must be a community member to view prayer requests' });
    }

    const prayerRequests = await storage.getCommunityPrayerRequests(communityId);
    res.json(prayerRequests);
  } catch (error) {
    console.error('Error fetching community prayer requests:', error);
    res.status(500).json(buildErrorResponse('Error fetching prayer requests', error));
  }
});

// Create prayer request in community
router.post('/communities/:id/prayer-requests', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const { title, content, isAnonymous } = req.body;

    if (!Number.isFinite(communityId)) {
      return res.status(400).json({ message: 'invalid id' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Prayer request title is required' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Prayer request content is required' });
    }

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if user is a member
    const member = await storage.getCommunityMember(communityId, userId);
    if (!member) {
      return res.status(403).json({ message: 'Must be a community member to create prayer requests' });
    }

    // Create prayer request
    const prayerRequest = await storage.createPrayerRequest({
      communityId,
      authorId: userId,
      title: title.trim(),
      content: content.trim(),
      isAnonymous: isAnonymous || false,
      privacyLevel: 'community-only',
    } as any);

    res.status(201).json(prayerRequest);
  } catch (error) {
    console.error('Error creating prayer request:', error);
    res.status(500).json(buildErrorResponse('Error creating prayer request', error));
  }
});

// Mark prayer request as answered
router.patch('/communities/:id/prayer-requests/:prayerId/answered', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const prayerId = parseInt(req.params.prayerId);
    const userId = requireSessionUserId(req);
    const { answeredDescription } = req.body;

    if (!communityId || !prayerId) {
      return res.status(400).json({ message: 'Invalid community or prayer request ID' });
    }

    // Get prayer request
    const prayerRequest = await storage.getPrayerRequest(prayerId);
    if (!prayerRequest) {
      return res.status(404).json({ message: 'Prayer request not found' });
    }

    // Only the author can mark their prayer as answered
    if (prayerRequest.authorId !== userId) {
      return res.status(403).json({ message: 'Only the author can mark this prayer as answered' });
    }

    // Update prayer request
    const updated = await storage.updatePrayerRequest(prayerId, {
      isAnswered: true,
      answeredDescription: answeredDescription || null,
      updatedAt: new Date(),
    });

    res.json(updated);
  } catch (error) {
    console.error('Error marking prayer as answered:', error);
    res.status(500).json(buildErrorResponse('Error marking prayer as answered', error));
  }
});

export default router;
