import { useState, useEffect, useCallback, useRef } from "react";
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

type MessageHandler = (message: any) => void;

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
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [usersTyping, setUsersTyping] = useState<{ userId: number; username: string; roomId: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of subscribed rooms
  const subscribedRoomsRef = useRef<Set<number>>(new Set());
  
  // Message handlers map
  const messageHandlersRef = useRef<Map<string, MessageHandler>>(new Map());
  
  // Setup message handlers
  useEffect(() => {
    // Handle connection confirmation
    messageHandlersRef.current.set("connected", () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      
      // If user is authenticated, send auth data
      if (user) {
        socket?.send(JSON.stringify({
          type: "auth",
          userId: user.id,
          username: user.username,
          token: "fake-token" // In a real implementation, use a proper token
        }));
      }
    });
    
    // Handle auth success
    messageHandlersRef.current.set("auth_success", (data) => {
      console.log("Authentication successful", data);
    });
    
    // Handle room joined
    messageHandlersRef.current.set("room_joined", (data) => {
      console.log("Joined room", data.roomId);
    });
    
    // Handle message history
    messageHandlersRef.current.set("message_history", (data) => {
      setMessages(prevMessages => {
        // Filter out messages that are already in the history for this room
        const existingIds = new Set(prevMessages.map(m => m.id));
        const newMessages = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
        return [...prevMessages, ...newMessages];
      });
    });
    
    // Handle new messages
    messageHandlersRef.current.set("new_message", (data) => {
      setMessages(prevMessages => [...prevMessages, data.message]);
    });
    
    // Handle system messages
    messageHandlersRef.current.set("system_message", (data) => {
      // Create a fake system message
      const systemMessage: ChatMessage = {
        id: Date.now(), // Use timestamp as a temporary ID
        chatRoomId: data.roomId,
        senderId: 0, // System message has senderId 0
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
    
    // Handle user typing
    messageHandlersRef.current.set("user_typing", (data) => {
      setUsersTyping(prevTyping => {
        // Remove previous typing notifications from this user
        const filtered = prevTyping.filter(u => u.userId !== data.userId || u.roomId !== data.roomId);
        
        // Add new typing notification
        const newTyping = [...filtered, { 
          userId: data.userId, 
          username: data.username, 
          roomId: data.roomId 
        }];
        
        // Set up automatic removal after 3 seconds
        setTimeout(() => {
          setUsersTyping(current => 
            current.filter(u => u.userId !== data.userId || u.roomId !== data.roomId)
          );
        }, 3000);
        
        return newTyping;
      });
    });
    
    // Handle errors
    messageHandlersRef.current.set("error", (data) => {
      console.error("WebSocket error:", data.message);
      setError(data.message);
    });
    
    // Handle pong (keep alive)
    messageHandlersRef.current.set("pong", () => {
      console.log("Received pong from server");
    });
    
    return () => {
      messageHandlersRef.current.clear();
    };
  }, [user, socket]);
  
  // Connect to the WebSocket server
  useEffect(() => {
    if (!socket && !isConnecting) {
      setIsConnecting(true);
      
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log("Connecting to WebSocket server:", wsUrl);
        const newSocket = new WebSocket(wsUrl);
        
        newSocket.onopen = () => {
          console.log("WebSocket connection established");
          setSocket(newSocket);
        };
        
        newSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data);
            
            const handler = messageHandlersRef.current.get(data.type);
            if (handler) {
              handler(data);
            } else {
              console.warn("No handler for message type:", data.type);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
        
        newSocket.onerror = (event) => {
          console.error("WebSocket error:", event);
          setError("WebSocket connection error");
          setIsConnecting(false);
        };
        
        newSocket.onclose = () => {
          console.log("WebSocket connection closed");
          setIsConnected(false);
          setSocket(null);
          setIsConnecting(false);
          
          // Clear subscribed rooms
          subscribedRoomsRef.current.clear();
          
          // Try to reconnect after a delay
          setTimeout(() => {
            setIsConnecting(false); // Allow reconnection attempt
          }, 5000);
        };
        
        // Set up ping interval for keeping the connection alive
        const pingInterval = setInterval(() => {
          if (newSocket.readyState === WebSocket.OPEN) {
            newSocket.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000); // Send a ping every 30 seconds
        
        return () => {
          clearInterval(pingInterval);
          newSocket.close();
        };
      } catch (error) {
        console.error("Error setting up WebSocket:", error);
        setError("Failed to connect to chat server");
        setIsConnecting(false);
      }
    }
  }, [socket, isConnecting]);
  
  // Send a chat message
  const sendMessage = useCallback((content: string, roomId: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !user) {
      setError("Cannot send message: Not connected or not authenticated");
      return;
    }
    
    if (!subscribedRoomsRef.current.has(roomId)) {
      setError("Cannot send message: Not joined to this room");
      return;
    }
    
    socket.send(JSON.stringify({
      type: "chat_message",
      roomId,
      content
    }));
  }, [socket, user]);
  
  // Join a chat room
  const joinRoom = useCallback((roomId: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError("Cannot join room: Not connected");
      return;
    }
    
    // Add to local tracking
    subscribedRoomsRef.current.add(roomId);
    
    socket.send(JSON.stringify({
      type: "join_room",
      roomId
    }));
  }, [socket]);
  
  // Leave a chat room
  const leaveRoom = useCallback((roomId: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // Remove from local tracking
    subscribedRoomsRef.current.delete(roomId);
    
    socket.send(JSON.stringify({
      type: "leave_room",
      roomId
    }));
    
    // Remove messages from this room from the local state
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg.chatRoomId !== roomId)
    );
    
    // Remove typing indicators for this room
    setUsersTyping(prevTyping => 
      prevTyping.filter(user => user.roomId !== roomId)
    );
  }, [socket]);
  
  // Send typing notification
  const sendTyping = useCallback((roomId: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !user) {
      return;
    }
    
    if (!subscribedRoomsRef.current.has(roomId)) {
      return;
    }
    
    socket.send(JSON.stringify({
      type: "typing",
      roomId
    }));
  }, [socket, user]);
  
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