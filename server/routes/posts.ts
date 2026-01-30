import { Router } from 'express';
import { z } from 'zod/v4';
import { insertPostSchema, insertCommentSchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage as defaultStorage } from '../storage-optimized';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { contentCreationLimiter, messageCreationLimiter } from '../rate-limiters';
import { notifyCommunityMembers, notifyUserWithPreferences, truncateText, getUserDisplayName } from '../services/notificationHelper';
import { sortPostsByFeedScore } from '../algorithms/christianFeedScoring';
import { detectLanguage } from '../services/languageDetection';
import { trackEngagement } from '../services/engagementTracking';
import { broadcastEngagementUpdate } from '../socketInstance';

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

  // Get trending hashtags for posts (MUST be before /api/posts/:id route)
  router.get('/posts/hashtags/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await storage.getTrendingHashtags(Math.min(limit, 20));
      res.json(trending);
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      res.status(500).json(buildErrorResponse('Error fetching trending hashtags', error));
    }
  });

  // Get posts by hashtag (MUST be before /api/posts/:id route)
  router.get('/posts/hashtags/:tag', async (req, res) => {
    try {
      const { tag } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = getSessionUserId(req);

      let posts = await storage.getPostsByHashtag(tag, Math.min(limit, 50));

      // Filter blocked users
      if (userId) {
        const blockedIds = await storage.getBlockedUserIdsFor(userId);
        if (blockedIds && blockedIds.length > 0) {
          posts = posts.filter((p: any) => !blockedIds.includes(p.authorId));
        }
      }

      // Enrich posts with author data
      const enrichedPosts = await Promise.all(
        posts.map(async (post: any) => {
          const author = await storage.getUser(post.authorId);
          return {
            ...sanitizePostForAnonymity({
              ...post,
              author: author ? {
                id: author.id,
                username: author.username,
                displayName: author.displayName,
                avatarUrl: author.profileImageUrl,
              } : {
                id: post.authorId,
                username: 'deleted',
                displayName: 'Deleted User',
                avatarUrl: null,
              },
            }),
          };
        })
      );

      res.json(enrichedPosts);
    } catch (error) {
      console.error('Error fetching posts by hashtag:', error);
      res.status(500).json(buildErrorResponse('Error fetching posts by hashtag', error));
    }
  });

  // Get trending keywords for posts (MUST be before /api/posts/:id route)
  router.get('/posts/keywords/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await storage.getTrendingKeywords(Math.min(limit, 20));
      res.json(trending);
    } catch (error) {
      console.error('Error fetching trending keywords:', error);
      res.status(500).json(buildErrorResponse('Error fetching trending keywords', error));
    }
  });

  // Get posts by keyword (MUST be before /api/posts/:id route)
  router.get('/posts/keywords/:keyword', async (req, res) => {
    try {
      const { keyword } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = getSessionUserId(req);

      let posts = await storage.getPostsByKeyword(keyword, Math.min(limit, 50));

      // Filter blocked users
      if (userId) {
        const blockedIds = await storage.getBlockedUserIdsFor(userId);
        if (blockedIds && blockedIds.length > 0) {
          posts = posts.filter((p: any) => !blockedIds.includes(p.authorId));
        }
      }

      // Enrich posts with author data
      const enrichedPosts = await Promise.all(
        posts.map(async (post: any) => {
          const author = await storage.getUser(post.authorId);
          return {
            ...sanitizePostForAnonymity({
              ...post,
              author: author ? {
                id: author.id,
                username: author.username,
                displayName: author.displayName,
                avatarUrl: author.profileImageUrl,
              } : {
                id: post.authorId,
                username: 'deleted',
                displayName: 'Deleted User',
                avatarUrl: null,
              },
            }),
          };
        })
      );

      res.json(enrichedPosts);
    } catch (error) {
      console.error('Error fetching posts by keyword:', error);
      res.status(500).json(buildErrorResponse('Error fetching posts by keyword', error));
    }
  });

  // Get combined trending (hashtags + keywords) for posts (MUST be before /posts/:id route)
  router.get('/posts/trending/combined', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const halfLimit = Math.ceil(limit / 2);

      // Get top hashtags and keywords
      const [hashtags, keywords] = await Promise.all([
        storage.getTrendingHashtags(halfLimit),
        storage.getTrendingKeywords(halfLimit),
      ]);

      // Combine and sort by trending score
      const combined = [
        ...hashtags.map(h => ({ type: 'hashtag', ...h })),
        ...keywords.map(k => ({ type: 'keyword', ...k })),
      ].sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
        .slice(0, limit);

      res.json(combined);
    } catch (error) {
      console.error('Error fetching combined trending:', error);
      res.status(500).json(buildErrorResponse('Error fetching combined trending', error));
    }
  });

  router.get('/posts', async (req, res) => {
    try {
      const filter = req.query.filter as string;
      const userId = getSessionUserId(req);
      let posts: any[] = [];

      if (userId) {
        if (filter === 'popular') {
          // Popular: mix of followed users' posts + most popular posts
          const [followingPosts, allPosts] = await Promise.all([
            storage.getFollowingPosts(userId),
            storage.getAllPosts(filter)
          ]);

          if (followingPosts.length === 0) {
            // Not following anyone: show all posts scored by algorithm
            posts = allPosts;
          } else {
            // Combine followed posts + top popular posts
            const followingSet = new Set(followingPosts.map(p => p.id));
            const popularPosts = sortPostsByFeedScore(allPosts.filter(p => !followingSet.has(p.id))).slice(0, 20);
            posts = [...followingPosts, ...popularPosts];
          }
        } else {
          // Recent: show posts from followed users, or all posts if not following anyone
          const followingPosts = await storage.getFollowingPosts(userId);

          if (followingPosts.length === 0) {
            // Not following anyone: show all posts
            posts = await storage.getAllPosts(filter);
          } else {
            posts = followingPosts;
          }
        }

        const blockedIds = await storage.getBlockedUserIdsFor(userId);
        if (blockedIds && blockedIds.length > 0) {
          posts = posts.filter((p: any) => !blockedIds.includes(p.authorId));
        }
      } else {
        // Not logged in: show all posts
        posts = await storage.getAllPosts(filter);
      }

      // Enrich posts with author data
      posts = await Promise.all(
        posts.map(async (post: any) => {
          const author = await storage.getUser(post.authorId);
          return {
            ...post,
            author: author ? {
              id: author.id,
              username: author.username,
              displayName: author.displayName,
              avatarUrl: author.profileImageUrl,
              profileVisibility: author.profileVisibility,
            } : {
              id: post.authorId,
              username: 'deleted',
              displayName: 'Deleted User',
              avatarUrl: null,
            },
          };
        })
      );

      // Filter out posts from private accounts (unless it's the user's own post)
      posts = posts.filter((p: any) => {
        // User can see their own posts
        if (userId && p.authorId === userId) return true;
        // Hide posts from private accounts
        if (p.author?.profileVisibility === 'private') return false;
        return true;
      });

      // Apply Christian values sorting if filter=popular
      if (filter === 'popular') {
        posts = sortPostsByFeedScore(posts);
      }

      // Enrich with bookmark and like status
      if (userId) {
        posts = await Promise.all(
          posts.map(async (post: any) => {
            const isBookmarked = await storage.hasUserBookmarkedPost(post.id, userId);
            const isLiked = await storage.hasUserLikedPost(post.id, userId);
            return {
              ...post,
              isBookmarked,
              isLiked,
              likeCount: post.upvotes || 0, // Map upvotes to likeCount for frontend
            };
          })
        );
      } else {
        // Not logged in - just add likeCount
        posts = posts.map((post: any) => ({
          ...post,
          likeCount: post.upvotes || 0,
        }));
      }

      // Sanitize anonymous posts to hide author information
      posts = posts.map((p: any) => sanitizePostForAnonymity(p));

      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json(buildErrorResponse('Error fetching posts', error));
    }
  });

  // Get user's bookmarked posts (MUST come before /:id route)
  router.get('/posts/bookmarks', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      let posts = await storage.getUserBookmarkedPosts(userId);

      // Filter out any posts with invalid IDs
      posts = posts.filter(p => p && p.id != null && !isNaN(p.id));

      // Filter out posts from blocked users
      const blockedIds = await storage.getBlockedUserIdsFor(userId);
      if (blockedIds && blockedIds.length > 0) {
        posts = posts.filter((p: any) => !blockedIds.includes(p.authorId));
      }

      // Filter out posts from private accounts (unless it's the user's own post)
      posts = posts.filter((p: any) => {
        if (p.authorId === userId) return true;
        if (p.author?.profileVisibility === 'private') return false;
        return true;
      });

      // Sanitize anonymous posts
      posts = posts.map((p: any) => sanitizePostForAnonymity(p));

      res.json(posts);
    } catch (error) {
      console.error('Error fetching bookmarked posts:', error);
      res.status(500).json(buildErrorResponse('Error fetching bookmarked posts', error));
    }
  });

  router.get('/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = getSessionUserId(req);
    let post = await storage.getPost(postId);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Enrich post with author data
    const author = await storage.getUser(post.authorId);
    const enrichedPost = {
      ...post,
      author: author ? {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        profileImageUrl: author.profileImageUrl,
        avatarUrl: author.profileImageUrl,
        profileVisibility: author.profileVisibility,
      } : {
        id: post.authorId,
        username: 'deleted',
        displayName: 'Deleted User',
        profileImageUrl: null,
        avatarUrl: null,
      },
    };

    // Check privacy: private account posts are only visible to the author
    if (enrichedPost.author?.profileVisibility === 'private' && (!userId || post.authorId !== userId)) {
      return res.status(403).json({ message: 'This post is not available' });
    }

    // Sanitize anonymous posts to hide author information
    const sanitizedPost = sanitizePostForAnonymity(enrichedPost);

    res.json(sanitizedPost);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json(buildErrorResponse('Error fetching post', error));
  }
  });

  // Accept { text, communityId? } and map to schema fields
  router.post('/posts', contentCreationLimiter, requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const result = resolvePostPayload(req.body, userId);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0]?.message ?? 'Invalid post payload' });
    }

    const validatedData = insertPostSchema.parse(result.payload as any);
    const post = await storage.createPost(validatedData);

    // Detect and update language asynchronously (don't block response)
    Promise.resolve().then(async () => {
      try {
        const detectedLanguage = detectLanguage(post.title + ' ' + post.content);
        await storage.updatePost(post.id, { detectedLanguage } as any);
        console.info(`[Language] Detected ${detectedLanguage} for post ${post.id}`);
      } catch (error) {
        console.error('Error detecting language for post:', error);
      }
    });

    // Process hashtags asynchronously (don't block response)
    storage.processPostHashtags(post.id, post.title, post.content)
      .catch(error => console.error('Error processing post hashtags:', error));

    // Process keywords asynchronously (don't block response)
    storage.processPostKeywords(post.id, post.title, post.content)
      .catch(error => console.error('Error processing post keywords:', error));

    // Notify community members about new post (if posted in a community)
    if (post.communityId && !post.isAnonymous) {
      try {
        const community = await storage.getCommunity(post.communityId);
        const authorName = await getUserDisplayName(userId);

        await notifyCommunityMembers(
          post.communityId,
          {
            title: `New post in ${community?.name || 'community'}`,
            body: `${authorName}: ${truncateText(post.title || post.content, 80)}`,
            data: {
              type: 'community_post',
              postId: post.id,
              communityId: post.communityId,
              authorId: userId,
            },
            category: 'community',
          },
          [userId] // Exclude post author from notifications
        );
        console.info(`[Posts] Notified community ${post.communityId} about new post ${post.id}`);
      } catch (notifError) {
        // Don't fail post creation if notifications fail
        console.error('[Posts] Error sending community post notification:', notifError);
      }
    }

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json(buildErrorResponse('Error creating post', error));
  }
  });

  router.post('/posts/:id/upvote', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    const result = await storage.togglePostVote(postId, userId, 'upvote');

    // Track engagement for language personalization (only if liked)
    if (result.voted) {
      trackEngagement(userId, postId, 'post', 'like')
        .catch(error => console.error('Error tracking engagement:', error));
    }

    // Broadcast engagement update for real-time sync
    broadcastEngagementUpdate({
      type: 'like',
      targetType: 'post',
      targetId: postId,
      count: result.post?.upvotes || 0,
      userId,
      action: result.voted ? 'add' : 'remove',
    });

    // Notify post author about like (only if liked, not unliked)
    if (result.voted && result.post && result.post.authorId !== userId) {
      try {
        const likerName = await getUserDisplayName(userId);
        await notifyUserWithPreferences(result.post.authorId, {
          title: `${likerName} liked your post`,
          body: truncateText(result.post.title || result.post.content, 80),
          data: {
            type: 'post_like',
            postId: result.post.id,
            likerId: userId,
          },
          category: 'feed',
          type: 'post_like',
          actorId: userId,
        });
      } catch (notifError) {
        console.error('[Posts] Error sending like notification:', notifError);
      }
    }

    res.json({ ...result.post, userHasUpvoted: result.voted });
  } catch (error) {
    console.error('Error toggling post upvote:', error);
    res.status(500).json(buildErrorResponse('Error toggling post upvote', error));
  }
  });

  router.post('/posts/:id/downvote', requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    const result = await storage.togglePostVote(postId, userId, 'downvote');

    // Broadcast engagement update for real-time sync
    broadcastEngagementUpdate({
      type: 'like',
      targetType: 'post',
      targetId: postId,
      count: result.post?.upvotes || 0,
      userId,
      action: result.voted ? 'remove' : 'add',
    });

    res.json({ ...result.post, userHasDownvoted: result.voted });
  } catch (error) {
    console.error('Error toggling post downvote:', error);
    res.status(500).json(buildErrorResponse('Error toggling post downvote', error));
  }
  });

  router.get('/posts/:id/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const comments = await storage.getCommentsByPostId(postId);

    // Enrich comments with author data
    const enrichedComments = await Promise.all(
      comments.map(async (comment: any) => {
        const author = await storage.getUser(comment.authorId);
        return {
          ...comment,
          author: author ? {
            id: author.id,
            username: author.username,
            displayName: author.displayName,
            profileImageUrl: author.profileImageUrl,
            avatarUrl: author.profileImageUrl,
          } : {
            id: comment.authorId,
            username: 'deleted',
            displayName: 'Deleted User',
            profileImageUrl: null,
            avatarUrl: null,
          },
        };
      })
    );

    res.json(enrichedComments);
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

    // Broadcast engagement update for real-time comment count sync
    const post = await storage.getPost(comment.postId);
    broadcastEngagementUpdate({
      type: 'comment',
      targetType: 'post',
      targetId: comment.postId,
      count: (post?.commentsCount || 0) + 1,
      userId,
      action: 'add',
    });

    // Notify post author or parent comment author
    try {
      const commenterName = await getUserDisplayName(userId);

      if (comment.parentCommentId) {
        // Reply to a comment - notify parent comment author
        const parentComment = await storage.getComment(comment.parentCommentId);
        if (parentComment && parentComment.authorId !== userId) {
          await notifyUserWithPreferences(parentComment.authorId, {
            title: `${commenterName} replied to your comment`,
            body: truncateText(comment.content, 80),
            data: {
              type: 'comment_reply',
              postId: comment.postId,
              commentId: comment.parentCommentId,
              replyId: comment.id,
            },
            category: 'forum',
            type: 'comment_reply',
            actorId: userId,
          });
        }
      } else {
        // Top-level comment - notify post author
        if (post && post.authorId !== userId) {
          await notifyUserWithPreferences(post.authorId, {
            title: `${commenterName} commented on your post`,
            body: truncateText(comment.content, 80),
            data: {
              type: 'post_comment',
              postId: comment.postId,
              commentId: comment.id,
              authorId: userId,
            },
            category: 'forum',
            type: 'post_comment',
            actorId: userId,
          });
        }
      }
    } catch (notifError) {
      console.error('[Posts] Error sending comment notification:', notifError);
    }

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
    const result = await storage.toggleCommentVote(commentId, userId, 'upvote');
    res.json({ ...result.comment, userHasUpvoted: result.voted });
  } catch (error) {
    console.error('Error toggling comment upvote:', error);
    res.status(500).json(buildErrorResponse('Error toggling comment upvote', error));
  }
  });

  router.post('/api/comments/:id/downvote', requireAuth, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const result = await storage.toggleCommentVote(commentId, userId, 'downvote');
    res.json({ ...result.comment, userHasDownvoted: result.voted });
  } catch (error) {
    console.error('Error toggling comment downvote:', error);
    res.status(500).json(buildErrorResponse('Error toggling comment downvote', error));
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
  router.delete('/posts/:id', requireAuth, async (req, res) => {
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

  // Bookmark a post
  router.post('/posts/:id/bookmark', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if already bookmarked
      const isBookmarked = await storage.hasUserBookmarkedPost(postId, userId);

      if (isBookmarked) {
        // Already bookmarked - return success (idempotent)
        return res.status(200).json({ message: 'Post already bookmarked', alreadyBookmarked: true });
      }

      const bookmark = await storage.bookmarkPost(postId, userId);
      res.status(201).json(bookmark);
    } catch (error: any) {
      console.error('Error bookmarking post:', error);
      res.status(500).json(buildErrorResponse('Error bookmarking post', error));
    }
  });

  // Unbookmark a post
  router.delete('/posts/:id/bookmark', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const postId = parseInt(req.params.id);
      const success = await storage.unbookmarkPost(postId, userId);

      if (!success) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }

      res.json({ message: 'Post unbookmarked successfully' });
    } catch (error) {
      console.error('Error unbookmarking post:', error);
      res.status(500).json(buildErrorResponse('Error unbookmarking post', error));
    }
  });

  // Like a post
  router.post('/posts/:id/like', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if already liked
      const isLiked = await storage.hasUserLikedPost(postId, userId);

      if (isLiked) {
        // Already liked - return success (idempotent)
        return res.status(200).json({ message: 'Post already liked', alreadyLiked: true });
      }

      await storage.likePost(postId, userId);
      res.status(201).json({ message: 'Post liked successfully' });
    } catch (error: any) {
      console.error('Error liking post:', error);
      res.status(500).json(buildErrorResponse('Error liking post', error));
    }
  });

  // Unlike a post
  router.delete('/posts/:id/like', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const postId = parseInt(req.params.id);
      const success = await storage.unlikePost(postId, userId);

      if (!success) {
        return res.status(404).json({ message: 'Like not found' });
      }

      res.json({ message: 'Post unliked successfully' });
    } catch (error) {
      console.error('Error unliking post:', error);
      res.status(500).json(buildErrorResponse('Error unliking post', error));
    }
  });

  return router;
  }

  export default createPostsRouter();
