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
 * - POST /api/library/posts/:id/publish - Publish library post (rubric-gated)
 * - DELETE /api/library/posts/:id - Archive library post
 * - POST /api/library/posts/:id/evaluate - Dry-run rubric evaluation
 * - POST /api/library/posts/:id/auto-fix - Get auto-fix suggestions
 *
 * ADMIN-ONLY ROUTES:
 * - POST /api/library/posts/:id/force-publish - Force-publish bypassing rubric
 * - POST /api/library/posts/:id/re-evaluate - Re-evaluate published post
 */

import { Router } from 'express';
import { storage } from '../storage-optimized';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId, getSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { z } from 'zod';
import { evaluatePost, generateAutoFix } from '../services/rubricEvaluation';
import { RUBRIC_CONFIG } from '@shared/rubricConfig';
import { createAuditLog } from '../audit-logger';

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

// Schema for creating drafts (more lenient - allows partial content)
const createLibraryPostSchema = z.object({
  domain: z.enum(['apologetics', 'polemics']),
  areaId: z.number().int().positive().nullable().optional(),
  tagId: z.number().int().positive().nullable().optional(),
  title: z.string().min(1).max(500),
  summary: z.string().max(1000).nullable().optional(),
  tldr: z.string().max(2000).nullable().optional(), // Optional for drafts
  keyPoints: z.array(z.string()).max(5).optional().default([]), // Optional for drafts
  scriptureRefs: z.array(z.string()).optional().default([]),
  bodyMarkdown: z.string().optional().default(''), // Optional for drafts
  perspectives: z.array(z.string()).optional().default([]),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    author: z.string().optional(),
    date: z.string().optional(),
  })).optional().default([]),
});

// Schema for publishing (strict - requires all fields for GotQuestions UX)
const publishLibraryPostSchema = z.object({
  tldr: z.string().min(1, 'Quick answer is required for publishing').max(2000),
  keyPoints: z.array(z.string()).min(3, 'At least 3 key points required').max(5, 'Maximum 5 key points'),
  bodyMarkdown: z.string().min(1, 'Body content is required for publishing'),
});

const updateLibraryPostSchema = z.object({
  domain: z.enum(['apologetics', 'polemics']).optional(),
  areaId: z.number().int().positive().nullable().optional(),
  tagId: z.number().int().positive().nullable().optional(),
  title: z.string().min(1).max(500).optional(),
  summary: z.string().max(1000).nullable().optional(),
  tldr: z.string().max(2000).nullable().optional(),
  keyPoints: z.array(z.string()).optional(),
  scriptureRefs: z.array(z.string()).optional(),
  bodyMarkdown: z.string().nullable().optional(),
  perspectives: z.array(z.string()).optional(),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    author: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

const createContributionSchema = z.object({
  type: z.enum(['edit_suggestion', 'additional_perspective', 'add_sources', 'clarification']),
  payload: z.object({
    // Allow different payload structures based on type
    label: z.string().optional(),
    bodyMarkdown: z.string().optional(),
    scriptureRefs: z.array(z.string()).optional(),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
      author: z.string().optional(),
      date: z.string().optional(),
    })).optional(),
    proposedBodyMarkdown: z.string().optional(),
    patchDescription: z.string().optional(),
    section: z.string().optional(),
    clarificationText: z.string().optional(),
  }),
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
 * GET /api/library/posts/trending
 * Get trending/featured library posts based on view count and recency
 * Uses a score combining views and recency for better featured content
 */
router.get('/posts/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const domain = req.query.domain as string | undefined;

    const posts = await storage.getTrendingLibraryPosts(limit, domain);

    res.json({
      posts: {
        items: posts,
        total: posts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching trending library posts:', error);
    res.status(500).json(buildErrorResponse('Error fetching trending library posts', error));
  }
});

/**
 * GET /api/library/posts/:id
 * Get single library post by ID
 * - Non-authors can only view published posts
 * - Authors can view their own drafts
 * - Increments view count for published posts
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

    // Track view for published posts (async, don't block response)
    if (post.status === 'published') {
      storage.incrementLibraryPostViews(postId).catch((err) => {
        console.error('Error incrementing view count:', err);
      });
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
    console.info(`[LIBRARY UPDATE] PATCH /posts/${postId} - request received, body keys:`, Object.keys(req.body));

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const authorUserId = requireSessionUserId(req);
    console.info(`[LIBRARY UPDATE] authorUserId=${authorUserId}, postId=${postId}`);

    // Check author permission
    const canAuthor = await storage.canAuthorLibraryPosts(authorUserId);
    if (!canAuthor) {
      console.info(`[LIBRARY UPDATE] REJECTED - user ${authorUserId} lacks author permission`);
      return res.status(403).json({
        error: 'Insufficient permissions to author library posts',
      });
    }

    // Validate request body
    const data = updateLibraryPostSchema.parse(req.body);
    console.info(`[LIBRARY UPDATE] Zod validation passed, parsed keys:`, Object.keys(data));

    // Update library post (ownership check happens inside)
    const post = await storage.updateLibraryPost(postId, data, authorUserId);

    if (!post) {
      console.info(`[LIBRARY UPDATE] REJECTED - post not found or ownership check failed`);
      return res.status(404).json({ error: 'Library post not found or you do not have permission to edit it' });
    }

    console.info(`[LIBRARY UPDATE] SUCCESS - post ${postId} updated, title="${post.title}", bodyMarkdown length=${post.bodyMarkdown?.length}`);
    res.json(post);
  } catch (error) {
    console.error('[LIBRARY UPDATE] ERROR:', error);

    if (error instanceof z.ZodError) {
      console.error('[LIBRARY UPDATE] Zod validation errors:', JSON.stringify(error.errors));
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

    // Get the post to validate it has required content for publishing
    const existingPost = await storage.getLibraryPost(postId, authorUserId);
    if (!existingPost) {
      return res.status(404).json({ error: 'Library post not found' });
    }

    // Validate required fields for publishing (GotQuestions UX requirements)
    const validationResult = publishLibraryPostSchema.safeParse({
      tldr: existingPost.tldr,
      keyPoints: existingPost.keyPoints,
      bodyMarkdown: existingPost.bodyMarkdown,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message);
      return res.status(400).json({
        error: 'Post is incomplete and cannot be published',
        details: errors,
        message: 'Please complete all required fields before publishing: Quick Answer (TL;DR), 3-5 Key Points, and Detailed Answer.',
      });
    }

    // Rubric evaluation only applies to user 19 (research team) posts.
    // Other apologists are not held to the rubric standard.
    const isResearchTeam = existingPost.authorUserId === 19;
    let auditReport = null;

    if (isResearchTeam) {
      auditReport = await evaluatePost(existingPost, RUBRIC_CONFIG);

      // Store the evaluation result on the post
      await storage.updateLibraryPost(postId, {
        rubricVersion: auditReport.version,
        rubricScore: auditReport.totalScore,
        rubricReport: auditReport,
      }, authorUserId);

      if (!auditReport.passed) {
        return res.status(422).json({
          error: 'Rubric evaluation failed',
          auditReport,
        });
      }
    }

    // Publish library post (ownership check happens inside)
    const post = await storage.publishLibraryPost(postId, authorUserId);

    if (!post) {
      return res.status(404).json({ error: 'Library post not found or you do not have permission to publish it' });
    }

    // Set rubricPassedAt on the published post (only if rubric was run)
    if (isResearchTeam && auditReport) {
      await storage.updateLibraryPost(postId, {
        rubricPassedAt: new Date(),
      }, authorUserId);
    }

    res.json({ ...post, ...(auditReport ? { rubricPassedAt: new Date(), auditReport } : {}) });
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

// ============================================================================
// RUBRIC EVALUATION ROUTES
// ============================================================================

/**
 * POST /api/library/posts/:id/evaluate
 * Dry-run rubric evaluation (does not change post status)
 * Requires: canAuthorLibraryPosts permission
 */
router.post('/posts/:id/evaluate', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const userId = requireSessionUserId(req);

    const canAuthor = await storage.canAuthorLibraryPosts(userId);
    if (!canAuthor) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const existingPost = await storage.getLibraryPost(postId, userId);
    if (!existingPost) {
      return res.status(404).json({ error: 'Library post not found' });
    }

    const auditReport = await evaluatePost(existingPost, RUBRIC_CONFIG);

    // Persist the evaluation result on the post record
    await storage.updateLibraryPost(postId, {
      rubricVersion: auditReport.version,
      rubricScore: auditReport.totalScore,
      rubricReport: auditReport,
    }, userId);

    res.json({ auditReport });
  } catch (error) {
    console.error('Error evaluating library post:', error);
    res.status(500).json(buildErrorResponse('Error evaluating library post', error));
  }
});

/**
 * POST /api/library/posts/:id/auto-fix
 * Generate auto-fix suggestions for a failing post
 * Requires: canAuthorLibraryPosts permission
 */
router.post('/posts/:id/auto-fix', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const userId = requireSessionUserId(req);

    const canAuthor = await storage.canAuthorLibraryPosts(userId);
    if (!canAuthor) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const existingPost = await storage.getLibraryPost(postId, userId);
    if (!existingPost) {
      return res.status(404).json({ error: 'Library post not found' });
    }

    // Use the latest rubric report stored on the post
    const latestReport = existingPost.rubricReport;
    if (!latestReport) {
      return res.status(400).json({ error: 'No rubric evaluation found. Run evaluation first.' });
    }

    const suggestions = await generateAutoFix(existingPost, latestReport as any, RUBRIC_CONFIG);

    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating auto-fix suggestions:', error);
    res.status(500).json(buildErrorResponse('Error generating auto-fix suggestions', error));
  }
});

/**
 * POST /api/library/posts/:id/force-publish
 * Admin force-publish bypassing rubric score
 * Requires: admin role or userId 19
 */
router.post('/posts/:id/force-publish', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const userId = requireSessionUserId(req);

    // Admin check
    const user = await storage.getUser(userId);
    const isAdmin = user?.role === 'admin' || userId === 19;
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can force-publish posts' });
    }

    const { reason } = z.object({ reason: z.string().min(1, 'Override reason is required') }).parse(req.body);

    const existingPost = await storage.getLibraryPost(postId, userId);
    if (!existingPost) {
      return res.status(404).json({ error: 'Library post not found' });
    }

    // Publish the post
    const post = await storage.publishLibraryPost(postId, userId);
    if (!post) {
      return res.status(404).json({ error: 'Failed to publish post' });
    }

    // Set override fields
    await storage.updateLibraryPost(postId, {
      rubricReviewedBy: userId,
      rubricOverrideReason: reason,
      rubricPassedAt: new Date(),
    }, userId);

    // Audit log
    await createAuditLog({
      userId,
      username: user?.username || 'unknown',
      action: 'admin_action',
      entityType: 'library_post',
      entityId: postId,
      status: 'success',
      details: {
        adminAction: 'force_publish',
        reason,
        rubricScore: existingPost.rubricScore,
      },
      req,
    });

    res.json({ ...post, rubricOverrideReason: reason, rubricReviewedBy: userId });
  } catch (error) {
    console.error('Error force-publishing library post:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json(buildErrorResponse('Invalid request data', error));
    }

    res.status(500).json(buildErrorResponse('Error force-publishing library post', error));
  }
});

/**
 * POST /api/library/posts/:id/re-evaluate
 * Re-evaluate an already-published post (admin only, informational)
 * Does NOT unpublish the post
 */
router.post('/posts/:id/re-evaluate', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const userId = requireSessionUserId(req);

    // Admin check
    const user = await storage.getUser(userId);
    const isAdmin = user?.role === 'admin' || userId === 19;
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can re-evaluate published posts' });
    }

    const existingPost = await storage.getLibraryPost(postId, userId);
    if (!existingPost) {
      return res.status(404).json({ error: 'Library post not found' });
    }

    const auditReport = await evaluatePost(existingPost, RUBRIC_CONFIG);

    // Update rubric fields without changing publish status
    await storage.updateLibraryPost(postId, {
      rubricVersion: auditReport.version,
      rubricScore: auditReport.totalScore,
      rubricReport: auditReport,
    }, userId);

    res.json({ auditReport });
  } catch (error) {
    console.error('Error re-evaluating library post:', error);
    res.status(500).json(buildErrorResponse('Error re-evaluating library post', error));
  }
});

// ============================================================================
// CONTRIBUTION ROUTES
// ============================================================================

/**
 * POST /api/library/posts/:id/contributions
 * Create a contribution to a library post
 * Requires: canAuthorLibraryPosts permission (verified apologists only)
 */
router.post('/posts/:id/contributions', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const contributorUserId = requireSessionUserId(req);

    // Check contributor permission
    const canContribute = await storage.canAuthorLibraryPosts(contributorUserId);
    if (!canContribute) {
      return res.status(403).json({
        error: 'Insufficient permissions to contribute to library posts',
      });
    }

    // Validate request body
    const data = createContributionSchema.parse(req.body);

    // Create contribution
    const contribution = await storage.createContribution(postId, contributorUserId, data);

    res.status(201).json(contribution);
  } catch (error) {
    console.error('Error creating contribution:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json(buildErrorResponse('Invalid request data', error));
    }

    res.status(500).json(buildErrorResponse('Error creating contribution', error));
  }
});

/**
 * GET /api/library/posts/:id/contributions
 * List contributions for a library post
 * PUBLIC: Only shows approved contributions
 * EDITORS (userId 19): Shows all contributions
 */
router.get('/posts/:id/contributions', async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const userId = getSessionUserId(req);
    const isEditor = userId === 19; // Only user 19 (admin) can see all contributions

    let contributions = await storage.listContributions(postId);

    // Non-editors can only see approved contributions
    if (!isEditor) {
      contributions = contributions.filter(c => c.status === 'approved');
    }

    res.json(contributions);
  } catch (error) {
    console.error('Error listing contributions:', error);
    res.status(500).json(buildErrorResponse('Error listing contributions', error));
  }
});

/**
 * POST /api/library/contributions/:id/approve
 * Approve a contribution
 * Requires: User 19 only (admin)
 */
router.post('/contributions/:id/approve', requireAuth, async (req, res) => {
  try {
    const contributionId = parseInt(req.params.id, 10);

    if (isNaN(contributionId)) {
      return res.status(400).json({ error: 'Invalid contribution ID' });
    }

    const reviewerUserId = requireSessionUserId(req);

    // Only user 19 can approve
    if (reviewerUserId !== 19) {
      return res.status(403).json({
        error: 'Unauthorized: only admin can approve contributions',
      });
    }

    const contribution = await storage.approveContribution(contributionId, reviewerUserId);

    res.json(contribution);
  } catch (error) {
    console.error('Error approving contribution:', error);
    res.status(500).json(buildErrorResponse('Error approving contribution', error));
  }
});

/**
 * POST /api/library/contributions/:id/reject
 * Reject a contribution
 * Requires: User 19 only (admin)
 */
router.post('/contributions/:id/reject', requireAuth, async (req, res) => {
  try {
    const contributionId = parseInt(req.params.id, 10);

    if (isNaN(contributionId)) {
      return res.status(400).json({ error: 'Invalid contribution ID' });
    }

    const reviewerUserId = requireSessionUserId(req);

    // Only user 19 can reject
    if (reviewerUserId !== 19) {
      return res.status(403).json({
        error: 'Unauthorized: only admin can reject contributions',
      });
    }

    const contribution = await storage.rejectContribution(contributionId, reviewerUserId);

    res.json(contribution);
  } catch (error) {
    console.error('Error rejecting contribution:', error);
    res.status(500).json(buildErrorResponse('Error rejecting contribution', error));
  }
});

/**
 * POST /api/library/questions/:questionId/publish
 * Publish a user question as a library post
 * Requires: Apologist permission (canAuthorApologeticsPosts)
 */
router.post('/questions/:questionId/publish', requireAuth, async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);

    if (isNaN(questionId)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const userId = requireSessionUserId(req);

    // Check if user has apologist permissions
    const user = await storage.getUser(userId);
    if (!user || !user.canAuthorApologeticsPosts) {
      return res.status(403).json({
        error: 'Unauthorized: you must be an apologist to publish library posts',
      });
    }

    // Validate the article data
    const articleData = createLibraryPostSchema.parse(req.body);

    // Get the user question
    const question = await storage.getUserQuestionById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if already published (DB-level protection via UNIQUE constraint)
    if (question.publishedPostId) {
      return res.status(400).json({
        error: 'This question is already published as an article.',
        publishedPostId: question.publishedPostId,
      });
    }

    // Create the library post
    const libraryPost = await storage.createLibraryPost({
      ...articleData,
      authorUserId: userId,
      authorDisplayName: 'Connection Research Team',
      status: 'published',
      level: 'intermediate',
    });

    // Link the question to the library post
    await storage.updateUserQuestion(questionId, {
      publishedPostId: libraryPost.id,
      status: 'answered',
    });

    res.status(201).json({
      libraryPost,
      message: 'Question successfully published as library post',
    });
  } catch (error) {
    console.error('Error publishing user question:', error);
    res.status(500).json(buildErrorResponse('Error publishing user question', error));
  }
});

export default router;
