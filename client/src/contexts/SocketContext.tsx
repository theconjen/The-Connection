/**
 * Socket.IO Context for Real-time Updates (Web)
 * Manages socket connection and updates React Query cache on events
 *
 * PERFORMANCE: Socket connection is delayed to not block initial page render
 */

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/use-auth';

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
  const [isConnected, setIsConnected] = useState(false);

  // Handle new DM event
  const handleNewDM = useCallback((message: any) => {
    queryClient.invalidateQueries({ queryKey: ['/api/dms/conversations'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dms/unread-count'] });
    if (message.senderId) {
      queryClient.invalidateQueries({ queryKey: [`/api/dms/${message.senderId}`] });
    }
  }, [queryClient]);

  // Handle DM reaction event
  const handleDMReaction = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/dms'] });
  }, [queryClient]);

  // Handle new notification event
  const handleNewNotification = useCallback((notification: any) => {
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });

    if (notification.type === 'follow' || notification.type === 'follow_request' || notification.type === 'follow_accepted') {
      queryClient.invalidateQueries({ queryKey: ['/api/followers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/following'] });
    }

    if (notification.type === 'post_like' || notification.type === 'post_comment') {
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
    }
  }, [queryClient]);

  // Handle engagement events (likes, comments, follows, etc.)
  const handleEngagementUpdate = useCallback((data: any) => {
    const { type, targetType, targetId } = data;

    switch (type) {
      case 'like':
        if (targetType === 'post') {
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${targetId}`] });
        } else if (targetType === 'microblog') {
          queryClient.invalidateQueries({ queryKey: [`/api/microblogs/${targetId}`] });
        }
        queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
        break;

      case 'comment':
        if (targetType === 'post') {
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${targetId}`] });
        } else if (targetType === 'microblog') {
          queryClient.invalidateQueries({ queryKey: [`/api/microblogs/${targetId}`] });
        }
        break;

      case 'follow':
        if (data.followerId) {
          queryClient.invalidateQueries({ queryKey: [`/api/users/${data.followerId}`] });
        }
        if (data.followedId) {
          queryClient.invalidateQueries({ queryKey: [`/api/users/${data.followedId}`] });
        }
        break;

      case 'rsvp':
        if (targetId) {
          queryClient.invalidateQueries({ queryKey: [`/api/events/${targetId}`] });
        }
        queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        break;

      case 'bookmark':
        queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
        break;

      case 'prayer':
        queryClient.invalidateQueries({ queryKey: ['/api/prayer-requests'] });
        break;
    }
  }, [queryClient]);

  // Connect socket when user is authenticated - delayed to not block render
  useEffect(() => {
    if (!user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Delay socket connection to not block initial page render
    const timeoutId = setTimeout(() => {
      const token = localStorage.getItem('authToken');
      if (!token || socketRef.current?.connected) {
        return;
      }

      const socket = io({
        path: '/socket.io/',
        auth: { token, userId: user.id.toString() },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('join_user_room', user.id);
      });

      socket.on('disconnect', () => setIsConnected(false));
      socket.on('connect_error', () => setIsConnected(false));

      socket.on('dm:new', handleNewDM);
      socket.on('new_message', handleNewDM);
      socket.on('dm:reaction', handleDMReaction);
      socket.on('notif:new', handleNewNotification);
      socket.on('engagement:update', handleEngagementUpdate);
    }, 2000); // 2 second delay after user loads

    return () => {
      clearTimeout(timeoutId);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user?.id, handleNewDM, handleDMReaction, handleNewNotification, handleEngagementUpdate]);

  return (
    <SocketContext.Provider value={{ isConnected, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
}
