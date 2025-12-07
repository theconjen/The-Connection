import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const STORAGE_KEY = 'tc_expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function requestPushPermission() {
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
  const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return tokenResponse.data;
}

async function saveToken(token: string) {
  await AsyncStorage.setItem(STORAGE_KEY, token);
}

export async function ensurePushTokenRegistered() {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

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
