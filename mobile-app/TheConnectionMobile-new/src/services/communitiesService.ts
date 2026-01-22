/**
 * Communities Service - API calls for community discovery with filters
 */

import apiClient from '../lib/apiClient';

export interface CommunityFilters {
  ageGroup?: string[];
  gender?: string[];
  ministryTypes?: string[];
  activities?: string[];
  professions?: string[];
  recoverySupport?: string[];
  meetingType?: string[];
  frequency?: string[];
  lifeStages?: string[];
  parentCategories?: string[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface Community {
  id: number;
  name: string;
  description: string;
  slug: string;
  iconName: string;
  iconColor: string;
  memberCount: number;
  isPrivate: boolean;
  ageGroup?: string;
  gender?: string;
  ministryTypes?: string[];
  activities?: string[];
  professions?: string[];
  recoverySupport?: string[];
  meetingType?: string;
  frequency?: string;
  lifeStages?: string[];
  parentCategories?: string[];
  latitude?: string;
  longitude?: string;
  distance?: number | null;
  createdAt: string;
}

export async function fetchCommunities(
  searchQuery?: string,
  filters?: Record<string, string[]>,
  userLocation?: UserLocation | null,
  maxDistance?: number | null
): Promise<Community[]> {
  try {
    const params = new URLSearchParams();

    // Add search query
    if (searchQuery && searchQuery.trim()) {
      params.append('search', searchQuery);
    }

    // Add user location for distance calculation
    if (userLocation) {
      params.append('userLat', userLocation.latitude.toString());
      params.append('userLng', userLocation.longitude.toString());
    }

    // Add max distance filter (in miles)
    if (maxDistance !== null && maxDistance !== undefined) {
      params.append('maxDistance', maxDistance.toString());
    }

    // Add filters
    if (filters) {
      Object.entries(filters).forEach(([key, values]) => {
        if (values && values.length > 0) {
          // For single-value filters (ageGroup, gender, meetingType, frequency)
          if (key === 'ageGroup' || key === 'gender' || key === 'meetingType' || key === 'frequency') {
            params.append(key, values[0]); // Take first value
          } else {
            // For multi-value filters (arrays)
            params.append(key, values.join(','));
          }
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/api/communities?${queryString}` : '/api/communities';

    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching communities:', error);
    throw error;
  }
}

export async function fetchCommunity(idOrSlug: string | number): Promise<Community> {
  try {
    const response = await apiClient.get(`/api/communities/${idOrSlug}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching community:', error);
    throw error;
  }
}
