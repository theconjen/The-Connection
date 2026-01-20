/**
 * Socket.IO Service for Real-time Messaging
 * Handles community chat and direct messages
 *
 * SECURITY: Uses JWT token authentication instead of userId
 */

import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './secureStorage';

const SOCKET_URL = 'https://api.theconnection.app';

let socket: Socket | null = null;

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
  };
}

export interface DirectMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export const socketService = {
  /**
   * Connect to Socket.IO with JWT authentication
   * SECURITY: Sends JWT token for server-side verification
   */
  connect: async (userId: number) => {
    if (socket?.connected) {
      return socket;
    }

    // Get JWT token for authentication
    const token = await getAuthToken();

    if (!token) {
      if (__DEV__) {
        console.warn('[Socket] No auth token available - cannot connect');
      }
      return null;
    }

    socket = io(SOCKET_URL, {
      auth: {
        token, // JWT token only - server extracts userId from token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      if (__DEV__) {
        console.log('[Socket] Connected successfully');
      }
      // Join user's personal room for DMs
      socket?.emit('join_user_room', userId);
    });

    socket.on('disconnect', (reason) => {
      if (__DEV__) {
        console.log('[Socket] Disconnected:', reason);
      }
    });

    socket.on('error', (error) => {
      if (__DEV__) {
        console.error('[Socket] Error:', error);
      }
    });

    socket.on('connect_error', (error) => {
      if (__DEV__) {
        console.error('[Socket] Connection error:', error.message);
      }
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Community Chat Methods
  joinChatRoom: (roomId: number) => {
    if (socket?.connected) {
      socket.emit('join_room', roomId);
    }
  },

  leaveChatRoom: (roomId: number) => {
    if (socket?.connected) {
      socket.emit('leave_room', roomId);
    }
  },

  sendChatMessage: (roomId: number, content: string, senderId: number) => {
    if (socket?.connected) {
      socket.emit('new_message', { roomId, content, senderId });
    }
  },

  onChatMessage: (callback: (message: ChatMessage) => void) => {
    if (socket) {
      socket.on('message_received', callback);
    }
  },

  offChatMessage: () => {
    if (socket) {
      socket.off('message_received');
    }
  },

  // Direct Message Methods
  sendDirectMessage: (receiverId: number, content: string, senderId: number) => {
    if (socket?.connected) {
      socket.emit('send_dm', { senderId, receiverId, content });
    }
  },

  onDirectMessage: (callback: (message: DirectMessage) => void) => {
    if (socket) {
      socket.on('new_message', callback);
    }
  },

  offDirectMessage: () => {
    if (socket) {
      socket.off('new_message');
    }
  },

  isConnected: (): boolean => {
    return socket?.connected || false;
  },

  getSocket: (): Socket | null => {
    return socket;
  },
};

export default socketService;
