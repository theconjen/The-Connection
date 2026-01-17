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
  onboardingCompleted?: boolean;
  role?: string; // admin, pastor, leader, member
  permissions?: string[]; // inbox_access, manage_experts, etc.
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
      // Use /api/user to get user data
      const response = await apiClient.get('/api/user');
      console.info('[AuthContext] API response data:', JSON.stringify(response.data, null, 2));
      console.info('[AuthContext] Permissions in response:', response.data?.permissions);
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

      // Save JWT token (mobile apps use JWT exclusively, not session cookies)
      if (response.data.token) {
        const token = response.data.token;
        const tokenParts = token.split('.');

        console.info('[AUTH] 🔑 Login successful - Received JWT token');
        console.info('[AUTH] Token format valid:', tokenParts.length === 3 ? '✓ YES (3 parts)' : `✗ NO (${tokenParts.length} parts)`);
        console.info('[AUTH] Token preview:', token.substring(0, 50) + '...');

        const { saveAuthToken } = await import('../lib/secureStorage');
        await saveAuthToken(token);
        console.info('[AUTH] ✓ JWT token saved to SecureStore successfully');
      } else {
        console.error('[AUTH] ✗ No JWT token in login response - authentication may fail');
        console.error('[AUTH] Response data:', JSON.stringify(response.data, null, 2));
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
      console.info('[AUTH] Starting registration with data:', {
        email: data.email,
        username: data.username,
        hasPassword: !!data.password,
        passwordLength: data.password?.length,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      const response = await apiClient.post('/api/auth/register', data);

      console.info('[AUTH] Registration successful, user ID:', response.data?.id);

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
      console.error('[AUTH] Registration error:', error);
      console.error('[AUTH] Registration error status:', error.response?.status);
      console.error('[AUTH] Registration error response:', error.response?.data);
      console.error('[AUTH] Full error object:', JSON.stringify(error, null, 2));

      // More specific error messages
      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again in a moment.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Registration failed. Please check your connection and try again.');
      }
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear JWT token (mobile apps don't use session cookies)
      await SecureStore.deleteItemAsync('auth_token').catch(() => {});
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
