/**
 * Location Service
 * Handles location permissions, geocoding, and distance calculations
 */

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeocodingResult {
  coordinates: Coordinates;
  formattedAddress: string;
}

/**
 * Request location permissions from user
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Get user's current location
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status !== 'granted') {
      const granted = await requestLocationPermission();
      if (!granted) {
        return null;
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Cache the location
    await SecureStore.setItemAsync('userLocation', JSON.stringify(coords));

    return coords;
  } catch (error) {
    console.error('Error getting current location:', error);

    // Try to return cached location
    try {
      const cached = await SecureStore.getItemAsync('userLocation');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Error reading cached location:', e);
    }

    return null;
  }
}

/**
 * Geocode an address string to coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    if (!address || address.trim().length === 0) {
      return null;
    }

    const results = await Location.geocodeAsync(address);

    if (results && results.length > 0) {
      const result = results[0];
      return {
        coordinates: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
        formattedAddress: address,
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates in miles
 * Using Haversine formula
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 1) {
    return '< 1 mi';
  } else if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  } else if (miles < 100) {
    return `${Math.round(miles)} mi`;
  } else {
    return `${Math.round(miles / 10) * 10}+ mi`;
  }
}

/**
 * Check if location services are available
 */
export async function isLocationAvailable(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}
