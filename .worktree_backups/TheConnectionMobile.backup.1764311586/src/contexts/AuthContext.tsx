/**
 * Authentication Context
 * Manages authentication state and provides auth methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User, LoginCredentials, RegisterData } from '../lib/apiClient';
import {
  saveAuthToken,
  saveUserData,
  getAuthToken,
  getUserData,
  clearAuthData
} from '../lib/secureStorage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize auth state on app launch
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Check if user has valid session on app launch
   */
  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check if we have a stored token
      const token = await getAuthToken();
      const storedUser = await getUserData();

      if (token && storedUser) {
        // We have stored credentials, verify with server
        try {
          // Add timeout to prevent hanging indefinitely
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Auth check timed out')), 10000);
          });

          const currentUser = await Promise.race([
            authAPI.getCurrentUser(),
            timeoutPromise,
          ]);

          setUser(currentUser);
          // Update stored user data in case it changed
          await saveUserData(currentUser);
        } catch (error) {
          // Token is invalid, expired, or network error
          console.log('Stored token is invalid or network error, clearing auth data:', error);
          await clearAuthData().catch(err => {
            console.error('Error clearing auth data:', err);
          });
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Don't throw - just set user to null and continue
      setUser(null);
    } finally {
      // Always set loading to false so app doesn't hang
      setIsLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      // Note: The backend uses session-based auth, not JWT
      // For mobile, we'll need to handle this differently
      // For now, we'll call the login endpoint and get the user back
      const userData = await authAPI.login(credentials);

      // Save user data locally
      await saveUserData(userData);
      // For session-based auth, we might need to save a session token
      // or use cookies. For now, we'll save a placeholder token
      await saveAuthToken('session-active');

      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterData) => {
    try {
      const userData = await authAPI.register(data);

      // Save user data locally
      await saveUserData(userData);
      await saveAuthToken('session-active');

      setUser(userData);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      // Call logout endpoint
      try {
        await authAPI.logout();
      } catch (error) {
        // Continue with local logout even if API call fails
        console.error('Logout API call failed:', error);
      }

      // Clear local auth data
      await clearAuthData();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
      await saveUserData(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, user might be logged out
      await clearAuthData();
      setUser(null);
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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
