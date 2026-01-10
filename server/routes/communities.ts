import { Router } from 'express';
import { insertCommunitySchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

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
    res.status(500).json(buildErrorResponse('Error fetching communities', error));
  }
});

// Get communities where user is admin (owner or moderator)
router.get('/api/communities/admin', requireAuth, async (req, res) => {
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

router.get('/api/communities/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const userId = getSessionUserId(req);
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
      } else {
        memberInfo = {
          isMember: false,
          role: null,
          isAdmin: false,
          isModerator: false
        };
      }
    }

    res.json({ ...community, ...memberInfo });
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json(buildErrorResponse('Error fetching community', error));
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
    res.status(500).json(buildErrorResponse('Error fetching community feed', error));
  }
});

router.post('/api/communities', requireAuth, async (req, res) => {
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
router.post('/api/communities/:id/join', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    if (!Number.isFinite(communityId)) return res.status(400).json({ message: 'invalid id' });

    const community = await storage.getCommunity(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Check if already a member
    const existingMember = await storage.getCommunityMember(communityId, userId);
    if (existingMember) {
      return res.status(400).json({ message: 'Already a member of this community' });
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

      // Notify community owner about join request
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
        message: 'Join request sent. Waiting for approval from community owner.',
        isPending: true,
        isMember: false
      });
    }

    // For public communities, add as regular member immediately
    await storage.addCommunityMember({ communityId, userId, role: 'member' });

    res.json({
      success: true,
      message: 'Joined community successfully',
      isMember: true,
      role: 'member'
    });
  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json(buildErrorResponse('Error joining community', error));
  }
});

// Leave community
router.post('/api/communities/:id/leave', requireAuth, async (req, res) => {
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

    // Prevent owner from leaving
    if (member.role === 'owner') {
      return res.status(400).json({ message: 'Owner cannot leave community. Delete it instead.' });
    }

    // Remove member
    await storage.removeCommunityMember(communityId, userId);

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
router.get('/api/communities/:id/members', async (req, res) => {
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
router.put('/api/communities/:id/members/:userId', requireAuth, async (req, res) => {
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
router.delete('/api/communities/:id/members/:userId', requireAuth, async (req, res) => {
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
router.get('/api/communities/:id/wall', requireAuth, async (req, res) => {
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
router.post('/api/communities/:id/wall', requireAuth, async (req, res) => {
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
router.delete('/api/communities/:id/wall/:postId', requireAuth, async (req, res) => {
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

router.delete('/api/communities/:id', requireAuth, async (req, res) => {
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
router.get('/api/communities/:id/join-requests', requireAuth, async (req, res) => {
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
router.post('/api/communities/:id/join-requests/:requestId/approve', requireAuth, async (req, res) => {
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
      await storage.addCommunityMember({
        communityId,
        userId: invitation.inviteeUserId,
        role: 'member'
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
router.post('/api/communities/:id/join-requests/:requestId/deny', requireAuth, async (req, res) => {
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
router.post('/api/communities/:id/invite', requireAuth, async (req, res) => {
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

export default router;
