/**
 * Church/Organization API queries
 */

import apiClient from '../lib/apiClient';

// Types
export interface ChurchListItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  denomination: string | null;
  congregationSize: number | null;
}

export interface ChurchLeader {
  id: number;
  name: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  sortOrder: number;
}

export interface ChurchSermon {
  id: number;
  title: string;
  description: string | null;
  speaker: string | null;
  sermonDate: string | null;
  series: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
}

export interface ChurchProfile {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  mission: string | null;
  serviceTimes: string | null;
  socialMedia: string | null;
  foundedDate: string | null;
  congregationSize: number | null;
  denomination: string | null;
  city: string | null;
  state: string | null;
  publicPhone: string | null;
  publicAddress: string | null;
  publicZipCode: string | null;
}

export interface ChurchCapabilities {
  canViewProfile: boolean;
  canViewSermons: boolean;
  canViewCommunities: boolean;
  canJoin: boolean;
  userRole: string;
}

export interface ChurchProfileResponse {
  organization: ChurchProfile;
  capabilities: ChurchCapabilities;
  leaders: ChurchLeader[];
  sermons: ChurchSermon[];
  communities: any[];
  upcomingEvents: any[];
}

export interface ChurchDirectoryResponse {
  items: ChurchListItem[];
  nextCursor: string | null;
}

// API functions
export const churchesAPI = {
  /**
   * Get paginated church directory
   */
  getDirectory: (options?: {
    limit?: number;
    cursor?: string;
    q?: string;
    city?: string;
    state?: string;
    denomination?: string;
  }): Promise<ChurchDirectoryResponse> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);
    if (options?.q) params.append('q', options.q);
    if (options?.city) params.append('city', options.city);
    if (options?.state) params.append('state', options.state);
    if (options?.denomination) params.append('denomination', options.denomination);

    const queryString = params.toString();
    return apiClient.get(`/api/orgs/directory${queryString ? `?${queryString}` : ''}`).then(res => res.data);
  },

  /**
   * Search churches by name
   */
  search: (query: string): Promise<ChurchListItem[]> => {
    if (query.length < 2) return Promise.resolve([]);
    return apiClient.get(`/api/orgs/search?q=${encodeURIComponent(query)}`).then(res => res.data);
  },

  /**
   * Get church profile by slug
   */
  getBySlug: (slug: string): Promise<ChurchProfileResponse> => {
    return apiClient.get(`/api/orgs/${slug}`).then(res => res.data);
  },
};

export default churchesAPI;
