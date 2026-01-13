import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User } from './auth-service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.checkAuth();
      setUser(currentUser);
    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }) => {
    try {
      const response = await authService.register(data);
      setUser(response.user);
    } catch (error) {
      console.error('[AuthContext] Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      // Still clear user state even if logout fails
      setUser(null);
    }
  };

  const verifyEmail = async (code: string) => {
    try {
      await authService.verifyEmail(code);
      // Update user's email verification status
      if (user) {
        setUser({ ...user, isEmailVerified: true });
      }
    } catch (error) {
      console.error('[AuthContext] Email verification failed:', error);
      throw error;
    }
  };

  const resendVerification = async () => {
    try {
      await authService.resendVerificationEmail();
    } catch (error) {
      console.error('[AuthContext] Resend verification failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
