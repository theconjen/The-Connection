/**
 * Notifications Service
 *
 * Single source of truth for notification operations following the hardened pattern:
 * - Explicit result codes for all operations
 * - RequestId logging for traceability
 * - Deduplication support
 * - Structured diagnostics
 */

import { db as dbInstance } from '../db';
import { notifications } from '@shared/schema';
import { eq, and, desc, sql, lt } from 'drizzle-orm';
import { sendPushNotification } from './pushService';

// Ensure db is available
function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Ensure USE_DB=true and DATABASE_URL is set.');
  }
  return dbInstance;
}

// ============================================================================
// TYPES
// ============================================================================

export type NotificationResultCode =
  | 'OK'
  | 'DUPLICATE'
  | 'NOT_FOUND'
  | 'NOT_AUTHORIZED'
  | 'INVALID_INPUT'
  | 'ERROR';

export type NotificationCategory = 'dm' | 'community' | 'forum' | 'feed' | 'event';

export interface NotificationResult {
  status: NotificationResultCode;
  success: boolean;
  code: string;
  requestId: string;
  diagnostics: {
    reason: string;
    dedupeKey?: string;
    userId?: number;
    notificationId?: number;
  };
  data?: {
    notification?: Notification;
  };
}

export interface NotificationListResult {
  status: NotificationResultCode;
  success: boolean;
  code: string;
  requestId: string;
  diagnostics: {
    reason: string;
    totalCount: number;
    returnedCount: number;
  };
  data: {
    notifications: Notification[];
    nextCursor: string | null;
  };
}

export interface NotificationCountResult {
  status: NotificationResultCode;
  success: boolean;
  code: string;
  requestId: string;
  diagnostics: {
    reason: string;
    userId: number;
  };
  data: {
    count: number;
  };
}

export interface BulkMarkReadResult {
  status: NotificationResultCode;
  success: boolean;
  code: string;
  requestId: string;
  diagnostics: {
    reason: string;
    userId: number;
  };
  data: {
    count: number;
  };
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  data?: any;
  category?: string;
  isRead: boolean;
  sourceType?: string | null;
  sourceId?: string | null;
  dedupeKey?: string | null;
  createdAt: Date;
}

export interface CreateNotificationParams {
  userId: number;
  title: string;
  body: string;
  data?: any;
  category: NotificationCategory;
  sourceType?: string;
  sourceId?: string;
  dedupeKey?: string;
}

export interface ListNotificationsOptions {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

function log(
  operation: string,
  stage: 'START' | 'COMPLETE' | 'ERROR',
  requestId: string,
  details: Record<string, any> = {}
): void {
  const detailStr = Object.entries(details)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(' ');
  console.info(`[NOTIFICATION][${operation}] stage=${stage} requestId=${requestId} ${detailStr}`);
}

// ============================================================================
// SINGLE SOURCE OF TRUTH - CREATE NOTIFICATION
// ============================================================================

/**
 * Create a notification - SINGLE ENTRY POINT for all notification creation
 *
 * This is the only function that should insert into the notifications table.
 * All other code should call this function to create notifications.
 */
export async function createNotification(
  params: CreateNotificationParams,
  requestId: string
): Promise<NotificationResult> {
  const { userId, title, body, data, category, sourceType, sourceId, dedupeKey } = params;

  log('CREATE', 'START', requestId, { userId, category, dedupeKey });

  // Validate input
  if (!userId || userId <= 0) {
    log('CREATE', 'ERROR', requestId, { reason: 'invalid_user_id' });
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'NOTIFICATION_INVALID_USER',
      requestId,
      diagnostics: {
        reason: 'User ID is required and must be positive',
        userId,
      },
    };
  }

  if (!title || !body) {
    log('CREATE', 'ERROR', requestId, { reason: 'missing_title_or_body' });
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'NOTIFICATION_INVALID_CONTENT',
      requestId,
      diagnostics: {
        reason: 'Title and body are required',
        userId,
      },
    };
  }

  try {
    const db = getDb();

    // If dedupeKey is provided, check for existing unread notification
    if (dedupeKey) {
      const existing = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq((notifications as any).dedupeKey, dedupeKey),
            eq(notifications.isRead, false)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        log('CREATE', 'COMPLETE', requestId, {
          status: 'DUPLICATE',
          existingId: existing[0].id,
          dedupeKey
        });
        return {
          status: 'DUPLICATE',
          success: true, // Still considered success - idempotent operation
          code: 'NOTIFICATION_DUPLICATE',
          requestId,
          diagnostics: {
            reason: 'Duplicate unread notification exists',
            dedupeKey,
            userId,
            notificationId: existing[0].id,
          },
          data: {
            notification: mapNotification(existing[0]),
          },
        };
      }
    }

    // Insert new notification
    const [inserted] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        body,
        data: data || null,
        category: category || 'feed',
        isRead: false,
        // These columns may not exist yet if migration hasn't run
        // Use raw SQL to handle gracefully
      } as any)
      .returning();

    // Try to update the new columns if they exist (migration may not have run yet)
    if (dedupeKey || sourceType || sourceId) {
      try {
        await db.execute(sql`
          UPDATE notifications
          SET source_type = ${sourceType || null},
              source_id = ${sourceId || null},
              dedupe_key = ${dedupeKey || null}
          WHERE id = ${inserted.id}
        `);
      } catch (colErr) {
        // Columns don't exist yet - that's fine, migration pending
        console.warn(`[NOTIFICATION][CREATE] Optional columns not available yet, skipping: ${(colErr as Error).message}`);
      }
    }

    log('CREATE', 'COMPLETE', requestId, {
      status: 'OK',
      notificationId: inserted.id,
      dedupeKey
    });

    return {
      status: 'OK',
      success: true,
      code: 'NOTIFICATION_CREATED',
      requestId,
      diagnostics: {
        reason: 'Notification created successfully',
        dedupeKey,
        userId,
        notificationId: inserted.id,
      },
      data: {
        notification: mapNotification(inserted),
      },
    };
  } catch (error) {
    // Check for unique constraint violation (duplicate key)
    if ((error as any)?.code === '23505' && (error as any)?.constraint?.includes('dedupe')) {
      log('CREATE', 'COMPLETE', requestId, { status: 'DUPLICATE', dedupeKey });

      // Fetch the existing notification
      const existing = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(1);

      return {
        status: 'DUPLICATE',
        success: true,
        code: 'NOTIFICATION_DUPLICATE',
        requestId,
        diagnostics: {
          reason: 'Duplicate unread notification (constraint violation)',
          dedupeKey,
          userId,
          notificationId: existing[0]?.id,
        },
        data: existing[0] ? { notification: mapNotification(existing[0]) } : undefined,
      };
    }

    log('CREATE', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'NOTIFICATION_CREATE_FAILED',
      requestId,
      diagnostics: {
        reason: `Database error: ${(error as Error).message}`,
        userId,
        dedupeKey,
      },
    };
  }
}

// ============================================================================
// LIST NOTIFICATIONS
// ============================================================================

export async function listNotifications(
  userId: number,
  options: ListNotificationsOptions,
  requestId: string
): Promise<NotificationListResult> {
  const { limit = 50, cursor, unreadOnly = false } = options;

  log('LIST', 'START', requestId, { userId, limit, cursor, unreadOnly });

  if (!userId || userId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'NOTIFICATION_INVALID_USER',
      requestId,
      diagnostics: {
        reason: 'User ID is required and must be positive',
        totalCount: 0,
        returnedCount: 0,
      },
      data: {
        notifications: [],
        nextCursor: null,
      },
    };
  }

  try {
    const db = getDb();
    let query = db
      .select()
      .from(notifications)
      .where(
        unreadOnly
          ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
          : eq(notifications.userId, userId)
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1); // Fetch one extra to determine if there's more

    // Apply cursor if provided
    if (cursor) {
      const cursorId = parseInt(cursor, 10);
      if (!isNaN(cursorId)) {
        query = db
          .select()
          .from(notifications)
          .where(
            unreadOnly
              ? and(
                  eq(notifications.userId, userId),
                  eq(notifications.isRead, false),
                  lt(notifications.id, cursorId)
                )
              : and(eq(notifications.userId, userId), lt(notifications.id, cursorId))
          )
          .orderBy(desc(notifications.createdAt))
          .limit(limit + 1);
      }
    }

    const results = await query;

    // Determine if there's a next page
    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? String(items[items.length - 1].id) : null;

    log('LIST', 'COMPLETE', requestId, {
      status: 'OK',
      totalCount: results.length,
      returnedCount: items.length
    });

    return {
      status: 'OK',
      success: true,
      code: 'NOTIFICATIONS_LISTED',
      requestId,
      diagnostics: {
        reason: 'Notifications retrieved successfully',
        totalCount: results.length,
        returnedCount: items.length,
      },
      data: {
        notifications: items.map(mapNotification),
        nextCursor,
      },
    };
  } catch (error) {
    log('LIST', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'NOTIFICATION_LIST_FAILED',
      requestId,
      diagnostics: {
        reason: `Database error: ${(error as Error).message}`,
        totalCount: 0,
        returnedCount: 0,
      },
      data: {
        notifications: [],
        nextCursor: null,
      },
    };
  }
}

// ============================================================================
// GET UNREAD COUNT
// ============================================================================

export async function getUnreadCount(
  userId: number,
  requestId: string
): Promise<NotificationCountResult> {
  log('UNREAD_COUNT', 'START', requestId, { userId });

  if (!userId || userId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'NOTIFICATION_INVALID_USER',
      requestId,
      diagnostics: {
        reason: 'User ID is required and must be positive',
        userId,
      },
      data: {
        count: 0,
      },
    };
  }

  try {
    const db = getDb();
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    const count = result[0]?.count || 0;

    log('UNREAD_COUNT', 'COMPLETE', requestId, { status: 'OK', count });

    return {
      status: 'OK',
      success: true,
      code: 'NOTIFICATION_COUNT_SUCCESS',
      requestId,
      diagnostics: {
        reason: 'Unread count retrieved successfully',
        userId,
      },
      data: {
        count,
      },
    };
  } catch (error) {
    log('UNREAD_COUNT', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'NOTIFICATION_COUNT_FAILED',
      requestId,
      diagnostics: {
        reason: `Database error: ${(error as Error).message}`,
        userId,
      },
      data: {
        count: 0,
      },
    };
  }
}

// ============================================================================
// MARK AS READ
// ============================================================================

export async function markAsRead(
  notificationId: number,
  userId: number,
  requestId: string
): Promise<NotificationResult> {
  log('MARK_READ', 'START', requestId, { notificationId, userId });

  if (!notificationId || notificationId <= 0 || !userId || userId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'NOTIFICATION_INVALID_INPUT',
      requestId,
      diagnostics: {
        reason: 'Notification ID and User ID are required',
        notificationId,
        userId,
      },
    };
  }

  try {
    const db = getDb();
    // First check if notification exists and belongs to user
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (existing.length === 0) {
      log('MARK_READ', 'COMPLETE', requestId, { status: 'NOT_FOUND' });
      return {
        status: 'NOT_FOUND',
        success: false,
        code: 'NOTIFICATION_NOT_FOUND',
        requestId,
        diagnostics: {
          reason: 'Notification not found',
          notificationId,
          userId,
        },
      };
    }

    if (existing[0].userId !== userId) {
      log('MARK_READ', 'COMPLETE', requestId, { status: 'NOT_AUTHORIZED' });
      return {
        status: 'NOT_AUTHORIZED',
        success: false,
        code: 'NOTIFICATION_NOT_AUTHORIZED',
        requestId,
        diagnostics: {
          reason: 'User is not authorized to modify this notification',
          notificationId,
          userId,
        },
      };
    }

    // Update the notification
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();

    log('MARK_READ', 'COMPLETE', requestId, { status: 'OK', notificationId });

    return {
      status: 'OK',
      success: true,
      code: 'NOTIFICATION_MARKED_READ',
      requestId,
      diagnostics: {
        reason: 'Notification marked as read',
        notificationId,
        userId,
      },
      data: {
        notification: mapNotification(updated),
      },
    };
  } catch (error) {
    log('MARK_READ', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'NOTIFICATION_UPDATE_FAILED',
      requestId,
      diagnostics: {
        reason: `Database error: ${(error as Error).message}`,
        notificationId,
        userId,
      },
    };
  }
}

// ============================================================================
// DELETE NOTIFICATION
// ============================================================================

export async function deleteNotification(
  notificationId: number,
  userId: number,
  requestId: string
): Promise<NotificationResult> {
  log('DELETE', 'START', requestId, { notificationId, userId });

  if (!notificationId || notificationId <= 0 || !userId || userId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'NOTIFICATION_INVALID_INPUT',
      requestId,
      diagnostics: {
        reason: 'Notification ID and User ID are required',
        notificationId,
        userId,
      },
    };
  }

  try {
    const db = getDb();
    // First check if notification exists and belongs to user
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (existing.length === 0) {
      log('DELETE', 'COMPLETE', requestId, { status: 'NOT_FOUND' });
      return {
        status: 'NOT_FOUND',
        success: false,
        code: 'NOTIFICATION_NOT_FOUND',
        requestId,
        diagnostics: {
          reason: 'Notification not found',
          notificationId,
          userId,
        },
      };
    }

    if (existing[0].userId !== userId) {
      log('DELETE', 'COMPLETE', requestId, { status: 'NOT_AUTHORIZED' });
      return {
        status: 'NOT_AUTHORIZED',
        success: false,
        code: 'NOTIFICATION_NOT_AUTHORIZED',
        requestId,
        diagnostics: {
          reason: 'User is not authorized to delete this notification',
          notificationId,
          userId,
        },
      };
    }

    // Delete the notification
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    log('DELETE', 'COMPLETE', requestId, { status: 'OK', notificationId });

    return {
      status: 'OK',
      success: true,
      code: 'NOTIFICATION_DELETED',
      requestId,
      diagnostics: {
        reason: 'Notification deleted successfully',
        notificationId,
        userId,
      },
    };
  } catch (error) {
    log('DELETE', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'NOTIFICATION_DELETE_FAILED',
      requestId,
      diagnostics: {
        reason: `Database error: ${(error as Error).message}`,
        notificationId,
        userId,
      },
    };
  }
}

// ============================================================================
// MARK ALL AS READ
// ============================================================================

export async function markAllAsRead(
  userId: number,
  requestId: string
): Promise<BulkMarkReadResult> {
  log('MARK_ALL_READ', 'START', requestId, { userId });

  if (!userId || userId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'NOTIFICATION_INVALID_USER',
      requestId,
      diagnostics: {
        reason: 'User ID is required and must be positive',
        userId,
      },
      data: {
        count: 0,
      },
    };
  }

  try {
    const db = getDb();
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .returning();

    const count = result.length;

    log('MARK_ALL_READ', 'COMPLETE', requestId, { status: 'OK', count });

    return {
      status: 'OK',
      success: true,
      code: 'NOTIFICATIONS_MARKED_READ',
      requestId,
      diagnostics: {
        reason: `Marked ${count} notifications as read`,
        userId,
      },
      data: {
        count,
      },
    };
  } catch (error) {
    log('MARK_ALL_READ', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'NOTIFICATION_UPDATE_FAILED',
      requestId,
      diagnostics: {
        reason: `Database error: ${(error as Error).message}`,
        userId,
      },
      data: {
        count: 0,
      },
    };
  }
}

// ============================================================================
// HELPER: Notify with preferences (high-level helper that wraps createNotification)
// ============================================================================

/**
 * Create notification and optionally send push notification based on user preferences
 * This is a higher-level wrapper that integrates with the push notification system
 */
export async function notifyUserWithService(
  userId: number,
  notification: {
    title: string;
    body: string;
    data: any;
    category: NotificationCategory;
    sourceType?: string;
    sourceId?: string;
  },
  requestId: string
): Promise<NotificationResult> {
  // Generate dedupeKey if source info is provided
  const dedupeKey = notification.sourceType && notification.sourceId
    ? `${notification.sourceType}:${notification.sourceId}:${notification.category}`
    : undefined;

  const result = await createNotification({
    userId,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    category: notification.category,
    sourceType: notification.sourceType,
    sourceId: notification.sourceId,
    dedupeKey,
  }, requestId);

  // If duplicate, skip push notification (user already has this notification)
  if (result.status === 'DUPLICATE') {
    return result;
  }

  // If created successfully, attempt push notification (fire and forget)
  if (result.status === 'OK') {
    try {
      // Import dynamically to avoid circular dependencies
      const { storage } = await import('../storage');
      const pushTokens = await storage.getUserPushTokens(userId);

      if (pushTokens && pushTokens.length > 0) {
        for (const tokenRecord of pushTokens) {
          try {
            await sendPushNotification(
              tokenRecord.token,
              notification.title,
              notification.body,
              notification.data
            );
          } catch (pushErr) {
            console.error(`[NOTIFICATION][PUSH] Failed for token ${tokenRecord.id}: ${(pushErr as Error).message}`);
          }
        }
      }
    } catch (pushErr) {
      console.error(`[NOTIFICATION][PUSH] Error sending push to user ${userId}: ${(pushErr as Error).message}`);
    }
  }

  return result;
}

// ============================================================================
// HELPERS
// ============================================================================

function mapNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    body: row.body,
    data: row.data,
    category: row.category,
    isRead: row.isRead,
    sourceType: row.sourceType || row.source_type || null,
    sourceId: row.sourceId || row.source_id || null,
    dedupeKey: row.dedupeKey || row.dedupe_key || null,
    createdAt: row.createdAt,
  };
}
