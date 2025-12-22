/**
 * Secure Storage Utility
 * Provides secure storage for sensitive data like auth tokens
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const SESSION_COOKIE_KEY = 'session_cookie';

/**
 * Store auth token securely
 * Uses SecureStore on native, AsyncStorage on web
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error saving auth token:', error);
    // Don't throw - continue gracefully to prevent crashes
  }
}

/**
 * Retrieve auth token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Remove auth token (for logout)
 */
export async function removeAuthToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error removing auth token:', error);
    // Don't throw - continue gracefully to prevent crashes
  }
}

/**
 * Persist the raw Set-Cookie header so we can manually attach it on platforms
 * where the fetch/XHR implementation does not manage cookies automatically
 * (notably some React Native runtimes).
 */
export async function saveSessionCookie(cookie: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(SESSION_COOKIE_KEY, cookie);
    } else {
      await SecureStore.setItemAsync(SESSION_COOKIE_KEY, cookie);
    }
  } catch (error) {
    console.error('Error saving session cookie:', error);
  }
}

/**
 * Retrieve a previously stored Set-Cookie header value.
 */
export async function getSessionCookie(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(SESSION_COOKIE_KEY);
    } else {
      return await SecureStore.getItemAsync(SESSION_COOKIE_KEY);
    }
  } catch (error) {
    console.error('Error getting session cookie:', error);
    return null;
  }
}

/**
 * Remove the persisted cookie value (e.g., on logout).
 */
export async function removeSessionCookie(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(SESSION_COOKIE_KEY);
    } else {
      await SecureStore.deleteItemAsync(SESSION_COOKIE_KEY);
    }
  } catch (error) {
    console.error('Error removing session cookie:', error);
  }
}

/**
 * Store user data
 */
export async function saveUserData(userData: any): Promise<void> {
  try {
    const jsonValue = JSON.stringify(userData);
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(USER_KEY, jsonValue);
    } else {
      await SecureStore.setItemAsync(USER_KEY, jsonValue);
    }
  } catch (error) {
    console.error('Error saving user data:', error);
    // Don't throw - continue gracefully to prevent crashes
  }
}

/**
 * Retrieve user data
 */
export async function getUserData(): Promise<any | null> {
  try {
    let jsonValue: string | null;
    if (Platform.OS === 'web') {
      jsonValue = await AsyncStorage.getItem(USER_KEY);
    } else {
      jsonValue = await SecureStore.getItemAsync(USER_KEY);
    }
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Remove user data (for logout)
 */
export async function removeUserData(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.error('Error removing user data:', error);
    // Don't throw - continue gracefully to prevent crashes
  }
}

/**
 * Clear all auth data (complete logout)
 */
export async function clearAuthData(): Promise<void> {
  await Promise.all([
    removeAuthToken(),
    removeUserData(),
    removeSessionCookie(),
  ]);
}
