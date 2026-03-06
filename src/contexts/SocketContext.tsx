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

// Set to false to disable socket connections entirely (useful when server doesn't have Socket.IO)
const SOCKET_ENABLED = true;

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

  // Debounce timer refs — batch rapid socket events into single invalidations
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const debouncedInvalidate = useCallback((key: string, queryKey: any[], options?: { exact?: boolean }) => {
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    debounceTimers.current[key] = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey, ...options });
      delete debounceTimers.current[key];
    }, 2000); // 2-second debounce — batches rapid events
  }, [queryClient]);

  // Handle new DM event
  const handleNewDM = useCallback((message: any) => {
    // Only invalidate the specific conversation + badge count
    debouncedInvalidate('conversations', ['conversations']);
    debouncedInvalidate('unread-count', ['unread-count']);

    if (message.senderId) {
      // Invalidate only the exact conversation, not all messages
      queryClient.invalidateQueries({ queryKey: ['messages', message.senderId], exact: true });
    }
  }, [queryClient, debouncedInvalidate]);

  // Handle DM reaction event
  const handleDMReaction = useCallback((data: any) => {
    // Only invalidate the specific conversation if we know which one
    if (data?.conversationId || data?.senderId) {
      const key = data.conversationId || data.senderId;
      queryClient.invalidateQueries({ queryKey: ['messages', key], exact: true });
    }
    // Don't invalidate ALL messages — that causes every conversation to refetch
  }, [queryClient]);

  // Handle new notification event — only update badge count immediately, defer the rest
  const handleNewNotification = useCallback((notification: any) => {
    // Badge counts are lightweight — update immediately
    queryClient.invalidateQueries({ queryKey: ['notification-count'], exact: true });
    queryClient.invalidateQueries({ queryKey: ['unread-notification-count'], exact: true });

    // Notification list can wait — debounce to batch rapid notifications
    debouncedInvalidate('notifications', ['notifications']);

    // Only invalidate specific resources if we have exact IDs — never broad keys
    if (notification.type === 'follow' || notification.type === 'follow_request' || notification.type === 'follow_accepted') {
      // Debounce follow queries — multiple follow events can fire in quick succession
      debouncedInvalidate('follow-requests', ['follow-requests']);
      // Don't invalidate ['followers'] or ['following'] — these are expensive list queries
      // They'll refresh naturally when the user visits the profile screen (staleTime handles this)
    }

    if (notification.type === 'post_like' || notification.type === 'post_comment' || notification.type === 'comment_reply') {
      // Only invalidate the specific post, not all posts
      if (notification.data?.postId) {
        queryClient.invalidateQueries({ queryKey: ['post', notification.data.postId], exact: true });
        queryClient.invalidateQueries({ queryKey: ['comments', notification.data.postId], exact: true });
      }
    }

    if (notification.type === 'event_updated' || notification.type === 'event_canceled') {
      // Only invalidate the specific event — never the entire events list
      if (notification.data?.eventId) {
        queryClient.invalidateQueries({ queryKey: ['event', notification.data.eventId], exact: true });
      }
    }
  }, [queryClient, debouncedInvalidate]);

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
      // Skip socket connection if disabled
      if (!SOCKET_ENABLED) {
        return;
      }

      try {
        // Get JWT token for socket auth
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          return;
        }

        const socketUrl = getApiBase();

        // Create socket connection
        const socket = io(socketUrl, {
          path: '/socket.io/', // Explicit path
          auth: {
            token: token,
            userId: user.id.toString(),
          },
          transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: 5,
          timeout: 20000,
          forceNew: true,
        });

        socketRef.current = socket;

        // Connection handlers
        socket.on('connect', () => {
          setIsConnected(true);

          // Join user's personal room for DMs
          socket.emit('join_user_room', user.id);
        });

        socket.on('disconnect', (reason) => {
          setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
          // Use warn instead of error to avoid red error dialog in dev mode
          // WebSocket may not always be available - app works fine with HTTP
          setIsConnected(false);
        });

        socket.on('error', (error) => {
          // Use warn instead of error to avoid red error dialog in dev mode
        });

        // DM event handlers - listen for both new and legacy event names
        socket.on('dm:new', handleNewDM);
        socket.on('new_message', handleNewDM);
        socket.on('dm:reaction', handleDMReaction);

        // Notification event handler - for all notification types
        socket.on('notif:new', handleNewNotification);

      } catch (error) {
        // Use warn instead of error to avoid red error dialog
      }
    };

    connectSocket();

    // Cleanup on unmount or user change
    return () => {
      // Clear all debounce timers
      Object.values(debounceTimers.current).forEach(clearTimeout);
      debounceTimers.current = {};

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
