/**
 * Socket.IO Service for Real-time Messaging
 * Handles community chat and direct messages
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://api.theconnection.app'; // Production

// Set to false to disable socket connections entirely
const SOCKET_ENABLED = true;

let socket: Socket | null = null;

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  createdAt: string;
  isAnnouncement?: boolean;
  isSystemMessage?: boolean;
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

// Store pending room joins to execute after connection
let pendingRoomJoin: number | null = null;
let pendingMessageCallback: ((message: ChatMessage) => void) | null = null;

export const socketService = {
  connect: (userId: number) => {
    if (!SOCKET_ENABLED) {
      return null;
    }

    if (socket?.connected) {
      // Socket already connected - execute any pending operations
      if (pendingRoomJoin !== null) {
        socket.emit('join_room', pendingRoomJoin);
        pendingRoomJoin = null;
      }
      if (pendingMessageCallback) {
        socket.on('message_received', pendingMessageCallback);
        pendingMessageCallback = null;
      }
      return socket;
    }

    try {
      socket = io(SOCKET_URL, {
        path: '/socket.io/', // Explicit path
        auth: {
          userId: userId.toString(),
        },
        transports: ['polling', 'websocket'], // Try polling first, then upgrade
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 3,
        timeout: 10000,
        forceNew: true,
      });

      socket.on('connect', () => {
        // Join user's personal room for DMs
        socket?.emit('join_user_room', userId);

        // Execute any pending room join
        if (pendingRoomJoin !== null) {
          socket?.emit('join_room', pendingRoomJoin);
          pendingRoomJoin = null;
        }

        // Attach any pending message callback
        if (pendingMessageCallback) {
          socket?.on('message_received', pendingMessageCallback);
          pendingMessageCallback = null;
        }
      });

      socket.on('disconnect', () => {
        // Silent disconnect handling
      });

      socket.on('error', () => {
        // Silent error handling - app continues with HTTP fallback
      });

      socket.on('connect_error', () => {
        // Silent - WebSocket may not always be available
        // The app should still work with HTTP-only fallback
      });

      return socket;
    } catch (error) {
      // Silent fail - app continues without real-time features
      return null;
    }
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
    } else {
      // Store for later when socket connects
      pendingRoomJoin = roomId;
    }
  },

  leaveChatRoom: (roomId: number) => {
    if (socket?.connected) {
      socket.emit('leave_room', roomId);
    }
    // Clear pending if leaving the room we were about to join
    if (pendingRoomJoin === roomId) {
      pendingRoomJoin = null;
    }
  },

  sendChatMessage: (roomId: number, content: string, senderId: number, isAnnouncement: boolean = false) => {
    if (socket?.connected) {
      socket.emit('new_message', { roomId, content, senderId, isAnnouncement });
    }
    // Silent fail if not connected - message won't be sent
  },

  onChatMessage: (callback: (message: ChatMessage) => void) => {
    if (socket?.connected) {
      socket.on('message_received', callback);
    } else {
      // Store for later when socket connects
      pendingMessageCallback = callback;
    }
  },

  offChatMessage: () => {
    if (socket) {
      socket.off('message_received');
    }
    pendingMessageCallback = null;
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
