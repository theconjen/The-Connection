/**
 * Socket.IO Context for Real-time Updates
 * Manages socket connection and updates React Query cache on events
 */

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { getApiBase } from '../lib/apiClient';
import * as SecureStore from 'expo-secure-store';

interface SocketContextValue {
  isConnected: boolean;
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({
  isConnected: false,
  socket: null,
});

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  // Handle new DM event
  const handleNewDM = useCallback((message: any) => {
    console.log('[Socket] Received dm:new event:', message);

    // Update conversations list cache
    queryClient.invalidateQueries({ queryKey: ['conversations'] });

    // Update unread count
    queryClient.invalidateQueries({ queryKey: ['unread-count'] });

    // If we're in a specific conversation, update that cache too
    if (message.senderId) {
      queryClient.invalidateQueries({ queryKey: ['messages', message.senderId] });
    }
  }, [queryClient]);

  // Handle DM reaction event
  const handleDMReaction = useCallback((data: any) => {
    console.log('[Socket] Received dm:reaction event:', data);
    // Invalidate the specific conversation
    queryClient.invalidateQueries({ queryKey: ['messages'] });
  }, [queryClient]);

  // Handle new notification event (for all notification types: follows, likes, comments, events, etc.)
  const handleNewNotification = useCallback((notification: any) => {
    console.log('[Socket] Received notif:new event:', notification);

    // Update notifications list cache
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

    // Update notification count (badge)
    queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });

    // For specific notification types, also update related caches
    if (notification.type === 'follow' || notification.type === 'follow_request' || notification.type === 'follow_accepted') {
      // Update follow-related queries
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
    }

    if (notification.type === 'post_like' || notification.type === 'post_comment' || notification.type === 'comment_reply') {
      // Update post-related queries
      if (notification.data?.postId) {
        queryClient.invalidateQueries({ queryKey: ['post', notification.data.postId] });
        queryClient.invalidateQueries({ queryKey: ['comments', notification.data.postId] });
      }
    }

    if (notification.type === 'event_updated' || notification.type === 'event_canceled') {
      // Update event-related queries
      if (notification.data?.eventId) {
        queryClient.invalidateQueries({ queryKey: ['event', notification.data.eventId] });
      }
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  }, [queryClient]);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (!user?.id) {
      // Not logged in, disconnect if connected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const connectSocket = async () => {
      try {
        // Get JWT token for socket auth
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          console.warn('[Socket] No auth token available');
          return;
        }

        const socketUrl = getApiBase();
        console.log('[Socket] Connecting to:', socketUrl, 'for user:', user.id);

        // Create socket connection
        const socket = io(socketUrl, {
          auth: {
            token: token,
            userId: user.id.toString(),
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10,
          timeout: 20000,
        });

        socketRef.current = socket;

        // Connection handlers
        socket.on('connect', () => {
          console.log('[Socket] Connected, socket id:', socket.id);
          setIsConnected(true);

          // Join user's personal room for DMs
          socket.emit('join_user_room', user.id);
        });

        socket.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected:', reason);
          setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
          console.error('[Socket] Connection error:', error.message);
          setIsConnected(false);
        });

        socket.on('error', (error) => {
          console.error('[Socket] Error:', error);
        });

        // DM event handlers - listen for both new and legacy event names
        socket.on('dm:new', handleNewDM);
        socket.on('new_message', handleNewDM);
        socket.on('dm:reaction', handleDMReaction);

        // Notification event handler - for all notification types
        socket.on('notif:new', handleNewNotification);

      } catch (error) {
        console.error('[Socket] Error connecting:', error);
      }
    };

    connectSocket();

    // Cleanup on unmount or user change
    return () => {
      if (socketRef.current) {
        socketRef.current.off('dm:new', handleNewDM);
        socketRef.current.off('new_message', handleNewDM);
        socketRef.current.off('dm:reaction', handleDMReaction);
        socketRef.current.off('notif:new', handleNewNotification);
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user?.id, handleNewDM, handleDMReaction, handleNewNotification]);

  return (
    <SocketContext.Provider value={{ isConnected, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
}
