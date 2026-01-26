import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./use-auth";

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  createdAt: Date | null;
  isSystemMessage: boolean;
  sender?: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface UseChatWebsocketReturn {
  sendMessage: (content: string, roomId: number) => void;
  joinRoom: (roomId: number) => void;
  leaveRoom: (roomId: number) => void;
  sendTyping: (roomId: number) => void;
  messages: ChatMessage[];
  usersTyping: { userId: number; username: string; roomId: number }[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useChatWebsocket(): UseChatWebsocketReturn {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [usersTyping, setUsersTyping] = useState<{ userId: number; username: string; roomId: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Keep track of subscribed rooms
  const subscribedRoomsRef = useRef<Set<number>>(new Set());

  // Keep track of typing timeouts to prevent memory leaks
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Connect to the Socket.IO server
  useEffect(() => {
    if (!user) {
      return;
    }

    // Get JWT token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError("No authentication token available");
      return;
    }

    if (socket || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create Socket.IO connection with JWT authentication
      const newSocket = io({
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.info('[Socket.IO] connected:', newSocket.id);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);

        // Join user's personal room for notifications
        if (user) {
          newSocket.emit('join_user_room', user.id);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.info('[Socket.IO] disconnected:', reason);
        setIsConnected(false);

        // Clear subscribed rooms on disconnect
        subscribedRoomsRef.current.clear();
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err.message);
        setError(`Connection error: ${err.message}`);
        setIsConnecting(false);
      });

      // Chat message handlers
      newSocket.on('message_received', (message: ChatMessage) => {
        setMessages(prevMessages => {
          // Avoid duplicate messages
          if (prevMessages.some(m => m.id === message.id)) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
      });

      newSocket.on('message_history', (data: { messages: ChatMessage[] }) => {
        setMessages(prevMessages => {
          const existingIds = new Set(prevMessages.map(m => m.id));
          const newMessages = data.messages.filter(m => !existingIds.has(m.id));
          return [...prevMessages, ...newMessages];
        });
      });

      // System message handler
      newSocket.on('system_message', (data: { roomId: number; message: string }) => {
        const systemMessage: ChatMessage = {
          id: Date.now(),
          chatRoomId: data.roomId,
          senderId: 0,
          content: data.message,
          createdAt: new Date(),
          isSystemMessage: true,
          sender: {
            id: 0,
            username: "system",
            displayName: "System",
            avatarUrl: null
          }
        };
        setMessages(prevMessages => [...prevMessages, systemMessage]);
      });

      // Typing indicator handler
      newSocket.on('user_typing', (data: { userId: number; username: string; roomId: number }) => {
        setUsersTyping(prevTyping => {
          const filtered = prevTyping.filter(u => u.userId !== data.userId || u.roomId !== data.roomId);
          const newTyping = [...filtered, {
            userId: data.userId,
            username: data.username,
            roomId: data.roomId
          }];

          // Clear any existing timeout for this user/room
          const timeoutKey = `${data.userId}-${data.roomId}`;
          const existingTimeout = typingTimeoutsRef.current.get(timeoutKey);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Auto-remove typing indicator after 3 seconds
          const timeout = setTimeout(() => {
            setUsersTyping(current =>
              current.filter(u => u.userId !== data.userId || u.roomId !== data.roomId)
            );
            typingTimeoutsRef.current.delete(timeoutKey);
          }, 3000);

          typingTimeoutsRef.current.set(timeoutKey, timeout);
          return newTyping;
        });
      });

      // Error handler
      newSocket.on('error', (data: { message: string; code?: string }) => {
        console.error('Socket.IO error:', data.message);
        setError(data.message);
      });

      setSocket(newSocket);

      // Cleanup function
      return () => {
        // Clear all typing timeouts
        typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        typingTimeoutsRef.current.clear();

        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Error setting up Socket.IO:", error);
      setError("Failed to connect to chat server");
      setIsConnecting(false);
    }
  }, [user, socket, isConnecting]);

  // Send a chat message
  const sendMessage = useCallback((content: string, roomId: number) => {
    if (!socket || !socket.connected || !user) {
      setError("Cannot send message: Not connected or not authenticated");
      return;
    }

    if (!subscribedRoomsRef.current.has(roomId)) {
      setError("Cannot send message: Not joined to this room");
      return;
    }

    socket.emit('new_message', {
      roomId,
      content,
      senderId: user.id
    });
  }, [socket, user]);

  // Join a chat room
  const joinRoom = useCallback((roomId: number) => {
    if (!socket || !socket.connected) {
      setError("Cannot join room: Not connected");
      return;
    }

    // Add to local tracking
    subscribedRoomsRef.current.add(roomId);

    socket.emit('join_room', roomId);
  }, [socket]);

  // Leave a chat room
  const leaveRoom = useCallback((roomId: number) => {
    if (!socket || !socket.connected) {
      return;
    }

    // Remove from local tracking
    subscribedRoomsRef.current.delete(roomId);

    socket.emit('leave_room', roomId);

    // Remove messages from this room from local state
    setMessages(prevMessages =>
      prevMessages.filter(msg => msg.chatRoomId !== roomId)
    );

    // Remove typing indicators for this room
    setUsersTyping(prevTyping =>
      prevTyping.filter(u => u.roomId !== roomId)
    );
  }, [socket]);

  // Send typing notification
  const sendTyping = useCallback((roomId: number) => {
    if (!socket || !socket.connected || !user) {
      return;
    }

    if (!subscribedRoomsRef.current.has(roomId)) {
      return;
    }

    socket.emit('typing', {
      roomId,
      userId: user.id,
      username: user.username
    });
  }, [socket, user]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear all typing timeouts
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
    };
  }, []);

  return {
    sendMessage,
    joinRoom,
    leaveRoom,
    sendTyping,
    messages,
    usersTyping,
    isConnected,
    isConnecting,
    error
  };
}
