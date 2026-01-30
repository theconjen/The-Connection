/**
 * Socket.IO Context for Real-time Updates (Web)
 * Manages socket connection and updates React Query cache on events
 *
 * Syncs the following in real-time:
 * - Notifications (notif:new)
 * - Direct Messages (dm:new, dm:reaction)
 * - Likes/Upvotes (engagement:like)
 * - Comments (engagement:comment)
 * - Follows (engagement:follow)
 * - Event RSVPs (engagement:rsvp)
 * - Bookmarks (engagement:bookmark)
 * - Prayer requests (engagement:prayer)
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
    console.info('[Socket] Received dm:new event:', message);

    // Update conversations list cache
    queryClient.invalidateQueries({ queryKey: ['/api/dms/conversations'] });

    // Update unread count
    queryClient.invalidateQueries({ queryKey: ['/api/dms/unread-count'] });

    // If we're in a specific conversation, update that cache too
    if (message.senderId) {
      queryClient.invalidateQueries({ queryKey: [`/api/dms/${message.senderId}`] });
    }
    if (message.receiverId) {
      queryClient.invalidateQueries({ queryKey: [`/api/dms/${message.receiverId}`] });
    }
  }, [queryClient]);

  // Handle DM reaction event
  const handleDMReaction = useCallback((data: any) => {
    console.info('[Socket] Received dm:reaction event:', data);
    queryClient.invalidateQueries({ queryKey: ['/api/dms'] });
  }, [queryClient]);

  // Handle new notification event
  const handleNewNotification = useCallback((notification: any) => {
    console.info('[Socket] Received notif:new event:', notification);

    // Update notifications list cache
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });

    // Update notification count (badge)
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });

    // For specific notification types, also update related caches
    if (notification.type === 'follow' || notification.type === 'follow_request' || notification.type === 'follow_accepted') {
      queryClient.invalidateQueries({ queryKey: ['/api/followers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/following'] });
      queryClient.invalidateQueries({ queryKey: ['/api/follow-requests'] });
    }

    if (notification.type === 'post_like' || notification.type === 'post_comment' || notification.type === 'comment_reply') {
      if (notification.data?.postId) {
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${notification.data.postId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${notification.data.postId}/comments`] });
      }
      if (notification.data?.microblogId) {
        queryClient.invalidateQueries({ queryKey: [`/api/microblogs/${notification.data.microblogId}`] });
      }
      // Invalidate feed to update like counts
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
    }

    if (notification.type === 'event_updated' || notification.type === 'event_canceled') {
      if (notification.data?.eventId) {
        queryClient.invalidateQueries({ queryKey: [`/api/events/${notification.data.eventId}`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    }
  }, [queryClient]);

  // Handle engagement events (likes, comments, follows, etc.)
  const handleEngagementUpdate = useCallback((data: any) => {
    console.info('[Socket] Received engagement update:', data);

    const { type, targetType, targetId, count } = data;

    switch (type) {
      case 'like':
        // Update like count for the specific post/microblog
        if (targetType === 'post') {
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${targetId}`] });
        } else if (targetType === 'microblog') {
          queryClient.invalidateQueries({ queryKey: [`/api/microblogs/${targetId}`] });
        }
        // Also refresh feed to show updated counts
        queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
        queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
        break;

      case 'comment':
        // Update comment count
        if (targetType === 'post') {
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${targetId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${targetId}/comments`] });
        } else if (targetType === 'microblog') {
          queryClient.invalidateQueries({ queryKey: [`/api/microblogs/${targetId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/microblogs/${targetId}/replies`] });
        }
        queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
        break;

      case 'follow':
        // Update follower/following counts for both users
        if (data.followerId) {
          queryClient.invalidateQueries({ queryKey: [`/api/users/${data.followerId}`] });
        }
        if (data.followedId) {
          queryClient.invalidateQueries({ queryKey: [`/api/users/${data.followedId}`] });
        }
        queryClient.invalidateQueries({ queryKey: ['/api/followers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/following'] });
        break;

      case 'rsvp':
        // Update event attendee count
        if (targetId) {
          queryClient.invalidateQueries({ queryKey: [`/api/events/${targetId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/events/${targetId}/attendees`] });
        }
        queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        break;

      case 'bookmark':
        // Update bookmark status
        queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/posts/bookmarks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/microblogs/bookmarks'] });
        break;

      case 'prayer':
        // Update prayer request counts
        if (targetId) {
          queryClient.invalidateQueries({ queryKey: [`/api/prayer-requests/${targetId}`] });
        }
        queryClient.invalidateQueries({ queryKey: ['/api/prayer-requests'] });
        break;
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

    // Get JWT token for socket auth
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('[Socket] No auth token available');
      return;
    }

    console.info('[Socket] Connecting for user:', user.id);

    // Create socket connection
    const socket = io({
      path: '/socket.io/',
      auth: {
        token: token,
        userId: user.id.toString(),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.info('[Socket] Connected, socket id:', socket.id);
      setIsConnected(true);

      // Join user's personal room for DMs and notifications
      socket.emit('join_user_room', user.id);
    });

    socket.on('disconnect', (reason) => {
      console.info('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('error', (error: any) => {
      console.warn('[Socket] Error:', error?.message || error);
    });

    // DM event handlers - listen for both new and legacy event names
    socket.on('dm:new', handleNewDM);
    socket.on('new_message', handleNewDM);
    socket.on('dm:reaction', handleDMReaction);

    // Notification event handler
    socket.on('notif:new', handleNewNotification);

    // Engagement event handler (likes, comments, follows, etc.)
    socket.on('engagement:update', handleEngagementUpdate);

    // Cleanup on unmount or user change
    return () => {
      if (socketRef.current) {
        socketRef.current.off('dm:new', handleNewDM);
        socketRef.current.off('new_message', handleNewDM);
        socketRef.current.off('dm:reaction', handleDMReaction);
        socketRef.current.off('notif:new', handleNewNotification);
        socketRef.current.off('engagement:update', handleEngagementUpdate);
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
