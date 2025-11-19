import { Router } from 'express';
import { insertPostSchema, insertCommentSchema } from '@shared/schema';
import { isAuthenticated } from '../auth';
import { storage } from '../storage-optimized';
import { getSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

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
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json(buildErrorResponse('Error fetching posts', error));
  }
});

router.get('/api/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await storage.getPost(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json(buildErrorResponse('Error fetching post', error));
  }
});

// Accept { text, communityId? } and map to schema fields
router.post('/api/posts', isAuthenticated, async (req, res) => {
  try {
    const userId = getSessionUserId(req)!;
    const { text, communityId } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ message: 'text required' });
    const content = text.trim();
    if (content.length === 0 || content.length > 500) return res.status(400).json({ message: 'text must be 1-500 chars' });

    // Map to schema: title from first 60 chars, content is full text
    const payload = {
      title: content.slice(0, 60),
      content,
      imageUrl: null,
      communityId: communityId ? Number(communityId) : null,
      groupId: null,
      authorId: userId,
    };
    const validatedData = insertPostSchema.parse(payload as any);
    const post = await storage.createPost(validatedData);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json(buildErrorResponse('Error creating post', error));
  }
});

router.post('/api/posts/:id/upvote', isAuthenticated, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
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

router.post('/api/comments', isAuthenticated, async (req, res) => {
  try {
    const userId = getSessionUserId(req)!;
    const validatedData = insertCommentSchema.parse({ ...req.body, authorId: userId });
    const comment = await storage.createComment(validatedData);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json(buildErrorResponse('Error creating comment', error));
  }
});

router.post('/api/comments/:id/upvote', isAuthenticated, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const result = await storage.toggleCommentVote(commentId, userId);
    res.json({ ...result.comment, userHasUpvoted: result.voted });
  } catch (error) {
    console.error('Error toggling comment upvote:', error);
    res.status(500).json(buildErrorResponse('Error toggling comment upvote', error));
  }
});

export default router;
