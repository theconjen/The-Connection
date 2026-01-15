import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../lib/apiClient';

interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  bio?: string;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<{ verificationSent: boolean }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/user');
      setUser(response.data);
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status !== 401) {
        console.error('Auth check failed:', error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        checkAuth();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', { username, password });

      // Save JWT token if present (for mobile app API auth)
      if (response.data.token) {
        const { saveAuthToken } = await import('../lib/secureStorage');
        await saveAuthToken(response.data.token);
        console.info('JWT token saved successfully');
      }

      // Extract and save the session cookie directly
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        const sessionCookie = cookies.find((c: string) => c.includes('sessionId='));
        if (sessionCookie) {
          const cookieValue = sessionCookie.split(';')[0];
          // Save directly to SecureStore
          await SecureStore.setItemAsync('sessionCookie', cookieValue);
          
          // Small delay to ensure cookie is persisted
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // If login response contains user data, use it directly
      if (response.data && response.data.id) {
        setUser(response.data);
        setIsLoading(false);
      } else {
        // Otherwise fetch user data
        await checkAuth();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Login error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterPayload) => {
    try {
      const response = await apiClient.post('/api/auth/register', data);

      // Save JWT token if present (for mobile app API auth)
      if (response.data.token) {
        const { saveAuthToken } = await import('../lib/secureStorage');
        await saveAuthToken(response.data.token);
        console.info('JWT token saved successfully after registration');
      }

      // Extract and save the session cookie directly
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        const sessionCookie = cookies.find((c: string) => c.includes('sessionId='));
        if (sessionCookie) {
          const cookieValue = sessionCookie.split(';')[0];
          await SecureStore.setItemAsync('sessionCookie', cookieValue);
          console.info('Session cookie saved after registration');
        }
      }

      // Set user from registration response
      if (response.data && response.data.id) {
        setUser(response.data);
        setIsLoading(false);
      }

      return { verificationSent: false };
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Registration error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear both session cookie and JWT token
      await Promise.all([
        SecureStore.deleteItemAsync('sessionCookie').catch(() => {}),
        SecureStore.deleteItemAsync('auth_token').catch(() => {}),
      ]);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refresh: checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
