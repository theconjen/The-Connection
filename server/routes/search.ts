import { Router } from 'express';
import { storage } from '../storage-optimized';
import { requireAuth } from '../middleware/auth';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

// Universal search endpoint
router.get('/', requireAuth, async (req, res) => {
  try {
    const { q, filter = 'all' } = req.query;
    const searchQuery = String(q || '').trim();

    if (!searchQuery || searchQuery.length < 2) {
      return res.json([]);
    }

    const results: any[] = [];
    const currentUserId = req.session?.userId;

    // Search users (accounts) - always searchable regardless of private status
    if (filter === 'all' || filter === 'accounts') {
      const users = await storage.searchUsers(searchQuery);
      const userResults = await Promise.all(users.slice(0, 20).map(async (user: any) => {
        // Check if current user can message this user
        let canMessage = true;
        let dmPrivacyReason = null;

        if (currentUserId && user.id !== currentUserId) {
          const dmPrivacy = user.dmPrivacy || 'everyone';
          if (dmPrivacy === 'nobody') {
            canMessage = false;
            dmPrivacyReason = 'User has disabled direct messages';
          } else if (dmPrivacy === 'followers' || dmPrivacy === 'friends') {
            const isFollowing = await storage.isUserFollowing?.(currentUserId, user.id);
            if (!isFollowing) {
              canMessage = false;
              dmPrivacyReason = 'You must follow this user to send messages';
            }
          }
        }

        return {
          type: 'user',
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isPrivate: user.profileVisibility === 'private',
          canMessage,
          dmPrivacyReason,
        };
      }));
      results.push(...userResults);
    }

    // Search communities
    if (filter === 'all' || filter === 'communities') {
      const communities = await storage.searchCommunities(searchQuery);
      const communityResults = communities.slice(0, 20).map((community: any) => ({
        type: 'community',
        id: community.id,
        name: community.name,
        description: community.description,
        iconName: community.iconName,
        memberCount: community.memberCount,
        isPrivate: community.isPrivate,
      }));
      results.push(...communityResults);
    }

    // Search posts/forms
    if (filter === 'all' || filter === 'forms') {
      try {
        const posts = await storage.searchPosts?.(searchQuery);
        if (posts) {
          const postResults = posts.slice(0, 20).map((post: any) => ({
            type: 'post',
            id: post.id,
            title: post.title,
            content: post.content,
          }));
          results.push(...postResults);
        }
      } catch (error) {
        // Post search not implemented, skip
      }
    }

    // Search events
    if (filter === 'all' || filter === 'events') {
      try {
        const events = await storage.searchEvents?.(searchQuery);
        if (events) {
          const eventResults = events.slice(0, 20).map((event: any) => ({
            type: 'event',
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
          }));
          results.push(...eventResults);
        }
      } catch (error) {
        // Event search not implemented, skip
      }
    }

    // Sort results by relevance (prioritize exact matches in title/name)
    const sortedResults = results.sort((a, b) => {
      const aTitle = (a.title || a.name || a.displayName || a.username || '').toLowerCase();
      const bTitle = (b.title || b.name || b.displayName || b.username || '').toLowerCase();
      const queryLower = searchQuery.toLowerCase();

      const aExact = aTitle.includes(queryLower) ? 1 : 0;
      const bExact = bTitle.includes(queryLower) ? 1 : 0;

      return bExact - aExact;
    });

    res.json(sortedResults.slice(0, 50)); // Return top 50 results
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json(buildErrorResponse('Search failed', error));
  }
});

export default router;
