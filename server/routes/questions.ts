/**
 * Questions API Routes - Private Q&A Inbox System
 *
 * Handles:
 * - Submitting questions (with required domain/area/tag)
 * - Viewing user's own questions
 * - Inbox for permissioned responders
 * - Threaded messages
 * - Assignment management
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { insertUserQuestionSchema, insertQuestionMessageSchema } from '@shared/schema';

const router = Router();

// ============================================================================
// TAXONOMY - Areas and Tags
// ============================================================================

/**
 * GET /qa/areas
 * Get all areas for a domain (apologetics or polemics)
 */
router.get('/qa/areas', async (req, res) => {
  try {
    const domain = req.query.domain as string;

    if (!domain || (domain !== 'apologetics' && domain !== 'polemics')) {
      return res.status(400).json({
        message: 'Invalid or missing domain parameter. Must be "apologetics" or "polemics"'
      });
    }

    // Get areas from database
    const { db } = await import('../db');
    const { qaAreas } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const areas = await db
      .select()
      .from(qaAreas)
      .where(eq(qaAreas.domain, domain))
      .orderBy(qaAreas.order);

    res.json(areas);
  } catch (error) {
    console.error('[Questions] Error fetching areas:', error);
    res.status(500).json(buildErrorResponse('Error fetching areas', error));
  }
});

/**
 * GET /qa/areas/:id/tags
 * Get all tags for a specific area
 */
router.get('/qa/areas/:id/tags', async (req, res) => {
  try {
    const areaId = parseInt(req.params.id);

    if (!Number.isFinite(areaId)) {
      return res.status(400).json({ message: 'Invalid area ID' });
    }

    // Verify area exists
    const area = await storage.getQaArea(areaId);
    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }

    // Get tags from database
    const { db } = await import('../db');
    const { qaTags } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const tags = await db
      .select()
      .from(qaTags)
      .where(eq(qaTags.areaId, areaId))
      .orderBy(qaTags.order);

    res.json(tags);
  } catch (error) {
    console.error('[Questions] Error fetching tags:', error);
    res.status(500).json(buildErrorResponse('Error fetching tags', error));
  }
});

// ============================================================================
// MIDDLEWARE - Check permissions
// ============================================================================

/**
 * Middleware to check if user has inbox_access permission
 */
async function requireInboxAccess(req: any, res: any, next: any) {
  try {
    const userId = requireSessionUserId(req);
    const hasAccess = await storage.userHasPermission(userId, 'inbox_access');

    if (!hasAccess) {
      return res.status(403).json({
        message: 'Access denied. You do not have inbox access.'
      });
    }

    next();
  } catch (error) {
    console.error('[Questions] Error checking inbox access:', error);
    res.status(500).json(buildErrorResponse('Error checking permissions', error));
  }
}

/**
 * Middleware to check if user has manage_experts permission (admin only)
 */
async function requireManageExperts(req: any, res: any, next: any) {
  try {
    const userId = requireSessionUserId(req);
    const hasAccess = await storage.userHasPermission(userId, 'manage_experts');

    if (!hasAccess) {
      return res.status(403).json({
        message: 'Access denied. Admin only.'
      });
    }

    next();
  } catch (error) {
    console.error('[Questions] Error checking manage_experts:', error);
    res.status(500).json(buildErrorResponse('Error checking permissions', error));
  }
}

// ============================================================================
// QUESTIONS
// ============================================================================

/**
 * POST /questions
 * Submit a new question (requires domain, area, tag)
 */
router.post('/questions', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const { domain, areaId, tagId, questionText } = req.body;

    // Validate required fields
    if (!domain || !areaId || !tagId || !questionText) {
      return res.status(400).json({
        message: 'Missing required fields: domain, areaId, tagId, questionText'
      });
    }

    // Validate domain
    if (domain !== 'apologetics' && domain !== 'polemics') {
      return res.status(400).json({
        message: 'Invalid domain. Must be "apologetics" or "polemics"'
      });
    }

    // Verify area and tag exist
    const area = await storage.getQaArea(areaId);
    if (!area) {
      return res.status(400).json({ message: 'Invalid area ID' });
    }

    const tag = await storage.getQaTag(tagId);
    if (!tag || tag.areaId !== areaId) {
      return res.status(400).json({ message: 'Invalid tag ID or tag does not belong to this area' });
    }

    // Create question
    const question = await storage.createUserQuestion({
      askerUserId: userId,
      domain,
      areaId,
      tagId,
      questionText,
      status: 'new',
    });

    // Auto-assign to responder
    await storage.autoAssignQuestion(question.id);

    res.status(201).json(question);
  } catch (error) {
    console.error('[Questions] Error creating question:', error);
    res.status(500).json(buildErrorResponse('Error submitting question', error));
  }
});

/**
 * GET /questions/mine
 * Get all questions submitted by the current user
 */
router.get('/questions/mine', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const questions = await storage.getUserQuestions(userId);
    res.json(questions);
  } catch (error) {
    console.error('[Questions] Error fetching user questions:', error);
    res.status(500).json(buildErrorResponse('Error fetching your questions', error));
  }
});

/**
 * GET /questions/inbox
 * Get all questions assigned to the current user (requires inbox_access)
 */
router.get('/questions/inbox', requireAuth, requireInboxAccess, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const status = req.query.status as string | undefined; // 'assigned', 'accepted', 'declined', 'answered'

    const questions = await storage.getInboxQuestions(userId, status);
    res.json(questions);
  } catch (error) {
    console.error('[Questions] Error fetching inbox questions:', error);
    res.status(500).json(buildErrorResponse('Error fetching inbox', error));
  }
});

// ============================================================================
// MESSAGES (Threaded conversations)
// ============================================================================

/**
 * GET /questions/:id/messages
 * Get all messages for a question thread
 */
router.get('/questions/:id/messages', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const questionId = parseInt(req.params.id);

    if (!Number.isFinite(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    // Verify user has access to this question (either asker or assigned responder)
    const hasAccess = await storage.userCanAccessQuestion(userId, questionId);
    if (!hasAccess) {
      return res.status(403).json({
        message: 'Access denied. You are not part of this conversation.'
      });
    }

    const messages = await storage.getQuestionMessages(questionId);
    res.json(messages);
  } catch (error) {
    console.error('[Questions] Error fetching messages:', error);
    res.status(500).json(buildErrorResponse('Error fetching messages', error));
  }
});

/**
 * POST /questions/:id/messages
 * Send a message in a question thread
 */
router.post('/questions/:id/messages', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const questionId = parseInt(req.params.id);
    const { body } = req.body;

    if (!Number.isFinite(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Message body is required' });
    }

    // Verify user has access to this question
    const hasAccess = await storage.userCanAccessQuestion(userId, questionId);
    if (!hasAccess) {
      return res.status(403).json({
        message: 'Access denied. You are not part of this conversation.'
      });
    }

    // Create message
    const message = await storage.createQuestionMessage({
      questionId,
      senderUserId: userId,
      body,
    });

    // Update question status if this is a response from the assigned expert
    const question = await storage.getUserQuestionById(questionId);
    const assignment = await storage.getActiveAssignment(questionId);

    if (assignment && assignment.assignedToUserId === userId && question?.status === 'routed') {
      await storage.updateQuestionStatus(questionId, 'answered');
      await storage.updateAssignmentStatus(assignment.id, 'answered');
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('[Questions] Error creating message:', error);
    res.status(500).json(buildErrorResponse('Error sending message', error));
  }
});

// ============================================================================
// ASSIGNMENTS
// ============================================================================

/**
 * POST /assignments/:id/accept
 * Accept a question assignment
 */
router.post('/assignments/:id/accept', requireAuth, requireInboxAccess, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const assignmentId = parseInt(req.params.id);

    if (!Number.isFinite(assignmentId)) {
      return res.status(400).json({ message: 'Invalid assignment ID' });
    }

    // Verify assignment belongs to this user
    const assignment = await storage.getQuestionAssignment(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.assignedToUserId !== userId) {
      return res.status(403).json({ message: 'This assignment is not for you' });
    }

    if (assignment.status !== 'assigned') {
      return res.status(400).json({ message: 'Assignment already processed' });
    }

    // Accept assignment
    const updated = await storage.updateAssignmentStatus(assignmentId, 'accepted');
    res.json(updated);
  } catch (error) {
    console.error('[Questions] Error accepting assignment:', error);
    res.status(500).json(buildErrorResponse('Error accepting assignment', error));
  }
});

/**
 * POST /assignments/:id/decline
 * Decline a question assignment
 */
router.post('/assignments/:id/decline', requireAuth, requireInboxAccess, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const assignmentId = parseInt(req.params.id);
    const { reason } = req.body;

    if (!Number.isFinite(assignmentId)) {
      return res.status(400).json({ message: 'Invalid assignment ID' });
    }

    // Verify assignment belongs to this user
    const assignment = await storage.getQuestionAssignment(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.assignedToUserId !== userId) {
      return res.status(403).json({ message: 'This assignment is not for you' });
    }

    if (assignment.status !== 'assigned') {
      return res.status(400).json({ message: 'Assignment already processed' });
    }

    // Decline assignment
    const updated = await storage.declineAssignment(assignmentId, reason);

    // Try to reassign to someone else
    await storage.autoAssignQuestion(assignment.questionId);

    res.json(updated);
  } catch (error) {
    console.error('[Questions] Error declining assignment:', error);
    res.status(500).json(buildErrorResponse('Error declining assignment', error));
  }
});

// ============================================================================
// ADMIN
// ============================================================================

/**
 * POST /admin/permissions/grant
 * Grant a permission to a user (admin only)
 */
router.post('/admin/permissions/grant', requireAuth, requireManageExperts, async (req, res) => {
  try {
    const grantedBy = requireSessionUserId(req);
    const { userId, permission } = req.body;

    if (!userId || !permission) {
      return res.status(400).json({ message: 'userId and permission are required' });
    }

    if (!['inbox_access', 'manage_experts'].includes(permission)) {
      return res.status(400).json({ message: 'Invalid permission type' });
    }

    const granted = await storage.grantPermission(userId, permission, grantedBy);
    res.status(201).json(granted);
  } catch (error) {
    console.error('[Questions] Error granting permission:', error);
    res.status(500).json(buildErrorResponse('Error granting permission', error));
  }
});

/**
 * POST /admin/permissions/revoke
 * Revoke a permission from a user (admin only)
 */
router.post('/admin/permissions/revoke', requireAuth, requireManageExperts, async (req, res) => {
  try {
    const { userId, permission } = req.body;

    if (!userId || !permission) {
      return res.status(400).json({ message: 'userId and permission are required' });
    }

    const revoked = await storage.revokePermission(userId, permission);
    res.json({ success: revoked });
  } catch (error) {
    console.error('[Questions] Error revoking permission:', error);
    res.status(500).json(buildErrorResponse('Error revoking permission', error));
  }
});

/**
 * GET /admin/responders
 * Get all users with inbox_access permission (admin only)
 */
router.get('/admin/responders', requireAuth, requireManageExperts, async (req, res) => {
  try {
    const responders = await storage.getAllResponders();
    res.json(responders);
  } catch (error) {
    console.error('[Questions] Error fetching responders:', error);
    res.status(500).json(buildErrorResponse('Error fetching responders', error));
  }
});

export default router;
