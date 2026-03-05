/**
 * Direct Messaging storage methods.
 * Extracted from the monolithic storage.ts for better maintainability.
 */
import {
  Message, MessageReaction,
  messages, messageReactions,
} from '@shared/schema';
import { db, eq, and, or, desc, sql, inArray, isNull } from './base';
import { encryptMessage, decryptMessage } from './base';
import type { User } from '@shared/schema';

/**
 * Get direct messages between two users with batch-loaded enrichment.
 * Uses 3 queries total instead of 3N+1 (sender, receiver, reactions per message).
 */
export async function getDirectMessages(
  userId1: number,
  userId2: number,
  getUsersByIds: (ids: number[]) => Promise<Map<number, User>>
): Promise<any[]> {
  const result = await db.select().from(messages).where(
    or(
      and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
      and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
    )
  ).orderBy(messages.createdAt);

  if (result.length === 0) return [];

  // Batch-load users (1 query instead of 2N)
  const userIds = [...new Set(result.flatMap(m => [m.senderId, m.receiverId]))];
  const usersMap = await getUsersByIds(userIds);

  // Batch-load reactions (1 query instead of N)
  const messageIds = result.map(m => m.id);
  const allReactions = await getMessageReactionsBatch(messageIds);

  return result.map(msg => {
    const sender = usersMap.get(msg.senderId);
    const receiver = usersMap.get(msg.receiverId);
    return {
      ...msg,
      content: decryptMessage(msg.content),
      sender: sender ? {
        id: sender.id,
        username: sender.username,
        displayName: sender.displayName,
        profileImageUrl: sender.profileImageUrl,
      } : null,
      receiver: receiver ? {
        id: receiver.id,
        username: receiver.username,
        displayName: receiver.displayName,
        profileImageUrl: receiver.profileImageUrl,
      } : null,
      reactions: allReactions.get(msg.id) || [],
    };
  });
}

/**
 * Get user conversations with batch-loaded user info.
 * Uses 2 queries total instead of 2N+1.
 */
export async function getUserConversations(
  userId: number,
  getUsersByIds: (ids: number[]) => Promise<Map<number, User>>
): Promise<any[]> {
  const lastMessages = await db.execute(sql`
    WITH ranked AS (
      SELECT
        m.*,
        CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
        ROW_NUMBER() OVER (
          PARTITION BY CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END
          ORDER BY m.created_at DESC
        ) AS rn
      FROM messages m
      WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
    ),
    unread_counts AS (
      SELECT sender_id AS other_user_id, COUNT(*)::int AS unread_count
      FROM messages
      WHERE receiver_id = ${userId} AND is_read = false
      GROUP BY sender_id
    )
    SELECT
      r.id, r.sender_id, r.receiver_id, r.content, r.created_at, r.other_user_id,
      COALESCE(u.unread_count, 0) AS unread_count
    FROM ranked r
    LEFT JOIN unread_counts u ON u.other_user_id = r.other_user_id
    WHERE r.rn = 1
    ORDER BY r.created_at DESC
  `);

  if (lastMessages.rows.length === 0) return [];

  const otherUserIds = lastMessages.rows.map((r: any) => r.other_user_id as number);
  const usersMap = await getUsersByIds(otherUserIds);

  return lastMessages.rows.map((row: any) => {
    const otherUser = usersMap.get(row.other_user_id);
    return {
      id: row.other_user_id,
      otherUser: {
        id: row.other_user_id,
        username: otherUser?.username || 'Unknown',
        displayName: otherUser?.displayName,
        avatarUrl: (otherUser as any)?.avatarUrl || null,
      },
      lastMessage: {
        content: decryptMessage(row.content),
        createdAt: row.created_at,
        senderId: row.sender_id,
      },
      unreadCount: row.unread_count,
    };
  });
}

/**
 * Create a direct message with encryption.
 */
export async function createDirectMessage(message: any): Promise<any> {
  const encryptedMessage = { ...message, content: encryptMessage(message.content) };
  const result = await db.insert(messages).values(encryptedMessage).returning();
  return { ...result[0], content: decryptMessage(result[0].content) };
}

/**
 * Get reactions for a single message.
 */
export async function getMessageReactions(messageId: string): Promise<MessageReaction[]> {
  return await db
    .select()
    .from(messageReactions)
    .where(eq(messageReactions.messageId, messageId))
    .orderBy(messageReactions.createdAt);
}

/**
 * Batch-load reactions for multiple messages (1 query instead of N).
 */
export async function getMessageReactionsBatch(messageIds: string[]): Promise<Map<string, MessageReaction[]>> {
  if (messageIds.length === 0) return new Map();
  const allReactions = await db
    .select()
    .from(messageReactions)
    .where(inArray(messageReactions.messageId, messageIds))
    .orderBy(messageReactions.createdAt);
  const map = new Map<string, MessageReaction[]>();
  for (const r of allReactions) {
    const existing = map.get(r.messageId) || [];
    existing.push(r);
    map.set(r.messageId, existing);
  }
  return map;
}

/**
 * Toggle a reaction on a message.
 */
export async function toggleMessageReaction(
  messageId: string,
  userId: number,
  reaction: string = 'heart'
): Promise<{ added: boolean; reaction?: MessageReaction }> {
  const existing = await db
    .select()
    .from(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.reaction, reaction)
      )
    );

  if (existing.length > 0) {
    await db.delete(messageReactions).where(eq(messageReactions.id, existing[0].id));
    return { added: false };
  } else {
    const [newReaction] = await db
      .insert(messageReactions)
      .values({ messageId, userId, reaction })
      .returning();
    return { added: true, reaction: newReaction };
  }
}

/**
 * Mark a single message as read.
 */
export async function markMessageAsRead(messageId: string, userId: number): Promise<boolean> {
  const result = await db
    .update(messages)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(messages.id, messageId), eq(messages.receiverId, userId)))
    .returning();
  return result.length > 0;
}

/**
 * Mark all messages in a conversation as read.
 */
export async function markConversationAsRead(userId: number, otherUserId: number): Promise<number> {
  const result = await db
    .update(messages)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(messages.senderId, otherUserId),
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      )
    )
    .returning();
  return result.length;
}

/**
 * Get unread message count for a user.
 */
export async function getUnreadMessageCount(userId: number): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.receiverId, userId), eq(messages.isRead, false)));
  return result[0]?.count || 0;
}

/**
 * Get a single message by ID.
 */
export async function getMessageById(messageId: string): Promise<Message | undefined> {
  const result = await db.select().from(messages).where(eq(messages.id, messageId));
  return result[0];
}
