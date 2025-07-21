import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../utils/constants';

export const useSocket = (userId?: number) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const initSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        
        const socketUrl = __DEV__ 
          ? 'http://localhost:5000' 
          : 'https://your-production-domain.com';

        socketRef.current = io(socketUrl, {
          auth: {
            token,
            userId,
          },
          transports: ['websocket'],
        });

        socketRef.current.on('connect', () => {
          console.log('Socket connected');
          setIsConnected(true);
          setError(null);
        });

        socketRef.current.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        socketRef.current.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setError(err.message);
          setIsConnected(false);
        });

        // Join user's personal room
        socketRef.current.emit('join', `user_${userId}`);

      } catch (err) {
        console.error('Failed to initialize socket:', err);
        setError('Failed to connect to real-time services');
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);

  const emit = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off,
  };
};