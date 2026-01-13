/**
 * Socket.IO Service for Real-time Messaging
 * Handles community chat and direct messages
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://api.theconnection.app'; // Production
// const SOCKET_URL = 'http://localhost:5000'; // Development

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
  connect: (userId: number) => {
    if (socket?.connected) {
      return socket;
    }

    socket = io(SOCKET_URL, {
      auth: {
        userId: userId.toString(),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      // Join user's personal room for DMs
      socket?.emit('join_user_room', userId);
    });

    socket.on('disconnect', (reason) => {
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
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
