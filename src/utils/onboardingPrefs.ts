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

// Available categories for selection - tailored for youth, young adults, college, young professionals
export const AVAILABLE_CATEGORIES = [
  // Life Stage
  'College Life',
  'Young Professional',
  'Single',
  'Dating & Relationships',
  'Newlywed',
  // Gender
  'Men',
  'Women',
  // Faith & Growth
  'New to Faith',
  'Bible Study',
  'Prayer',
  'Worship & Music',
  'Apologetics',
  'Missions & Outreach',
  // Interests & Lifestyle
  'Mental Health',
  'Career & Purpose',
  'Creative Arts',
  'Fitness & Sports',
  'Social Events',
  'Small Groups',
] as const;

export type CategoryType = typeof AVAILABLE_CATEGORIES[number];

// Legacy export for backwards compatibility
export const AVAILABLE_TOPICS = AVAILABLE_CATEGORIES;

/**
 * Save location permission status
 */
export async function saveLocationPermissionGranted(granted: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LOCATION_PERMISSION_GRANTED, JSON.stringify(granted));
  } catch (error) {
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
  }
}
