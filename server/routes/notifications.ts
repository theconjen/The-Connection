/**
 * Notification Routes
 *
 * Thin wrapper endpoints that delegate to the notifications service.
 * All business logic lives in the service layer.
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId } from '../utils/session';
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../services/notifications';

const router = Router();

/**
 * Generate or extract requestId for tracing
 */
function getRequestId(req: any): string {
  return req.headers['x-request-id'] as string || uuidv4();
}

/**
 * Map service result to HTTP response
 */
function mapStatusToHttpCode(status: string): number {
  switch (status) {
    case 'OK':
    case 'DUPLICATE':
      return 200;
    case 'NOT_FOUND':
      return 404;
    case 'NOT_AUTHORIZED':
      return 403;
    case 'INVALID_INPUT':
      return 400;
    case 'RATE_LIMITED':
      return 429;
    case 'ERROR':
    default:
      return 500;
  }
}

// ============================================================================
// GET /api/notifications - List notifications (paginated)
// ============================================================================

router.get('/', requireAuth, async (req, res) => {
  const requestId = getRequestId(req);
  const userId = requireSessionUserId(req);

  const limit = parseInt(req.query.limit as string) || 50;
  const cursor = req.query.cursor as string | undefined;
  const unreadOnly = req.query.unreadOnly === 'true';

  const result = await listNotifications(
    userId,
    { limit: Math.min(limit, 100), cursor, unreadOnly },
    requestId
  );

  res.setHeader('x-request-id', requestId);
  res.status(mapStatusToHttpCode(result.status)).json(result);
});

// ============================================================================
// GET /api/notifications/unread-count - Get count of unread notifications
// ============================================================================

router.get('/unread-count', requireAuth, async (req, res) => {
  const requestId = getRequestId(req);
  const userId = requireSessionUserId(req);

  const result = await getUnreadCount(userId, requestId);

  res.setHeader('x-request-id', requestId);
  res.status(mapStatusToHttpCode(result.status)).json(result);
});

// ============================================================================
// POST /api/notifications/:id/read - Mark single notification as read
// ============================================================================

router.post('/:id/read', requireAuth, async (req, res) => {
  const requestId = getRequestId(req);
  const userId = requireSessionUserId(req);
  const notificationId = parseInt(req.params.id);

  if (isNaN(notificationId) || notificationId <= 0) {
    return res.status(400).json({
      status: 'INVALID_INPUT',
      success: false,
      code: 'NOTIFICATION_INVALID_ID',
      requestId,
      diagnostics: {
        reason: 'Notification ID must be a positive integer',
      },
    });
  }

  const result = await markAsRead(notificationId, userId, requestId);

  res.setHeader('x-request-id', requestId);
  res.status(mapStatusToHttpCode(result.status)).json(result);
});

// ============================================================================
// POST /api/notifications/read-all - Mark all notifications as read
// ============================================================================

router.post('/read-all', requireAuth, async (req, res) => {
  const requestId = getRequestId(req);
  const userId = requireSessionUserId(req);

  const result = await markAllAsRead(userId, requestId);

  res.setHeader('x-request-id', requestId);
  res.status(mapStatusToHttpCode(result.status)).json(result);
});

// ============================================================================
// DELETE /api/notifications/:id - Delete a notification
// ============================================================================

router.delete('/:id', requireAuth, async (req, res) => {
  const requestId = getRequestId(req);
  const userId = requireSessionUserId(req);
  const notificationId = parseInt(req.params.id);

  if (isNaN(notificationId) || notificationId <= 0) {
    return res.status(400).json({
      status: 'INVALID_INPUT',
      success: false,
      code: 'NOTIFICATION_INVALID_ID',
      requestId,
      diagnostics: {
        reason: 'Notification ID must be a positive integer',
      },
    });
  }

  const result = await deleteNotification(notificationId, userId, requestId);

  res.setHeader('x-request-id', requestId);
  res.status(mapStatusToHttpCode(result.status)).json(result);
});

export default router;
