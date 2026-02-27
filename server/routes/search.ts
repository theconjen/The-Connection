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

    // Search advice posts (microblogs with topic=QUESTION)
    if (filter === 'all' || filter === 'advice') {
      try {
        const advicePosts = await storage.searchMicroblogs?.(searchQuery, { topic: 'QUESTION', limit: 20 });
        if (advicePosts) {
          const adviceResults = await Promise.all(advicePosts.map(async (post: any) => {
            const author = await storage.getUser(post.authorId);
            return {
              type: 'advice',
              id: post.id,
              content: post.content,
              authorId: post.authorId,
              anonymousNickname: post.anonymousNickname,
              createdAt: post.createdAt,
              likeCount: post.likeCount || 0,
              replyCount: post.replyCount || 0,
              author: author ? {
                id: author.id,
                username: author.username,
                displayName: author.displayName,
                avatarUrl: author.avatarUrl,
              } : null,
            };
          }));
          results.push(...adviceResults);
        }
      } catch (error) {
        // Advice search not implemented, skip
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

// ============================================================================
// SEARCH HISTORY & SUGGESTIONS
// ============================================================================

// Get search suggestions (prefix matches from popular past searches + top entities)
router.get('/suggestions', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    const prefix = String(q || '').trim().toLowerCase();

    if (!prefix || prefix.length < 1) {
      return res.json([]);
    }

    const { db } = await import('../db');
    const { searchHistory } = await import('@shared/schema');
    const { sql, desc, ilike } = await import('drizzle-orm');

    // Get popular past searches matching the prefix
    const popularSearches = await db
      .select({
        query: searchHistory.query,
        count: sql<number>`count(*)`,
      })
      .from(searchHistory)
      .where(ilike(searchHistory.query, `${prefix}%`))
      .groupBy(searchHistory.query)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const suggestions = popularSearches.map(s => ({
      type: 'search' as const,
      text: s.query,
      popularity: Number(s.count),
    }));

    res.json(suggestions);
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.json([]);
  }
});

// Get user's search history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { db } = await import('../db');
    const { searchHistory } = await import('@shared/schema');
    const { eq, desc } = await import('drizzle-orm');

    const history = await db
      .select({
        id: searchHistory.id,
        query: searchHistory.query,
        searchType: searchHistory.searchType,
        resultCount: searchHistory.resultCount,
        createdAt: searchHistory.createdAt,
      })
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(10);

    res.json(history);
  } catch (error) {
    console.error('Search history error:', error);
    res.status(500).json(buildErrorResponse('Failed to get search history', error));
  }
});

// Log a search (called when user submits search)
router.post('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { query, searchType, resultCount } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const { db } = await import('../db');
    const { searchHistory } = await import('@shared/schema');

    await db.insert(searchHistory).values({
      userId,
      query: query.trim().toLowerCase(),
      searchType: searchType || 'all',
      resultCount: resultCount || 0,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Log search error:', error);
    res.status(500).json(buildErrorResponse('Failed to log search', error));
  }
});

// Clear user's search history
router.delete('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { db } = await import('../db');
    const { searchHistory } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    await db.delete(searchHistory).where(eq(searchHistory.userId, userId));

    res.json({ success: true, message: 'Search history cleared' });
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json(buildErrorResponse('Failed to clear search history', error));
  }
});

export default router;
