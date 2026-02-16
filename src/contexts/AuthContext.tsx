import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../lib/apiClient';
import { logger } from '../lib/logger';
import { setSentryUser, clearSentryUser } from '../lib/sentry';
import {
  isBiometricSupported,
  isBiometricLoginEnabled,
  getBiometricType,
  enableBiometricLogin,
  disableBiometricLogin,
  authenticateWithBiometric,
  getBiometricUserId,
} from '../lib/biometricAuth';

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
  dateOfBirth?: string; // Birthday in YYYY-MM-DD format
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dob: string; // Date of birth in YYYY-MM-DD format - required for age verification
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
  // Biometric authentication
  biometricAvailable: boolean;
  biometricType: string;
  biometricEnabled: boolean;
  loginWithBiometric: () => Promise<boolean>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  shouldPromptBiometricSetup: boolean;
  dismissBiometricPrompt: () => void;
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

// Helper to decode JWT payload
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

// Helper to check if JWT token is expired (client-side check)
async function isTokenExpired(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (!token) return true;

    const decoded = decodeJwtPayload(token);
    if (!decoded) return true;

    // Check expiry - JWT exp is in seconds, Date.now() is in milliseconds
    if (decoded.exp) {
      const expiryTime = decoded.exp * 1000;
      const now = Date.now();
      // Consider expired if less than 5 minutes remaining (buffer for clock skew)
      return now > (expiryTime - 5 * 60 * 1000);
    }

    return false; // No exp claim, assume valid
  } catch (error) {
    // If we can't decode, assume expired to trigger re-auth
    return true;
  }
}

// Helper to check if token should be refreshed (older than 1 day)
// This implements "sliding session" - active users stay logged in
async function shouldRefreshToken(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (!token) return false;

    const decoded = decodeJwtPayload(token);
    if (!decoded || !decoded.iat) return false;

    // Token issued at (iat) is in seconds
    const issuedAt = decoded.iat * 1000;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Refresh if token is older than 1 day
    return (now - issuedAt) > oneDayMs;
  } catch {
    return false;
  }
}

// Helper to refresh the auth token
async function refreshAuthToken(): Promise<boolean> {
  try {
    const response = await apiClient.post('/api/auth/refresh');
    if (response.data?.token) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.data.token);
      return true;
    }
    return false;
  } catch (error) {
    // Refresh failed - token may be invalid or expired
    // Don't clear auth here - let the normal 401 handling take care of it
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Biometric authentication state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [shouldPromptBiometricSetup, setShouldPromptBiometricSetup] = useState(false);

  // Check biometric availability on mount
  useEffect(() => {
    async function checkBiometric() {
      const available = await isBiometricSupported();
      setBiometricAvailable(available);
      if (available) {
        const type = await getBiometricType();
        setBiometricType(type);
        const enabled = await isBiometricLoginEnabled();
        setBiometricEnabled(enabled);
      }
    }
    checkBiometric();
  }, []);

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

      // Update user and cache
      setUser(response.data);
      await cacheUserData(response.data);
      setSentryUser(response.data);
      logger.info('Auth verified', { userId: response.data.id });
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 401) {
        // Token is invalid - clear everything
        logger.info('Auth token invalid, logging out');
        setUser(null);
        await cacheUserData(null);
        clearSentryUser();
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {});
      } else {
        // Network error or other issue - keep cached user if we have one
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
        // Step 1: Check if we have a token and if it's expired
        const hasToken = await hasAuthToken();
        const tokenExpired = await isTokenExpired();

        if (!hasToken || tokenExpired) {
          // No token or token is expired - clear everything and show login
          if (tokenExpired && hasToken) {
            // Token was expired - clean up stale data
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {});
            await cacheUserData(null);
          }
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Step 2: Token exists and isn't expired - load cached user for instant display
        const cachedUser = await loadCachedUser();

        if (cachedUser) {
          // Show cached user immediately
          setUser(cachedUser);
          setIsLoading(false);

          // Step 3: Verify in background (don't block UI)
          // This will update user data if needed or log out if token became invalid
          verifyAuth(true);
        } else {
          // We have a valid token but no cached user - need to fetch
          await verifyAuth(false);
        }
      } catch (error) {
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, [verifyAuth]);

  // Re-verify when app comes to foreground and refresh token if needed (sliding session)
  useEffect(() => {
    const handleAppStateChange = async (state: AppStateStatus) => {
      if (state === 'active') {
        // Check if token should be refreshed (older than 1 day)
        // This keeps active users logged in indefinitely
        const needsRefresh = await shouldRefreshToken();
        if (needsRefresh) {
          await refreshAuthToken();
        }

        // Silent refresh user data - don't show loading state
        verifyAuth(true);
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [verifyAuth]);

  const login = async (username: string, password: string) => {
    try {
      logger.info('Login attempt', { username });
      const response = await apiClient.post('/api/auth/login', { username, password });

      // Save JWT token (mobile apps use JWT exclusively, not session cookies)
      if (response.data.token) {
        const token = response.data.token;
        const { saveAuthToken } = await import('../lib/secureStorage');
        await saveAuthToken(token);
      }

      // Fetch complete user data with permissions
      await verifyAuth(false);
      logger.info('Login successful', { username });

      // Check if we should prompt for biometric setup
      if (biometricAvailable && !biometricEnabled) {
        setShouldPromptBiometricSetup(true);
      }
    } catch (error: any) {
      // Special handling for EMAIL_NOT_VERIFIED error
      if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        logger.warn('Login failed - email not verified', { username });
        const emailNotVerifiedError = new Error('EMAIL_NOT_VERIFIED') as any;
        emailNotVerifiedError.code = 'EMAIL_NOT_VERIFIED';
        emailNotVerifiedError.email = error.response.data.email;
        throw emailNotVerifiedError;
      }

      // Pass through the full error response for status code handling (423 lockout, 429 rate limit)
      const status = error.response?.status;
      logger.warn('Login failed', { username, status, code: error.response?.data?.code });
      const authError = new Error(error.response?.data?.message || 'Login failed') as any;
      authError.response = error.response;
      throw authError;
    }
  };

  const register = async (data: RegisterPayload) => {
    try {
      logger.info('Registration attempt', { email: data.email, username: data.username });
      const response = await apiClient.post('/api/auth/register', data);

      logger.info('Registration successful', { email: data.email });

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
      const status = error.response?.status;
      logger.error('Registration failed', error, { email: data.email, status });

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
    const userId = user?.id;
    logger.info('Logout initiated', { userId });
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      logger.warn('Logout API call failed', { userId });
    } finally {
      // Clear all auth data
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {});
      await cacheUserData(null);
      clearSentryUser();
      setUser(null);
      logger.info('Logout completed', { userId });
    }
  };

  // Biometric login - authenticate with Face ID/Touch ID
  const loginWithBiometric = async (): Promise<boolean> => {
    try {
      if (!biometricEnabled) {
        return false;
      }

      // Get stored user ID for biometric
      const storedUserId = await getBiometricUserId();
      if (!storedUserId) {
        return false;
      }

      // Authenticate with biometrics
      const authenticated = await authenticateWithBiometric();
      if (!authenticated) {
        return false;
      }

      // Check if we have a valid auth token
      const hasToken = await hasAuthToken();
      if (!hasToken) {
        // No token - biometric auth alone isn't enough, need to re-login
        logger.warn('Biometric auth succeeded but no token found');
        return false;
      }

      // Verify the token is still valid
      await verifyAuth(false);

      if (user) {
        logger.info('Biometric login successful', { userId: user.id });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Biometric login failed', error);
      return false;
    }
  };

  // Enable biometric login for current user
  const enableBiometric = async (): Promise<boolean> => {
    if (!user) return false;

    const success = await enableBiometricLogin(user.id);
    if (success) {
      setBiometricEnabled(true);
      setShouldPromptBiometricSetup(false);
      logger.info('Biometric login enabled', { userId: user.id });
    }
    return success;
  };

  // Disable biometric login
  const disableBiometric = async (): Promise<void> => {
    await disableBiometricLogin();
    setBiometricEnabled(false);
    logger.info('Biometric login disabled');
  };

  // Dismiss biometric setup prompt
  const dismissBiometricPrompt = () => {
    setShouldPromptBiometricSetup(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refresh: () => verifyAuth(false),
        // Biometric
        biometricAvailable,
        biometricType,
        biometricEnabled,
        loginWithBiometric,
        enableBiometric,
        disableBiometric,
        shouldPromptBiometricSetup,
        dismissBiometricPrompt,
      }}
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
