/**
 * Church/Organization API queries
 */

import apiClient, { sermonsAPI } from '../lib/apiClient';

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

export interface ChurchType {
  id: string;
  label: string;
  denominations: string[];
}

export interface ChurchFilters {
  churchTypes: ChurchType[];
  denominations: string[];
  states: string[];
}

// User Church Affiliation Types
export interface UserChurchAffiliation {
  id: number;
  affiliationType: 'attending' | 'member';
  organizationId: number | null;
  customChurchName: string | null;
  customChurchCity: string | null;
  customChurchState: string | null;
  startedAt: string | null;
  organization: {
    id: number;
    name: string;
    slug: string;
    logoUrl: string | null;
    city: string | null;
    state: string | null;
    denomination: string | null;
  } | null;
}

export interface ChurchInvitationRequest {
  id: number;
  churchName: string;
  churchCity: string | null;
  churchState: string | null;
  status: 'pending' | 'sent' | 'accepted' | 'declined';
  createdAt: string;
}

// Church Bulletin Types (for home screen)
export interface ChurchBulletinEvent {
  id: number;
  title: string;
  eventDate: string;
  startTime: string | null;
  location: string | null;
}

export interface ChurchBulletinSermon {
  id: number;
  title: string;
  speaker: string | null;
  thumbnailUrl: string | null;
  sermonDate: string | null;
}

export interface ChurchBulletinData {
  hasBulletin: boolean;
  church?: {
    id: number;
    name: string;
    slug: string;
    logoUrl: string | null;
    serviceTimes: string | null;
  };
  upcomingEvents?: ChurchBulletinEvent[];
  recentSermons?: ChurchBulletinSermon[];
}

// Sermon Playback Types (MUX + JW Player)
export interface SermonPlaybackResponse {
  sermon: {
    id: number;
    title: string;
    description?: string | null;
    speaker?: string | null;
    sermonDate?: string | null;
    series?: string | null;
    duration?: number | null;
  };
  playback: {
    hlsUrl: string;
    posterUrl?: string | null;
  };
  ads: {
    enabled: boolean;
    tagUrl?: string | null;
  };
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

  /**
   * Get filter options (denominations and states)
   */
  getFilters: (): Promise<ChurchFilters> => {
    return apiClient.get('/api/orgs/filters').then(res => res.data);
  },

  /**
   * Get current user's church affiliation
   */
  getMyAffiliation: (): Promise<{ affiliation: UserChurchAffiliation | null }> => {
    return apiClient.get('/api/user/church-affiliation').then(res => res.data);
  },

  /**
   * Set or update church affiliation
   */
  setAffiliation: (data: {
    organizationId?: number | null;
    customChurchName?: string | null;
    customChurchCity?: string | null;
    customChurchState?: string | null;
    affiliationType: 'attending' | 'member';
    startedAt?: string | null;
  }): Promise<{ affiliation: UserChurchAffiliation }> => {
    return apiClient.put('/api/user/church-affiliation', data).then(res => res.data);
  },

  /**
   * Remove church affiliation
   */
  removeAffiliation: (): Promise<{ success: boolean }> => {
    return apiClient.delete('/api/user/church-affiliation').then(res => res.data);
  },

  /**
   * Request a church to join the platform
   */
  requestChurchInvitation: (data: {
    churchName: string;
    churchEmail: string;
    churchCity?: string;
    churchState?: string;
    churchWebsite?: string;
  }): Promise<{ success: boolean; message: string; request: { id: number; churchName: string; status: string } }> => {
    return apiClient.post('/api/user/request-church-invitation', data).then(res => res.data);
  },

  /**
   * Get user's church invitation requests
   */
  getMyInvitationRequests: (): Promise<{ requests: ChurchInvitationRequest[] }> => {
    return apiClient.get('/api/user/church-invitation-requests').then(res => res.data);
  },

  /**
   * Get connections (mutual follows) who attend this church
   */
  getConnectionsAttending: (orgId: number): Promise<{
    count: number;
    connections: {
      id: number;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      affiliationType: string;
    }[];
  }> => {
    return apiClient.get(`/api/orgs/${orgId}/connections-attending`).then(res => res.data);
  },

  /**
   * Get sermon playback data (MUX HLS stream + JW Player ads config)
   */
  getSermonPlayback: (sermonId: number): Promise<SermonPlaybackResponse> => {
    return sermonsAPI.getPlayback(sermonId);
  },

  /**
   * Get church bulletin for home screen (if user has church affiliation)
   */
  getMyChurchBulletin: (): Promise<ChurchBulletinData> => {
    return apiClient.get('/api/user/church-bulletin').then(res => res.data);
  },
};

export default churchesAPI;
