import { Platform } from 'react-native';
import type * as ExpoNotifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const STORAGE_KEY = 'tc_expo_push_token';

function getNotifications(): typeof ExpoNotifications | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // Use require so missing native module doesn't crash at import time
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
}

const _notifications = getNotifications();
if (_notifications?.setNotificationHandler) {
  _notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function requestPushPermission() {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const permissionRequest = await Notifications.requestPermissionsAsync();
    finalStatus = permissionRequest.status;
  }

  return finalStatus === 'granted';
}

async function fetchExpoPushToken() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.extra?.projectId;
  const Notifications = getNotifications();
  if (!Notifications) return null;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return tokenResponse.data;
}

async function saveToken(token: string) {
  await AsyncStorage.setItem(STORAGE_KEY, token);
}

export async function ensurePushTokenRegistered() {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const Notifications = getNotifications();
  if (!Notifications) {
    // Native notifications not available in this runtime (Expo Go/dev-client without module).
    // Skip registration gracefully.
    return null;
  }

  const granted = await requestPushPermission();
  if (!granted) {
    return null;
  }

  const token = await fetchExpoPushToken();
  await apiClient.post('/push-tokens/register', { token, platform: Platform.OS });
  await saveToken(token);
  return token;
}

export async function unregisterStoredPushToken() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  try {
    await apiClient.post('/push-tokens/unregister', { token: stored });
  } catch (error) {
    console.warn('Failed to unregister push token, continuing logout flow', error);
  }

  await AsyncStorage.removeItem(STORAGE_KEY);
}
