/**
 * Socket.IO Singleton Instance
 * Allows any route/service to emit socket events
 */

import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function setSocketInstance(socketServer: SocketIOServer): void {
  io = socketServer;
}

export function getSocketInstance(): SocketIOServer | null {
  return io;
}

/**
 * Emit a direct message event to a user's room
 * Safe to call even if socket isn't initialized (will log warning)
 */
export function emitToUser(userId: number, event: string, payload: any): void {
  if (!io) {
    console.warn(`[Socket] Cannot emit ${event}: Socket.IO not initialized`);
    return;
  }
  io.to(`user_${userId}`).emit(event, payload);
}

/**
 * Emit a new DM notification to recipient
 */
export function emitNewDM(recipientId: number, message: {
  id: string | number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
}): void {
  emitToUser(recipientId, 'dm:new', message);
  // Also emit on legacy event name for backwards compatibility
  emitToUser(recipientId, 'new_message', message);
}

/**
 * Emit DM reaction update to both users
 */
export function emitDMReaction(
  userId1: number,
  userId2: number,
  payload: {
    messageId: string | number;
    reaction: string;
    userId: number;
    added: boolean;
  }
): void {
  emitToUser(userId1, 'dm:reaction', payload);
  emitToUser(userId2, 'dm:reaction', payload);
}

/**
 * Emit a new notification to a user
 * Used for all notification types (follows, likes, comments, events, etc.)
 */
export function emitNotification(recipientId: number, notification: {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: any;
  category?: string;
  actorId?: number;
  actorName?: string;
  actorAvatar?: string;
  createdAt: string;
}): void {
  if (!io) {
    console.warn(`[Socket] Cannot emit notif:new: Socket.IO not initialized`);
    return;
  }
  console.info(`[Socket] Emitting notif:new to user ${recipientId}:`, notification.type);
  emitToUser(recipientId, 'notif:new', notification);
}

/**
 * Emit notification to multiple users
 */
export function emitNotificationToMany(recipientIds: number[], notification: {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: any;
  category?: string;
  actorId?: number;
  actorName?: string;
  actorAvatar?: string;
  createdAt: string;
}): void {
  for (const recipientId of recipientIds) {
    emitNotification(recipientId, notification);
  }
}

/**
 * Broadcast engagement update to all connected clients
 * Used for real-time sync of likes, comments, follows, RSVPs, bookmarks, etc.
 */
export function broadcastEngagementUpdate(payload: {
  type: 'like' | 'comment' | 'follow' | 'rsvp' | 'bookmark' | 'prayer';
  targetType?: 'post' | 'microblog' | 'event' | 'prayer_request' | 'user';
  targetId?: number;
  count?: number;
  userId?: number;
  followerId?: number;
  followedId?: number;
  action?: 'add' | 'remove';
}): void {
  if (!io) {
    console.warn('[Socket] Cannot broadcast engagement:update: Socket.IO not initialized');
    return;
  }
  // Broadcast to all connected clients
  io.emit('engagement:update', payload);
}

/**
 * Emit engagement update to specific user(s)
 * Used when we want to target specific users rather than broadcast
 */
export function emitEngagementToUser(userId: number, payload: {
  type: 'like' | 'comment' | 'follow' | 'rsvp' | 'bookmark' | 'prayer';
  targetType?: 'post' | 'microblog' | 'event' | 'prayer_request' | 'user';
  targetId?: number;
  count?: number;
  action?: 'add' | 'remove';
}): void {
  emitToUser(userId, 'engagement:update', payload);
}
