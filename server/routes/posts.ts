import { Router } from 'express';
import { z } from 'zod/v4';
import { insertPostSchema, insertCommentSchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage as defaultStorage } from '../storage-optimized';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { contentCreationLimiter, messageCreationLimiter } from '../rate-limiters';

const MAX_TITLE_LENGTH = 60;

const postRequestSchema = z.object({
  text: z.string().trim().min(1, 'text must be between 1 and 10,000 characters').max(10000, 'text must be between 1 and 10,000 characters'),
  title: z.string().trim().max(MAX_TITLE_LENGTH, `title must be at most ${MAX_TITLE_LENGTH} characters`).optional(),
  communityId: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    })
    .refine((value) => value === null || (typeof value === 'number' && Number.isInteger(value) && value > 0), {
      message: 'communityId must be a positive integer'
    }),
  isAnonymous: z.boolean().optional().default(false),
});

const resolvePostPayload = (input: unknown, authorId: number) => {
  const parsed = postRequestSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error };

  const { text, title, communityId, isAnonymous } = parsed.data;
  const resolvedTitle = (title ?? text).trim();

  if (resolvedTitle.length > MAX_TITLE_LENGTH) {
    const error = new z.ZodError([
      {
        code: z.ZodIssueCode.too_big,
        maximum: MAX_TITLE_LENGTH,
        inclusive: true,
        message: `title must be at most ${MAX_TITLE_LENGTH} characters`,
        path: ['title']
      }
    ] as any);
    return { success: false as const, error };
  }

  return {
    success: true as const,
    payload: {
      title: resolvedTitle,
      content: text,
      imageUrl: null,
      communityId,
      groupId: null,
      authorId,
      isAnonymous: isAnonymous || false,
    }
  };
};

// Helper function to mask author info for anonymous posts
const sanitizePostForAnonymity = (post: any) => {
  if (post.isAnonymous) {
    return {
      ...post,
      author: {
        id: null,
        username: 'Anonymous',
        displayName: 'Anonymous',
        avatarUrl: null,
        profileImageUrl: null,
      },
      authorId: null,
    };
  }
  return post;
};

export function createPostsRouter(storage = defaultStorage) {
  const router = Router();

  router.get('/api/posts', async (req, res) => {
    try {
      const filter = req.query.filter as string;
      const userId = getSessionUserId(req);
      let posts = await storage.getAllPosts(filter);
      if (userId) {
        const blockedIds = await storage.getBlockedUserIdsFor(userId);
        if (blockedIds && blockedIds.length > 0) {
          posts = posts.filter((p: any) => !blockedIds.includes(p.authorId));
        }
      }

      // Filter out posts from private accounts (unless it's the user's own post)
      posts = posts.filter((p: any) => {
        // User can see their own posts
        if (userId && p.authorId === userId) return true;
        // Hide posts from private accounts
        if (p.author?.profileVisibility === 'private') return false;
        return true;
      });

      // Sanitize anonymous posts to hide author information
      posts = posts.map((p: any) => sanitizePostForAnonymity(p));

      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json(buildErrorResponse('Error fetching posts', error));
    }
  });

  router.get('/api/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = getSessionUserId(req);
    let post = await storage.getPost(postId);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check privacy: private account posts are only visible to the author
    if (post.author?.profileVisibility === 'private' && (!userId || post.authorId !== userId)) {
      return res.status(403).json({ message: 'This post is not available' });
    }

    // Sanitize anonymous posts to hide author information
    post = sanitizePostForAnonymity(post);

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json(buildErrorResponse('Error fetching post', error));
  }
  });

  // Accept { text, communityId? } and map to schema fields
  router.post('/api/posts', contentCreationLimiter, requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const result = resolvePostPayload(req.body, userId);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0]?.message ?? 'Invalid post payload' });
    }

    const validatedData = insertPostSchema.parse(result.payload as any);
    const post = await storage.createPost(validatedData);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json(buildErrorResponse('Error creating post', error));
  }
  });

  router.post('/api/posts/:id/upvote', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    const result = await storage.togglePostVote(postId, userId);
    res.json({ ...result.post, userHasUpvoted: result.voted });
  } catch (error) {
    console.error('Error toggling post upvote:', error);
    res.status(500).json(buildErrorResponse('Error toggling post upvote', error));
  }
  });

  router.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const comments = await storage.getCommentsByPostId(postId);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json(buildErrorResponse('Error fetching comments', error));
  }
  });

  router.post('/api/comments', messageCreationLimiter, requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const validatedData = insertCommentSchema.parse({ ...req.body, authorId: userId });
    const comment = await storage.createComment(validatedData);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json(buildErrorResponse('Error creating comment', error));
  }
  });

  router.post('/api/comments/:id/upvote', requireAuth, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const result = await storage.toggleCommentVote(commentId, userId);
    res.json({ ...result.comment, userHasUpvoted: result.voted });
  } catch (error) {
    console.error('Error toggling comment upvote:', error);
    res.status(500).json(buildErrorResponse('Error toggling comment upvote', error));
  }
  });

  // PATCH /api/posts/:id - Update own post
  router.patch('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);

    const postId = parseInt(req.params.id);
    if (!Number.isFinite(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    // Verify ownership
    const existingPost = await storage.getPost(postId);
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (existingPost.authorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    // Update post
    const result = resolvePostPayload(req.body, userId);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0]?.message ?? 'Invalid post payload' });
    }

    const updatedPost = await storage.updatePost(postId, {
      title: result.payload.title,
      content: result.payload.content,
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json(buildErrorResponse('Error updating post', error));
  }
  });

  // DELETE /api/posts/:id - Delete own post
  router.delete('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);

    const postId = parseInt(req.params.id);
    if (!Number.isFinite(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    // Verify ownership
    const existingPost = await storage.getPost(postId);
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (existingPost.authorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete post (soft delete)
    await storage.deletePost(postId);
    res.json({ ok: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json(buildErrorResponse('Error deleting post', error));
  }
  });

  return router;
  }

  export default createPostsRouter();
