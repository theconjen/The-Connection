/**
 * Public API endpoints for shareable content previews
 *
 * These endpoints do NOT require authentication and return safe subsets
 * of content for public preview pages and OpenGraph meta tags.
 *
 * Canonical URLs:
 * - /a/:slugOrId -> Apologetics article
 * - /e/:eventId -> Event
 * - /p/:postId -> Post
 * - /u/:username -> Profile
 *
 * Security:
 * - Rate limited to prevent abuse
 * - Cached for performance
 * - No sensitive data exposed
 */

import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage-optimized';
import { buildErrorResponse } from '../utils/errors';
import rateLimit from 'express-rate-limit';

const router = Router();

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Rate limiter for public API endpoints
 * More permissive than authenticated endpoints since these are for sharing
 */
const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 60, // 60 requests per minute per IP
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For for clients behind proxies
    return req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || 'unknown';
  },
});

// Apply rate limiter to all public API routes
router.use('/api/public', publicApiLimiter);

// =============================================================================
// CACHE HEADERS MIDDLEWARE
// =============================================================================

/**
 * Add cache headers to public API responses
 * Content is cacheable since it's public and doesn't change frequently
 */
function addCacheHeaders(req: Request, res: Response, next: NextFunction) {
  // Cache for 5 minutes, allow stale content for 1 hour while revalidating
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  // Add Vary header for proper caching with different Accept headers
  res.setHeader('Vary', 'Accept, Accept-Encoding');
  next();
}

router.use('/api/public', addCacheHeaders);

// =============================================================================
// APOLOGETICS PUBLIC PREVIEW
// =============================================================================

/**
 * GET /api/public/apologetics/:idOrSlug
 *
 * Returns a safe subset of an apologetics article for public preview:
 * - title, quickAnswer (full), first 2 key points, sources count
 * - Does NOT expose drafts, private notes, or internal fields
 */
router.get('/api/public/apologetics/:idOrSlug', async (req, res) => {
  try {
    const idOrSlug = req.params.idOrSlug;

    // Try to parse as ID first, then fall back to slug lookup
    let resource;
    const numericId = parseInt(idOrSlug, 10);

    if (!isNaN(numericId)) {
      resource = await storage.getApologeticsResource(numericId);
    }

    // If not found by ID or not a number, try by slug
    if (!resource) {
      resource = await storage.getApologeticsResourceBySlug?.(idOrSlug);
    }

    if (!resource) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check if published (if there's a status field)
    if ((resource as any).status && (resource as any).status !== 'published') {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Build safe public preview
    const keyPoints = (resource as any).keyPoints || [];
    const sources = (resource as any).sources || [];

    const publicPreview = {
      id: resource.id,
      slug: (resource as any).slug || `apologetics-${resource.id}`,
      title: resource.title,
      quickAnswer: (resource as any).quickAnswer || (resource as any).summary || resource.content?.substring(0, 500),
      keyPointsPreview: keyPoints.slice(0, 2),
      keyPointsTotal: keyPoints.length,
      sourcesCount: sources.length,
      hasVerifiedSources: sources.length > 0,
      category: resource.category,
      authorDisplayName: (resource as any).authorDisplayName || 'The Connection Team',
      updatedAt: (resource as any).updatedAt || resource.createdAt,
      ogImageUrl: (resource as any).imageUrl || null,
      // UTM tracking info
      shareUrl: `https://theconnection.app/a/${(resource as any).slug || resource.id}`,
    };

    res.json(publicPreview);
  } catch (error) {
    console.error('Error fetching public apologetics:', error);
    res.status(500).json(buildErrorResponse('Error fetching article', error));
  }
});

// =============================================================================
// EVENT PUBLIC PREVIEW
// =============================================================================

/**
 * GET /api/public/events/:eventId
 *
 * Returns a safe subset of event data for public preview:
 * - title, date/time, city-level location, description, host name
 * - Does NOT expose exact address unless explicitly allowed
 */
router.get('/api/public/events/:eventId', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);

    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await storage.getEvent(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event is public (for sharing)
    // If isPrivate is true, don't expose the event publicly
    if ((event as any).isPrivate === true) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get host/creator info
    let hostName = 'The Connection';
    if ((event as any).creatorId) {
      const creator = await storage.getUser((event as any).creatorId);
      if (creator) {
        hostName = creator.displayName || creator.username || 'The Connection';
      }
    }

    // Determine location display (city-level only for public)
    const locationDisplay = [
      (event as any).city,
      (event as any).state,
    ].filter(Boolean).join(', ') || (event as any).isVirtual ? 'Online Event' : 'Location TBD';

    // Build safe public preview
    const publicPreview = {
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: (event as any).eventDate,
      startTime: (event as any).startTime,
      endTime: (event as any).endTime,
      startsAt: (event as any).startsAt, // Legacy format support
      endsAt: (event as any).endsAt,
      locationDisplay,
      city: (event as any).city,
      state: (event as any).state,
      isVirtual: (event as any).isVirtual || false,
      isOnline: (event as any).isOnline || (event as any).isVirtual || false,
      hostName,
      category: (event as any).category,
      imageUrl: (event as any).imageUrl || (event as any).posterUrl || null,
      // Only show address if explicitly marked as public
      showAddress: (event as any).showPublicAddress === true,
      address: (event as any).showPublicAddress === true ? (event as any).address : null,
      // Share URL
      shareUrl: `https://theconnection.app/e/${event.id}`,
    };

    res.json(publicPreview);
  } catch (error) {
    console.error('Error fetching public event:', error);
    res.status(500).json(buildErrorResponse('Error fetching event', error));
  }
});

// =============================================================================
// POST PUBLIC PREVIEW
// =============================================================================

/**
 * GET /api/public/posts/:postId
 *
 * Returns a safe subset of post data for public preview:
 * - title, content preview, author, engagement counts
 */
router.get('/api/public/posts/:postId', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await storage.getPost(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if post is deleted
    if ((post as any).deletedAt) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get author info
    let authorName = 'Anonymous';
    let authorAvatar = null;
    let authorUsername = null;
    if (post.userId) {
      const author = await storage.getUser(post.userId);
      if (author) {
        authorName = author.displayName || author.username || 'Anonymous';
        authorAvatar = author.avatarUrl;
        authorUsername = author.username;
      }
    }

    // Build safe public preview
    const contentPreview = post.content?.substring(0, 300) + (post.content?.length > 300 ? '...' : '');

    const publicPreview = {
      id: post.id,
      title: post.title,
      contentPreview,
      fullContent: post.content, // For OG description
      authorName,
      authorUsername,
      authorAvatar,
      createdAt: post.createdAt,
      likeCount: (post as any).upvotes || (post as any).likeCount || 0,
      commentCount: (post as any).commentCount || 0,
      imageUrl: (post as any).imageUrl || null,
      // Share URL
      shareUrl: `https://theconnection.app/p/${post.id}`,
    };

    res.json(publicPreview);
  } catch (error) {
    console.error('Error fetching public post:', error);
    res.status(500).json(buildErrorResponse('Error fetching post', error));
  }
});

// =============================================================================
// PROFILE PUBLIC PREVIEW
// =============================================================================

/**
 * GET /api/public/users/:username
 *
 * Returns a safe subset of user profile for public preview:
 * - avatar, displayName, username, bio, public location/church
 * - counts: posts, followers, following
 * - up to 3 recent public posts (if profile is public)
 */
router.get('/api/public/users/:username', async (req, res) => {
  try {
    const username = req.params.username;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    // Get user by username
    const user = await storage.getUserByUsername(username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if profile is private
    const isPrivate = (user as any).profileVisibility === 'private' ||
                      (user as any).isPrivate === true;

    // Get follower/following counts
    let followerCount = 0;
    let followingCount = 0;
    let postCount = 0;

    try {
      const followers = await storage.getFollowers?.(user.id);
      followerCount = followers?.length || 0;
    } catch {}

    try {
      const following = await storage.getFollowing?.(user.id);
      followingCount = following?.length || 0;
    } catch {}

    // Get recent public posts (only if profile is public)
    let recentPosts: any[] = [];
    if (!isPrivate) {
      try {
        const userPosts = await storage.getPostsByUser?.(user.id) || [];
        recentPosts = userPosts
          .filter((p: any) => !p.deletedAt)
          .slice(0, 3)
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            contentPreview: p.content?.substring(0, 100) + (p.content?.length > 100 ? '...' : ''),
            createdAt: p.createdAt,
          }));
        postCount = userPosts.filter((p: any) => !p.deletedAt).length;
      } catch {}
    }

    // Build safe public preview
    const publicPreview = {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatarUrl: user.avatarUrl || null,
      bio: isPrivate ? null : (user as any).bio || null,
      isPrivate,
      // Only show location/church if profile is public and user allows
      churchName: isPrivate ? null : (user as any).churchName || null,
      locationDisplay: isPrivate ? null : [
        (user as any).city,
        (user as any).state,
      ].filter(Boolean).join(', ') || null,
      denomination: isPrivate ? null : (user as any).denomination || null,
      // Counts (always visible)
      counts: {
        posts: postCount,
        followers: followerCount,
        following: followingCount,
      },
      // Recent posts (only if public)
      recentPublicPosts: recentPosts,
      // Share URL
      shareUrl: `https://theconnection.app/u/${user.username}`,
    };

    res.json(publicPreview);
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json(buildErrorResponse('Error fetching profile', error));
  }
});

export default router;
