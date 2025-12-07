import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import apiClient from '../lib/apiClient';

interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
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
      const response = await apiClient.get('/user');
      setUser(response.data);
    } catch (error) {
      // 401 simply means the user is not logged in; avoid noisy error logs
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

  // Refresh auth when app returns to the foreground
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
      await apiClient.post('/login', { username, password });
      await checkAuth();
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterPayload) => {
    try {
      await apiClient.post('/register', data);
      // Trigger a verification email right after sign-up so the user can complete registration.
      try {
        await apiClient.post('/auth/send-verification', { email: data.email });
        return { verificationSent: true };
      } catch (sendError) {
        console.error('Verification email send failed:', sendError);
        return { verificationSent: false };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
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
