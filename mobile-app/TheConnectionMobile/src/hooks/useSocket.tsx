import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../utils/constants';

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
}

export const useSocket = (userId?: number): UseSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    const newSocket = io(API_CONFIG.baseUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      setError(null);
      
      // Join user-specific room for real-time updates
      newSocket.emit('join_user_room', userId);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      setError(null);
    });

    newSocket.on('reconnect_error', (err) => {
      console.error('Socket reconnection error:', err);
      setError('Failed to reconnect');
    });

    // Cleanup function
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return {
    socket: socketRef.current,
    connected,
    error,
  };
};

export default useSocket;