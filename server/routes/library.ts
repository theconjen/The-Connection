/**
 * Library Posts API Routes
 * Wikipedia-style curated articles for apologetics and polemics
 *
 * PUBLIC ROUTES:
 * - GET /api/library/posts - List library posts (published only for non-authors)
 * - GET /api/library/posts/:id - Get single library post
 *
 * AUTHOR-ONLY ROUTES (requires canAuthorLibraryPosts permission):
 * - POST /api/library/posts - Create draft library post
 * - PATCH /api/library/posts/:id - Update library post
 * - POST /api/library/posts/:id/publish - Publish library post
 * - DELETE /api/library/posts/:id - Archive library post
 */

import { Router } from 'express';
import { storage } from '../storage-optimized';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId, getSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { z } from 'zod';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const listLibraryPostsSchema = z.object({
  domain: z.enum(['apologetics', 'polemics']).optional(),
  areaId: z.coerce.number().int().positive().optional(),
  tagId: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

const createLibraryPostSchema = z.object({
  domain: z.enum(['apologetics', 'polemics']),
  areaId: z.number().int().positive().nullable().optional(),
  tagId: z.number().int().positive().nullable().optional(),
  title: z.string().min(1).max(500),
  summary: z.string().max(1000).nullable().optional(),
  bodyMarkdown: z.string().min(1),
  perspectives: z.array(z.string()).optional().default([]),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    author: z.string().optional(),
    date: z.string().optional(),
  })).optional().default([]),
});

const updateLibraryPostSchema = z.object({
  domain: z.enum(['apologetics', 'polemics']).optional(),
  areaId: z.number().int().positive().nullable().optional(),
  tagId: z.number().int().positive().nullable().optional(),
  title: z.string().min(1).max(500).optional(),
  summary: z.string().max(1000).nullable().optional(),
  bodyMarkdown: z.string().min(1).optional(),
  perspectives: z.array(z.string()).optional(),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    author: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * GET /api/library/posts
 * List library posts with filtering and pagination
 * - Non-authors only see published posts
 * - Authors see all posts they have permission to view
 */
router.get('/posts', async (req, res) => {
  try {
    const viewerUserId = getSessionUserId(req);
    const params = listLibraryPostsSchema.parse(req.query);

    const posts = await storage.listLibraryPosts(params, viewerUserId);

    res.json({
      posts,
      pagination: {
        limit: params.limit,
        offset: params.offset,
      },
    });
  } catch (error) {
    console.error('Error listing library posts:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json(buildErrorResponse('Invalid query parameters', error));
    }

    res.status(500).json(buildErrorResponse('Error listing library posts', error));
  }
});

/**
 * GET /api/library/posts/:id
 * Get single library post by ID
 * - Non-authors can only view published posts
 * - Authors can view their own drafts
 */
router.get('/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const viewerUserId = getSessionUserId(req);
    const post = await storage.getLibraryPost(postId, viewerUserId);

    if (!post) {
      return res.status(404).json({ error: 'Library post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching library post:', error);
    res.status(500).json(buildErrorResponse('Error fetching library post', error));
  }
});

// ============================================================================
// AUTHOR-ONLY ROUTES
// ============================================================================

/**
 * POST /api/library/posts
 * Create a new draft library post
 * Requires: canAuthorLibraryPosts permission
 */
router.post('/posts', requireAuth, async (req, res) => {
  try {
    const authorUserId = requireSessionUserId(req);

    // Check author permission
    const canAuthor = await storage.canAuthorLibraryPosts(authorUserId);
    if (!canAuthor) {
      return res.status(403).json({
        error: 'Insufficient permissions to author library posts',
      });
    }

    // Validate request body
    const data = createLibraryPostSchema.parse(req.body);

    // Create library post
    const post = await storage.createLibraryPost(data, authorUserId);

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating library post:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json(buildErrorResponse('Invalid request data', error));
    }

    res.status(500).json(buildErrorResponse('Error creating library post', error));
  }
});

/**
 * PATCH /api/library/posts/:id
 * Update an existing library post
 * Requires: canAuthorLibraryPosts permission + ownership
 */
router.patch('/posts/:id', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const authorUserId = requireSessionUserId(req);

    // Check author permission
    const canAuthor = await storage.canAuthorLibraryPosts(authorUserId);
    if (!canAuthor) {
      return res.status(403).json({
        error: 'Insufficient permissions to author library posts',
      });
    }

    // Validate request body
    const data = updateLibraryPostSchema.parse(req.body);

    // Update library post (ownership check happens inside)
    const post = await storage.updateLibraryPost(postId, data, authorUserId);

    if (!post) {
      return res.status(404).json({ error: 'Library post not found or you do not have permission to edit it' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error updating library post:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json(buildErrorResponse('Invalid request data', error));
    }

    res.status(500).json(buildErrorResponse('Error updating library post', error));
  }
});

/**
 * POST /api/library/posts/:id/publish
 * Publish a draft library post
 * Requires: canAuthorLibraryPosts permission + ownership
 */
router.post('/posts/:id/publish', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const authorUserId = requireSessionUserId(req);

    // Check author permission
    const canAuthor = await storage.canAuthorLibraryPosts(authorUserId);
    if (!canAuthor) {
      return res.status(403).json({
        error: 'Insufficient permissions to publish library posts',
      });
    }

    // Publish library post (ownership check happens inside)
    const post = await storage.publishLibraryPost(postId, authorUserId);

    if (!post) {
      return res.status(404).json({ error: 'Library post not found or you do not have permission to publish it' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error publishing library post:', error);
    res.status(500).json(buildErrorResponse('Error publishing library post', error));
  }
});

/**
 * DELETE /api/library/posts/:id
 * Archive a library post (soft delete)
 * Requires: canAuthorLibraryPosts permission + ownership
 */
router.delete('/posts/:id', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const authorUserId = requireSessionUserId(req);

    // Check author permission
    const canAuthor = await storage.canAuthorLibraryPosts(authorUserId);
    if (!canAuthor) {
      return res.status(403).json({
        error: 'Insufficient permissions to delete library posts',
      });
    }

    // Archive library post (ownership check happens inside)
    const success = await storage.deleteLibraryPost(postId, authorUserId);

    if (!success) {
      return res.status(404).json({ error: 'Library post not found or you do not have permission to delete it' });
    }

    res.json({ success: true, message: 'Library post archived successfully' });
  } catch (error) {
    console.error('Error deleting library post:', error);
    res.status(500).json(buildErrorResponse('Error deleting library post', error));
  }
});

export default router;
