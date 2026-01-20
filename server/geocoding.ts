/**
 * Geocoding Service for The Connection
 *
 * Supports multiple geocoding providers:
 * 1. Google Maps Geocoding API (recommended for production)
 * 2. Mock data (fallback for development/testing)
 *
 * Configuration:
 * - Set GOOGLE_MAPS_API_KEY in .env to enable Google Maps
 * - If not configured, falls back to mock data for 10 major US cities
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address?: string;
}

export interface GeocodeError {
  error: string;
}

export type GeocodeResponse = GeocodeResult | GeocodeError;

// Check if Google Maps API is configured
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const isGoogleMapsConfigured = !!GOOGLE_MAPS_API_KEY;

if (isGoogleMapsConfigured) {
} else {
  console.warn('⚠️ Google Maps API not configured - using mock geocoding data');
  console.warn('   Set GOOGLE_MAPS_API_KEY in .env for production geocoding');
}

// Mock coordinates for common cities (fallback when API not configured)
const MOCK_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'New York, NY': { lat: 40.7128, lng: -74.0060 },
  'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
  'Chicago, IL': { lat: 41.8781, lng: -87.6298 },
  'Houston, TX': { lat: 29.7604, lng: -95.3698 },
  'Phoenix, AZ': { lat: 33.4484, lng: -112.0740 },
  'Philadelphia, PA': { lat: 39.9526, lng: -75.1652 },
  'San Antonio, TX': { lat: 29.4241, lng: -98.4936 },
  'San Diego, CA': { lat: 32.7157, lng: -117.1611 },
  'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
  'San Jose, CA': { lat: 37.3382, lng: -121.8863 },
};

/**
 * Geocode an address using Google Maps API (if configured) or mock data
 *
 * @param address - Street address (can be empty)
 * @param city - City name
 * @param state - State abbreviation
 * @returns GeocodeResponse with latitude/longitude or error
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string
): Promise<GeocodeResponse> {
  // Use Google Maps API if configured
  if (isGoogleMapsConfigured) {
    try {
      return await geocodeWithGoogleMaps(address, city, state);
    } catch (error: any) {
      console.error('Google Maps geocoding failed, falling back to mock data:', error.message);
      // Fall through to mock data
    }
  }

  // Fallback to mock data
  return geocodeWithMockData(city, state);
}

/**
 * Geocode using Google Maps Geocoding API
 */
async function geocodeWithGoogleMaps(
  address: string,
  city: string,
  state: string
): Promise<GeocodeResponse> {
  const fullAddress = address
    ? `${address}, ${city}, ${state}, USA`
    : `${city}, ${state}, USA`;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', fullAddress);
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY!);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    console.error('Google Maps geocoding error:', data.status, data.error_message);
    return {
      error: `Could not geocode location: ${city}, ${state}`,
    };
  }

  const result = data.results[0];
  const location = result.geometry.location;

  return {
    latitude: location.lat,
    longitude: location.lng,
    formatted_address: result.formatted_address,
  };
}

/**
 * Geocode using mock data (fallback for development/testing)
 */
function geocodeWithMockData(city: string, state: string): GeocodeResponse {
  const locationKey = `${city}, ${state}`.toLowerCase();

  // Check for exact matches first
  for (const [key, coords] of Object.entries(MOCK_COORDINATES)) {
    if (key.toLowerCase() === locationKey) {
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        formatted_address: key,
      };
    }
  }

  // If no exact match, try partial matching
  for (const [key, coords] of Object.entries(MOCK_COORDINATES)) {
    if (
      key.toLowerCase().includes(city.toLowerCase()) ||
      key.toLowerCase().includes(state.toLowerCase())
    ) {
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        formatted_address: key,
      };
    }
  }

  // If no match found, return an error
  return {
    error: `Could not geocode location: ${city}, ${state}. Mock data only includes 10 major US cities. Set GOOGLE_MAPS_API_KEY for full geocoding support.`,
  };
}

/**
 * Reverse geocode - convert lat/lng to address
 * (Only works with Google Maps API)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResponse | { address: string }> {
  if (!isGoogleMapsConfigured) {
    return {
      error: 'Reverse geocoding requires Google Maps API. Set GOOGLE_MAPS_API_KEY in .env',
    };
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${latitude},${longitude}`);
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY!);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return {
        error: `Could not reverse geocode coordinates: ${latitude}, ${longitude}`,
      };
    }

    const result = data.results[0];
    return {
      address: result.formatted_address,
    };
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    return {
      error: `Reverse geocoding failed: ${error.message}`,
    };
  }
}

/**
 * Get geocoding service status
 */
export function getGeocodingStatus() {
  return {
    provider: isGoogleMapsConfigured ? 'Google Maps API' : 'Mock Data',
    configured: isGoogleMapsConfigured,
    mockCitiesAvailable: Object.keys(MOCK_COORDINATES).length,
  };
}
