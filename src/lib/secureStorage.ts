/**
 * Secure Storage Utility
 * Provides secure storage for sensitive data like auth tokens
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

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
    // Don't throw - continue gracefully to prevent crashes
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
  ]);
}

const SESSION_KEY = 'session_cookie';

export async function saveSessionCookie(cookie: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(SESSION_KEY, cookie);
    } else {
      await SecureStore.setItemAsync(SESSION_KEY, cookie);
    }
  } catch (error) {
  }
}

export async function getSessionCookie(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(SESSION_KEY);
    } else {
      return await SecureStore.getItemAsync(SESSION_KEY);
    }
  } catch (error) {
    return null;
  }
}

export async function removeSessionCookie(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(SESSION_KEY);
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch (error) {
  }
}
