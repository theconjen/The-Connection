/**
 * Onboarding Preferences Storage
 * Handles local storage of onboarding data: location, topics, and completion status
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  LOCATION_PERMISSION_GRANTED: 'onboarding_location_granted',
  LAST_KNOWN_COORDS: 'onboarding_last_coords',
  SELECTED_TOPICS: 'onboarding_selected_topics',
  START_HERE_COMPLETED: 'onboarding_start_here_completed',
} as const;

// Types
export interface StoredCoords {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface OnboardingPrefs {
  locationPermissionGranted: boolean;
  lastKnownCoords: StoredCoords | null;
  selectedTopics: string[];
  startHereCompleted: boolean;
}

// Available topics for selection
export const AVAILABLE_TOPICS = [
  'Bible Study',
  'Theology',
  'Prayer',
  'Church Life',
  'Discipleship',
  'Apologetics',
  'Missions',
  'Marriage',
  'Parenting',
  'Young Adults',
  'Local Events',
  'Men\'s Ministry',
  'Women\'s Ministry',
] as const;

export type TopicType = typeof AVAILABLE_TOPICS[number];

/**
 * Save location permission status
 */
export async function saveLocationPermissionGranted(granted: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LOCATION_PERMISSION_GRANTED, JSON.stringify(granted));
  } catch (error) {
    console.error('Error saving location permission status:', error);
  }
}

/**
 * Get location permission status
 */
export async function getLocationPermissionGranted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEYS.LOCATION_PERMISSION_GRANTED);
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.error('Error getting location permission status:', error);
    return false;
  }
}

/**
 * Save last known coordinates
 */
export async function saveLastKnownCoords(coords: { latitude: number; longitude: number }): Promise<void> {
  try {
    const storedCoords: StoredCoords = {
      ...coords,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(KEYS.LAST_KNOWN_COORDS, JSON.stringify(storedCoords));
  } catch (error) {
    console.error('Error saving coordinates:', error);
  }
}

/**
 * Get last known coordinates
 * Returns null if not stored or expired (older than 24 hours)
 */
export async function getLastKnownCoords(): Promise<StoredCoords | null> {
  try {
    const value = await AsyncStorage.getItem(KEYS.LAST_KNOWN_COORDS);
    if (!value) return null;

    const coords: StoredCoords = JSON.parse(value);

    // Check if coords are expired (older than 24 hours)
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (Date.now() - coords.timestamp > twentyFourHours) {
      return null;
    }

    return coords;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
}

/**
 * Save selected topics
 */
export async function saveSelectedTopics(topics: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SELECTED_TOPICS, JSON.stringify(topics));
  } catch (error) {
    console.error('Error saving topics:', error);
  }
}

/**
 * Get selected topics
 */
export async function getSelectedTopics(): Promise<string[]> {
  try {
    const value = await AsyncStorage.getItem(KEYS.SELECTED_TOPICS);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error getting topics:', error);
    return [];
  }
}

/**
 * Mark Start Here as completed
 */
export async function setStartHereCompleted(completed: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.START_HERE_COMPLETED, JSON.stringify(completed));
  } catch (error) {
    console.error('Error saving Start Here completion status:', error);
  }
}

/**
 * Check if Start Here has been completed
 */
export async function isStartHereCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEYS.START_HERE_COMPLETED);
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.error('Error getting Start Here completion status:', error);
    return false;
  }
}

/**
 * Get all onboarding preferences
 */
export async function getAllOnboardingPrefs(): Promise<OnboardingPrefs> {
  const [locationPermissionGranted, lastKnownCoords, selectedTopics, startHereCompleted] = await Promise.all([
    getLocationPermissionGranted(),
    getLastKnownCoords(),
    getSelectedTopics(),
    isStartHereCompleted(),
  ]);

  return {
    locationPermissionGranted,
    lastKnownCoords,
    selectedTopics,
    startHereCompleted,
  };
}

/**
 * Clear all onboarding preferences (for testing/reset)
 */
export async function clearOnboardingPrefs(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.LOCATION_PERMISSION_GRANTED),
      AsyncStorage.removeItem(KEYS.LAST_KNOWN_COORDS),
      AsyncStorage.removeItem(KEYS.SELECTED_TOPICS),
      AsyncStorage.removeItem(KEYS.START_HERE_COMPLETED),
    ]);
  } catch (error) {
    console.error('Error clearing onboarding preferences:', error);
  }
}
