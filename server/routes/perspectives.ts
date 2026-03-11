/**
 * Perspective Articles API Routes
 *
 * Shorter focused articles written by verified apologists from specific traditions
 * (Catholic, Orthodox, Reformed, etc.) linked to parent library posts.
 *
 * PUBLIC ROUTES:
 * - GET /api/library/posts/:postId/perspectives - Get published perspectives for a post
 * - GET /api/perspectives/:id - Get single perspective article
 *
 * APOLOGIST ROUTES (verified + matching tradition):
 * - POST /api/library/posts/:postId/perspectives - Submit a perspective article
 * - PATCH /api/perspectives/:id - Edit own draft/revision_requested article
 *
 * RESEARCH TEAM / ADMIN:
 * - POST /api/perspectives/:id/publish - Approve and publish
 * - POST /api/perspectives/:id/request-revision - Send back with notes
 *
 * USER ROUTES:
 * - POST /api/library/posts/:postId/request-perspective - Request a missing perspective
 * - GET /api/library/posts/:postId/perspective-requests - Get request counts by tradition
 *
 * - POST /api/apologist/apply - Apply to become an apologist
 */

import { Router } from 'express';
import { db } from '../db';
import { perspectiveArticles, perspectiveRequests, apologistProfiles, users, qaLibraryPosts, notifications } from '@shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId, getSessionUserId } from '../utils/session';
import { z } from 'zod';

const router = Router();

const VALID_TRADITIONS = ['Catholic', 'Orthodox', 'Protestant'];
const RESEARCH_TEAM_USER_ID = 19;

// Helper: check if user is research team or admin
async function isResearchTeamOrAdmin(userId: number): Promise<boolean> {
  if (userId === RESEARCH_TEAM_USER_ID) return true;
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  return user?.role === 'admin';
}

// Helper: get apologist profile with tradition
async function getApologistProfile(userId: number) {
  const [profile] = await db
    .select()
    .from(apologistProfiles)
    .where(eq(apologistProfiles.userId, userId))
    .limit(1);
  return profile;
}

// Helper: notify research team
async function notifyResearchTeam(title: string, message: string, link?: string) {
  try {
    await db.insert(notifications).values({
      userId: RESEARCH_TEAM_USER_ID,
      type: 'perspective_submitted',
      title,
      message,
      link: link || '/questions/inbox',
      read: false,
      createdAt: new Date(),
    } as any);
  } catch {
    // Non-critical — don't fail the request
  }
}

// Helper: notify a user
async function notifyUser(userId: number, type: string, title: string, message: string, link?: string) {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      link: link || '/apologetics',
      read: false,
      createdAt: new Date(),
    } as any);
  } catch {
    // Non-critical
  }
}

// ============================================================================
// PUBLIC: Get published perspectives for a library post
// ============================================================================
router.get('/library/posts/:postId/perspectives', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post ID' });

    const articles = await db
      .select({
        id: perspectiveArticles.id,
        tradition: perspectiveArticles.tradition,
        authorUserId: perspectiveArticles.authorUserId,
        authorDisplayName: perspectiveArticles.authorDisplayName,
        bodyMarkdown: perspectiveArticles.bodyMarkdown,
        scriptureRefs: perspectiveArticles.scriptureRefs,
        sources: perspectiveArticles.sources,
        viewCount: perspectiveArticles.viewCount,
        publishedAt: perspectiveArticles.publishedAt,
      })
      .from(perspectiveArticles)
      .where(and(
        eq(perspectiveArticles.parentPostId, postId),
        eq(perspectiveArticles.status, 'published'),
      ))
      .orderBy(perspectiveArticles.tradition);

    // Also get request counts for traditions that don't have articles
    const requestCounts = await db
      .select({
        tradition: perspectiveRequests.tradition,
        count: sql<number>`count(*)::int`,
      })
      .from(perspectiveRequests)
      .where(eq(perspectiveRequests.postId, postId))
      .groupBy(perspectiveRequests.tradition);

    const requestMap: Record<string, number> = {};
    for (const r of requestCounts) {
      requestMap[r.tradition] = r.count;
    }

    res.json({ perspectives: articles, requestCounts: requestMap });
  } catch (error) {
    console.error('Error fetching perspectives:', error);
    res.status(500).json({ error: 'Failed to fetch perspectives' });
  }
});

// ============================================================================
// PUBLIC: Get single perspective article
// ============================================================================
router.get('/perspectives/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const [article] = await db
      .select()
      .from(perspectiveArticles)
      .where(eq(perspectiveArticles.id, id))
      .limit(1);

    if (!article) return res.status(404).json({ error: 'Not found' });

    // Only published articles are public; drafts visible to author/admin
    const userId = getSessionUserId(req);
    if (article.status !== 'published') {
      if (!userId || (userId !== article.authorUserId && !(await isResearchTeamOrAdmin(userId)))) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    // Increment view count for published
    if (article.status === 'published') {
      await db
        .update(perspectiveArticles)
        .set({ viewCount: sql`${perspectiveArticles.viewCount} + 1` })
        .where(eq(perspectiveArticles.id, id));
    }

    // Get parent post title for breadcrumb
    const [parentPost] = await db
      .select({ id: qaLibraryPosts.id, title: qaLibraryPosts.title })
      .from(qaLibraryPosts)
      .where(eq(qaLibraryPosts.id, article.parentPostId))
      .limit(1);

    // Get author credentials
    const [authorProfile] = await db
      .select({
        title: apologistProfiles.title,
        credentialsShort: apologistProfiles.credentialsShort,
        primaryTradition: apologistProfiles.primaryTradition,
      })
      .from(apologistProfiles)
      .where(eq(apologistProfiles.userId, article.authorUserId))
      .limit(1);

    res.json({
      ...article,
      parentPost: parentPost || null,
      authorProfile: authorProfile || null,
    });
  } catch (error) {
    console.error('Error fetching perspective:', error);
    res.status(500).json({ error: 'Failed to fetch perspective' });
  }
});

// ============================================================================
// APOLOGIST: Submit a perspective article
// ============================================================================
router.post('/library/posts/:postId/perspectives', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post ID' });

    // Validate input
    const schema = z.object({
      bodyMarkdown: z.string().min(100, 'Article must be at least 100 characters'),
      scriptureRefs: z.array(z.string()).optional().default([]),
      sources: z.array(z.object({
        author: z.string(),
        title: z.string(),
        publisher: z.string().optional(),
        year: z.number().optional(),
        url: z.string().optional(),
      })).optional().default([]),
    });

    const data = schema.parse(req.body);

    // Check user is a verified apologist
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || !(user as any).isVerifiedApologeticsAnswerer) {
      return res.status(403).json({ error: 'Only verified apologists can submit perspective articles' });
    }

    // Get apologist profile — must have a primaryTradition set
    const profile = await getApologistProfile(userId);
    if (!profile || !profile.primaryTradition) {
      return res.status(403).json({ error: 'Your apologist profile must have a primary tradition set' });
    }

    const tradition = profile.primaryTradition;
    if (!VALID_TRADITIONS.includes(tradition)) {
      return res.status(400).json({ error: `Invalid tradition: ${tradition}` });
    }

    // Check parent post exists and is published
    const [parentPost] = await db
      .select()
      .from(qaLibraryPosts)
      .where(and(eq(qaLibraryPosts.id, postId), eq(qaLibraryPosts.status, 'published')))
      .limit(1);

    if (!parentPost) {
      return res.status(404).json({ error: 'Parent article not found or not published' });
    }

    // Create the perspective article
    const now = new Date();
    const authorName = user.displayName || user.username || 'Anonymous';
    const displayName = profile.title ? `${profile.title} ${authorName}` : authorName;

    const [article] = await db
      .insert(perspectiveArticles)
      .values({
        parentPostId: postId,
        tradition,
        authorUserId: userId,
        authorDisplayName: displayName,
        bodyMarkdown: data.bodyMarkdown,
        scriptureRefs: JSON.stringify(data.scriptureRefs),
        sources: JSON.stringify(data.sources),
        status: 'pending_review',
        createdAt: now,
        updatedAt: now,
      } as any)
      .returning();

    // Notify research team
    await notifyResearchTeam(
      'New Perspective Submitted',
      `${displayName} submitted a ${tradition} perspective for "${parentPost.title}"`,
      `/apologetics/${postId}`,
    );

    res.status(201).json(article);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating perspective:', error);
    res.status(500).json({ error: 'Failed to create perspective article' });
  }
});

// ============================================================================
// APOLOGIST: Edit own perspective article (draft or revision_requested)
// ============================================================================
router.patch('/perspectives/:id', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const [article] = await db.select().from(perspectiveArticles).where(eq(perspectiveArticles.id, id)).limit(1);
    if (!article) return res.status(404).json({ error: 'Not found' });

    // Only author can edit, and only in draft or revision_requested status
    if (article.authorUserId !== userId) {
      return res.status(403).json({ error: 'Only the author can edit this article' });
    }
    if (!['draft', 'revision_requested'].includes(article.status)) {
      return res.status(400).json({ error: 'Article can only be edited in draft or revision_requested status' });
    }

    const schema = z.object({
      bodyMarkdown: z.string().min(100).optional(),
      scriptureRefs: z.array(z.string()).optional(),
      sources: z.array(z.object({
        author: z.string(),
        title: z.string(),
        publisher: z.string().optional(),
        year: z.number().optional(),
        url: z.string().optional(),
      })).optional(),
    });

    const data = schema.parse(req.body);
    const updates: any = { updatedAt: new Date() };

    if (data.bodyMarkdown) updates.bodyMarkdown = data.bodyMarkdown;
    if (data.scriptureRefs) updates.scriptureRefs = JSON.stringify(data.scriptureRefs);
    if (data.sources) updates.sources = JSON.stringify(data.sources);

    // If resubmitting after revision request, move back to pending_review
    if (article.status === 'revision_requested') {
      updates.status = 'pending_review';
      updates.reviewNotes = null;

      // Notify research team of resubmission
      const [parentPost] = await db
        .select({ title: qaLibraryPosts.title })
        .from(qaLibraryPosts)
        .where(eq(qaLibraryPosts.id, article.parentPostId))
        .limit(1);

      await notifyResearchTeam(
        'Perspective Resubmitted',
        `${article.authorDisplayName} resubmitted their ${article.tradition} perspective for "${parentPost?.title || 'Unknown'}"`,
        `/apologetics/${article.parentPostId}`,
      );
    }

    const [updated] = await db
      .update(perspectiveArticles)
      .set(updates)
      .where(eq(perspectiveArticles.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating perspective:', error);
    res.status(500).json({ error: 'Failed to update perspective' });
  }
});

// ============================================================================
// RESEARCH TEAM: Publish a perspective article
// ============================================================================
router.post('/perspectives/:id/publish', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!(await isResearchTeamOrAdmin(userId))) {
      return res.status(403).json({ error: 'Only the research team can publish perspective articles' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const [article] = await db.select().from(perspectiveArticles).where(eq(perspectiveArticles.id, id)).limit(1);
    if (!article) return res.status(404).json({ error: 'Not found' });
    if (article.status === 'published') return res.status(400).json({ error: 'Already published' });

    const now = new Date();
    const [published] = await db
      .update(perspectiveArticles)
      .set({
        status: 'published',
        publishedAt: now,
        updatedAt: now,
        reviewNotes: null,
      })
      .where(eq(perspectiveArticles.id, id))
      .returning();

    // Notify the author
    await notifyUser(
      article.authorUserId,
      'perspective_published',
      'Perspective Published!',
      `Your ${article.tradition} perspective has been published.`,
      `/apologetics/${article.parentPostId}`,
    );

    // Notify users who requested this tradition for this post
    const requesters = await db
      .select({ userId: perspectiveRequests.userId })
      .from(perspectiveRequests)
      .where(and(
        eq(perspectiveRequests.postId, article.parentPostId),
        eq(perspectiveRequests.tradition, article.tradition),
      ));

    for (const requester of requesters) {
      if (requester.userId !== article.authorUserId) {
        await notifyUser(
          requester.userId,
          'perspective_available',
          'Perspective Now Available',
          `The ${article.tradition} perspective you requested is now available.`,
          `/apologetics/${article.parentPostId}`,
        );
      }
    }

    res.json(published);
  } catch (error) {
    console.error('Error publishing perspective:', error);
    res.status(500).json({ error: 'Failed to publish' });
  }
});

// ============================================================================
// RESEARCH TEAM: Send back for revision with notes
// ============================================================================
router.post('/perspectives/:id/request-revision', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!(await isResearchTeamOrAdmin(userId))) {
      return res.status(403).json({ error: 'Only the research team can request revisions' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const { notes } = z.object({ notes: z.string().min(1, 'Notes are required') }).parse(req.body);

    const [article] = await db.select().from(perspectiveArticles).where(eq(perspectiveArticles.id, id)).limit(1);
    if (!article) return res.status(404).json({ error: 'Not found' });

    const [updated] = await db
      .update(perspectiveArticles)
      .set({
        status: 'revision_requested',
        reviewNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(perspectiveArticles.id, id))
      .returning();

    // Notify author
    await notifyUser(
      article.authorUserId,
      'perspective_revision_requested',
      'Revisions Requested',
      `The research team has requested revisions on your ${article.tradition} perspective.`,
      `/apologetics/${article.parentPostId}`,
    );

    res.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Invalid input' });
    }
    console.error('Error requesting revision:', error);
    res.status(500).json({ error: 'Failed to request revision' });
  }
});

// ============================================================================
// USER: Request a missing perspective
// ============================================================================
router.post('/library/posts/:postId/request-perspective', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post ID' });

    const { tradition } = z.object({
      tradition: z.enum(VALID_TRADITIONS as [string, ...string[]]),
    }).parse(req.body);

    // Check post exists
    const [post] = await db.select({ id: qaLibraryPosts.id }).from(qaLibraryPosts).where(eq(qaLibraryPosts.id, postId)).limit(1);
    if (!post) return res.status(404).json({ error: 'Article not found' });

    // Upsert — ignore duplicate
    await db
      .insert(perspectiveRequests)
      .values({ postId, tradition, userId, createdAt: new Date() } as any)
      .onConflictDoNothing();

    res.json({ success: true });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid tradition' });
    }
    console.error('Error requesting perspective:', error);
    res.status(500).json({ error: 'Failed to request perspective' });
  }
});

// ============================================================================
// USER: Apply to become an apologist
// ============================================================================
router.post('/apologist/apply', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);

    const schema = z.object({
      title: z.string().optional(), // Dr., Rev., etc.
      credentialsShort: z.string().min(1, 'Credentials are required'),
      bioLong: z.string().min(50, 'Please provide a detailed bio (at least 50 characters)'),
      primaryTradition: z.enum(VALID_TRADITIONS as [string, ...string[]]),
    });

    const data = schema.parse(req.body);

    // Check if already has a profile
    const existing = await getApologistProfile(userId);
    if (existing) {
      // Update existing profile
      const [updated] = await db
        .update(apologistProfiles)
        .set({
          title: data.title || existing.title,
          credentialsShort: data.credentialsShort,
          bioLong: data.bioLong,
          primaryTradition: data.primaryTradition,
          verificationStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(apologistProfiles.userId, userId))
        .returning();

      // Notify research team
      const [user] = await db.select({ displayName: users.displayName, username: users.username }).from(users).where(eq(users.id, userId)).limit(1);
      const name = user?.displayName || user?.username || 'Unknown';
      await notifyResearchTeam(
        'Apologist Application Updated',
        `${name} resubmitted their apologist application (${data.primaryTradition})`,
      );

      return res.json({ success: true, profile: updated });
    }

    // Create new profile
    const [profile] = await db
      .insert(apologistProfiles)
      .values({
        userId,
        title: data.title,
        credentialsShort: data.credentialsShort,
        bioLong: data.bioLong,
        primaryTradition: data.primaryTradition,
        verificationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();

    // Notify research team
    const [user] = await db.select({ displayName: users.displayName, username: users.username }).from(users).where(eq(users.id, userId)).limit(1);
    const name = user?.displayName || user?.username || 'Unknown';
    await notifyResearchTeam(
      'New Apologist Application',
      `${name} applied to be a ${data.primaryTradition} apologist: ${data.credentialsShort}`,
    );

    res.status(201).json({ success: true, profile });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error applying as apologist:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

export default router;
