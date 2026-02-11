/**
 * Location Service
 * Handles geolocation permissions and operations
 */

import { Alert, Platform, Linking } from 'react-native';

// Lazy load expo-location to avoid initialization errors
let Location: any = null;

const getLocation = () => {
  if (!Location) {
    try {
      Location = require('expo-location');
    } catch (error) {
      return null;
    }
  }
  return Location;
};

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
}

/**
 * Request location permissions
 * Shows native permission dialog with the message from app.json
 */
export async function requestLocationPermission(): Promise<boolean> {
  const Loc = getLocation();
  if (!Loc) {
    return false;
  }

  try {
    const { status } = await Loc.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'The Connection needs access to your location to show nearby events and communities. Please enable location access in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if location permission is already granted
 */
export async function hasLocationPermission(): Promise<boolean> {
  const Loc = getLocation();
  if (!Loc) return false;

  try {
    const { status } = await Loc.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

/**
 * Get user's current location
 */
export async function getCurrentLocation(): Promise<UserLocation | null> {
  const Loc = getLocation();
  if (!Loc) {
    return null;
  }

  try {
    // Check permission first
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return null;
    }

    // Get location
    const location = await Loc.getCurrentPositionAsync({
      accuracy: Loc.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    Alert.alert(
      'Location Error',
      'Unable to get your current location. Please make sure location services are enabled on your device.'
    );
    return null;
  }
}

/**
 * Get user's current location with city/region info (reverse geocoding)
 */
export async function getCurrentLocationWithAddress(): Promise<UserLocation | null> {
  const Loc = getLocation();
  if (!Loc) {
    return null;
  }

  try {
    const location = await getCurrentLocation();
    if (!location) return null;

    // Reverse geocode to get address
    const addresses = await Loc.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      return {
        ...location,
        city: address.city || address.subregion || undefined,
        region: address.region || undefined,
        country: address.country || undefined,
      };
    }

    return location;
  } catch (error) {
    // Return location without address if geocoding fails
    return getCurrentLocation();
  }
}

/**
 * Calculate distance between two coordinates (in miles)
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display (in miles)
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)}ft away`;
  } else if (miles < 1) {
    return `${miles.toFixed(1)}mi away`;
  } else if (miles < 10) {
    return `${miles.toFixed(1)}mi away`;
  } else {
    return `${Math.round(miles)}mi away`;
  }
}
