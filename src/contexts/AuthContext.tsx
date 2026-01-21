import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../lib/apiClient';

// Keys for SecureStore
const AUTH_TOKEN_KEY = 'auth_token';
const CACHED_USER_KEY = 'cached_user';

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

// Helper to save user data to cache
async function cacheUserData(user: User | null) {
  try {
    if (user) {
      await SecureStore.setItemAsync(CACHED_USER_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(CACHED_USER_KEY);
    }
  } catch (error) {
    console.warn('[AuthContext] Failed to cache user data:', error);
  }
}

// Helper to load cached user data
async function loadCachedUser(): Promise<User | null> {
  try {
    const cached = await SecureStore.getItemAsync(CACHED_USER_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('[AuthContext] Failed to load cached user:', error);
  }
  return null;
}

// Helper to check if we have a stored auth token
async function hasAuthToken(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return !!token;
  } catch (error) {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify auth with server and update user data
  const verifyAuth = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      // Check if we have a token first
      const hasToken = await hasAuthToken();
      if (!hasToken) {
        // No token - user is definitely not logged in
        setUser(null);
        await cacheUserData(null);
        setIsLoading(false);
        return;
      }

      // We have a token - verify with server
      const response = await apiClient.get('/api/user');
      console.info('[AuthContext] API response data:', JSON.stringify(response.data, null, 2));
      console.info('[AuthContext] Permissions in response:', response.data?.permissions);

      // Update user and cache
      setUser(response.data);
      await cacheUserData(response.data);
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 401) {
        // Token is invalid - clear everything
        setUser(null);
        await cacheUserData(null);
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {});
      } else {
        // Network error or other issue - keep cached user if we have one
        console.warn('[AuthContext] Auth verification failed:', error);
        // Don't clear user on network errors to allow offline usage
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load - use cached data for instant display
  useEffect(() => {
    async function initializeAuth() {
      try {
        // Step 1: Immediately load cached user (instant, no network)
        const cachedUser = await loadCachedUser();
        const hasToken = await hasAuthToken();

        if (cachedUser && hasToken) {
          // We have cached user data and token - show immediately
          console.info('[AuthContext] Loaded cached user:', cachedUser.username);
          setUser(cachedUser);
          setIsLoading(false);

          // Step 2: Verify in background (don't block UI)
          verifyAuth(true);
        } else if (hasToken) {
          // We have token but no cached user - need to fetch
          console.info('[AuthContext] Has token but no cached user - fetching...');
          await verifyAuth(false);
        } else {
          // No token - definitely not logged in
          console.info('[AuthContext] No auth token found');
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Init error:', error);
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, [verifyAuth]);

  // Re-verify when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        // Silent refresh - don't show loading state
        verifyAuth(true);
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [verifyAuth]);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', { username, password });

      // Save JWT token (mobile apps use JWT exclusively, not session cookies)
      if (response.data.token) {
        const token = response.data.token;
        const tokenParts = token.split('.');

        console.info('[AUTH] Login successful - Received JWT token');
        console.info('[AUTH] Token format valid:', tokenParts.length === 3 ? 'YES (3 parts)' : `NO (${tokenParts.length} parts)`);

        const { saveAuthToken } = await import('../lib/secureStorage');
        await saveAuthToken(token);
        console.info('[AUTH] JWT token saved to SecureStore successfully');
      } else {
        console.error('[AUTH] No JWT token in login response - authentication may fail');
      }

      // Fetch complete user data with permissions
      console.info('[AUTH] Login successful, fetching complete user data with permissions...');
      await verifyAuth(false);
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Login error response:', error.response?.data);

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
      console.info('[AUTH] Verification sent:', response.data?.verificationSent);
      console.info('[AUTH] Requires verification:', response.data?.requiresVerification);

      // NOTE: Server no longer issues JWT until email is verified
      // Do NOT set user or save token - user must verify email first
      // The response contains user data for display purposes only

      return {
        verificationSent: response.data?.verificationSent ?? false,
        requiresVerification: response.data?.requiresVerification ?? true,
        email: response.data?.email || data.email,
        message: response.data?.message,
      };
    } catch (error: any) {
      console.error('[AUTH] Registration error:', error);
      console.error('[AUTH] Registration error status:', error.response?.status);
      console.error('[AUTH] Registration error response:', error.response?.data);

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
      // Clear all auth data
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {});
      await cacheUserData(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refresh: () => verifyAuth(false) }}
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
