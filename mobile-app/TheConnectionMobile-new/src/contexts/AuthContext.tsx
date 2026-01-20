import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient, { clearAuth } from '../lib/apiClient';

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

interface RegisterResult {
  verificationSent: boolean;
  requiresVerification: boolean;
  email: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<RegisterResult>;
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
      const response = await apiClient.get('/user');
      setUser(response.data);
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status !== 401 && __DEV__) {
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
      const response = await apiClient.post('/login', { username, password });

      // Save JWT token if present (for mobile app API auth)
      if (response.data.token) {
        const { saveAuthToken } = await import('../lib/secureStorage');
        await saveAuthToken(response.data.token);
        if (__DEV__) {
          console.info('JWT token saved successfully');
        }
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
      if (__DEV__) {
        console.error('Login error:', error);
        console.error('Login error response:', error.response?.data);
      }

      // Special handling for EMAIL_NOT_VERIFIED error
      if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        const emailNotVerifiedError = new Error('EMAIL_NOT_VERIFIED') as any;
        emailNotVerifiedError.code = 'EMAIL_NOT_VERIFIED';
        emailNotVerifiedError.email = error.response.data.email;
        throw emailNotVerifiedError;
      }

      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterPayload): Promise<RegisterResult> => {
    try {
      const response = await apiClient.post('/register', data);

      if (__DEV__) {
        console.info('[AUTH] Registration successful');
        console.info('[AUTH] Verification sent:', response.data?.verificationSent);
        console.info('[AUTH] Requires verification:', response.data?.requiresVerification);
      }

      // NOTE: Server no longer issues JWT until email is verified
      // Do NOT set user or save token - user must verify email first

      return {
        verificationSent: response.data?.verificationSent ?? false,
        requiresVerification: response.data?.requiresVerification ?? true,
        email: response.data?.email || data.email,
        message: response.data?.message,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('Registration error:', error);
      }
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      if (__DEV__) {
        console.error('Logout error:', error);
      }
    } finally {
      // SECURITY: Clear all auth data (JWT token, session cookie, user data)
      const { clearAuthData } = await import('../lib/secureStorage');
      await clearAuthData();
      await SecureStore.deleteItemAsync('sessionCookie');
      // Clear in-memory auth headers from axios
      clearAuth();
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
