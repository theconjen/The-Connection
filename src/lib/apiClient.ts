import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import 'react-native-get-random-values'; // Required for uuid in React Native
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

// Get API URL from app config (exclusive to Render backend)
// Always uses Render backend URL from app.json extra config
const getApiBaseUrl = () => {
  // Always use Render backend (no localhost fallback)
  const configApiBase = Constants.expoConfig?.extra?.apiBase;
  if (configApiBase) {
    return configApiBase;
  }

  // Hardcoded fallback to Render backend (never localhost)
  return 'https://api.theconnection.app';
};

const API_BASE_URL = getApiBaseUrl();

// Export for use by SocketContext
export const getApiBase = getApiBaseUrl;


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds - production server can be slow on cold start
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Mobile-App': 'true', // Identifies this as a mobile app (skips CSRF protection on server)
    'X-Requested-With': 'com.theconnection.mobile', // Alternative mobile identifier
  },
  withCredentials: false, // React Native doesn't support automatic cookie handling
});

// Request interceptor to add JWT token and x-request-id for correlation
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Add x-request-id for log correlation (helps debug issues across client/server)
      const requestId = uuidv4();
      config.headers['x-request-id'] = requestId;

      // Store on config for access in response interceptor
      (config as any)._requestId = requestId;

      // Mobile apps use JWT token ONLY (no session cookies)
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Do NOT send session cookies - mobile apps use JWT tokens exclusively
      // Session cookies cause the backend to ignore JWT tokens
    } catch (error) {
      // Silent fail - auth will fail server-side if needed
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to delay execution
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(() => resolve(), ms));

// Response interceptor for error handling and retry logic
apiClient.interceptors.response.use(
  async (response) => {
    // Mobile apps use JWT tokens only - do NOT capture session cookies
    return response;
  },
  async (error) => {
    // CRITICAL: Wrap entire error handler in try-catch - interceptor must never throw
    try {
      const config = error.config;

      // Retry logic for 429 (Too Many Requests) with exponential backoff
      if (error.response?.status === 429 && config) {
        // Initialize retry count
        config._retryCount = config._retryCount || 0;
        const maxRetries = 3;

        if (config._retryCount < maxRetries) {
          config._retryCount += 1;
          const backoffDelay = Math.pow(2, config._retryCount) * 1000; // 2s, 4s, 8s

          await delay(backoffDelay);
          return apiClient(config);
        }
      }

      // Handle 401 (Unauthorized) - clear auth state
      // Skip for login/register endpoints to allow proper error handling
      if (error.response?.status === 401) {
        const url = String(error.config?.url ?? '');
        const isAuthEndpoint = url.includes('/auth/login') ||
                               url.includes('/auth/register') ||
                               url.includes('/auth/verify');

        if (!isAuthEndpoint) {
          // Clear stored token - user needs to re-authenticate
          try {
            const SecureStore = await import('expo-secure-store');
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('cached_user');
          } catch {
            // Silent fail - auth context will handle this
          }
        }
      }

      if (error.response) {
        // Suppress expected errors that are handled gracefully in the UI
        const message = String(error.response.data?.message ?? '');
        const status = error.response.status;
        // FIXED: Use nullish coalescing (??) to handle null values, not just undefined
        const url = String(error.config?.url ?? '');

        // Don't log these expected errors
        const suppressedErrors = [
          { status: 400, messageIncludes: 'Already a member' },
          { status: 400, messageIncludes: 'already a member' },
          { status: 400, messageIncludes: 'Already bookmarked' }, // Bookmark toggle behavior
          { status: 400, messageIncludes: 'Already liked' }, // Like toggle behavior
          { status: 400, url: '/api/library/posts/trending' }, // Trending endpoint - fallback handles this
          { status: 403, messageIncludes: 'You do not have access to this private event' }, // Private events
          { status: 403, messageIncludes: 'Only admins and moderators can view join requests' }, // Expected for non-admins
          { status: 404, url: '/api/microblogs/trending/combined' }, // Backend endpoint not deployed yet
          { status: 404, url: '/api/feed/explore' }, // Explore feed endpoint not deployed yet
          { status: 404, url: '/api/qa-areas' }, // QA areas endpoint not deployed yet
          { status: 404, url: '/api/qa-tags' }, // QA tags endpoint not deployed yet
          { status: 404, url: '/my-rsvp' }, // my-rsvp endpoint not deployed yet
          { status: 404, url: '/api/library/posts/trending' }, // Trending endpoint being deployed
          { status: 404, url: '/nearby-users-count' }, // Nearby users count - server restart needed
          { status: 500, url: '/api/user/suggestions/friends' }, // Friend suggestions being deployed
          { status: 429 }, // Rate limiting - handled by retry logic
        ];

        const shouldSuppress = suppressedErrors.some(
          (suppressed) => {
            try {
              if (suppressed.status !== status) return false;
              if (suppressed.messageIncludes) {
                return message.toLowerCase().includes(suppressed.messageIncludes.toLowerCase());
              }
              if (suppressed.url) {
                // FIXED: Safe string check - url is guaranteed to be a string now
                return url.includes(suppressed.url);
              }
              // If only status is specified (no messageIncludes or url), suppress all errors with that status
              return !suppressed.messageIncludes && !suppressed.url;
            } catch {
              return false; // If any check fails, don't suppress
            }
          }
        );

        // Log non-suppressed API errors to Sentry
        if (!shouldSuppress) {
          const requestId = (error.config as any)?._requestId;
          logger.warn('API error', {
            status,
            url,
            message,
            requestId,
          });
        }
      }
    } catch (interceptorError) {
      // Interceptor must be stable - silent fail
    }
    return Promise.reject(error);
  }
);

// Posts API (Forum posts - supports anonymous posting)
export const postsAPI = {
  create: (data: {
    text: string;
    title?: string;
    communityId?: number;
    imageUrl?: string;
    videoUrl?: string;
    location?: string;
    taggedUserIds?: number[];
    isAnonymous?: boolean; // Forum posts can be anonymous
  }) =>
    apiClient.post('/api/posts', data),
  getAll: () => apiClient.get('/api/posts'),
  getById: (id: number) => apiClient.get(`/api/posts/${id}`),
  upvote: (id: number) => apiClient.post(`/api/posts/${id}/upvote`),
};

// Topic categories for microblogs
export const MICROBLOG_TOPICS = [
  'OBSERVATION',
  'QUESTION',
  'NEWS',
  'CULTURE',
  'ENTERTAINMENT',
  'SCRIPTURE',
  'TESTIMONY',
  'PRAYER',
  'OTHER'
] as const;
export type MicroblogTopic = typeof MICROBLOG_TOPICS[number];

// Post types
export const MICROBLOG_TYPES = ['STANDARD', 'POLL'] as const;
export type MicroblogType = typeof MICROBLOG_TYPES[number];

// Microblogs API (Feed posts - Twitter-like, always public)
export const microblogsAPI = {
  create: (data: {
    content: string;
    topic?: MicroblogTopic;
    postType?: MicroblogType;
    sourceUrl?: string;
    poll?: {
      question: string;
      options: string[];
      endsAt?: string;
      allowMultiple?: boolean;
    };
  }) => apiClient.post('/api/microblogs', data),
  getAll: () => apiClient.get('/api/microblogs'),
  getById: (id: number) => apiClient.get(`/api/microblogs/${id}`),
  like: (id: number) => apiClient.post(`/api/microblogs/${id}/like`),
  unlike: (id: number) => apiClient.delete(`/api/microblogs/${id}/like`),
  delete: (id: number) => apiClient.delete(`/api/microblogs/${id}`),
  bookmark: (id: number) => apiClient.post(`/api/microblogs/${id}/bookmark`),
  unbookmark: (id: number) => apiClient.delete(`/api/microblogs/${id}/bookmark`),
  repost: (id: number) => apiClient.post(`/api/microblogs/${id}/repost`),
  unrepost: (id: number) => apiClient.delete(`/api/microblogs/${id}/repost`),
};

// Explore Feed API
export const exploreFeedAPI = {
  getFeed: (options?: {
    tab?: 'latest' | 'popular';
    topic?: MicroblogTopic;
    type?: MicroblogType;
    cursor?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (options?.tab) params.append('tab', options.tab);
    if (options?.topic) params.append('topic', options.topic);
    if (options?.type) params.append('type', options.type);
    if (options?.cursor) params.append('cursor', options.cursor);
    if (options?.limit) params.append('limit', options.limit.toString());
    const queryString = params.toString();
    return apiClient.get(`/api/feed/explore${queryString ? `?${queryString}` : ''}`).then(res => res.data);
  },
  getTopics: () => apiClient.get('/api/feed/topics').then(res => res.data),
};

// Polls API
export const pollsAPI = {
  vote: (pollId: number, optionId: number) =>
    apiClient.post(`/api/polls/${pollId}/vote`, { optionId }).then(res => res.data),
  voteMultiple: (pollId: number, optionIds: number[]) =>
    apiClient.post(`/api/polls/${pollId}/vote`, { optionIds }).then(res => res.data),
  getResults: (pollId: number) =>
    apiClient.get(`/api/polls/${pollId}`).then(res => res.data),
};

// Communities API
export const communitiesAPI = {
  getAll: () => apiClient.get('/api/communities').then(res => res.data),
  getById: (id: number) => apiClient.get(`/api/communities/${id}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }).then(res => res.data),
  create: (data: {
    name: string;
    description: string;
    iconName?: string;
    iconColor?: string;
    isInviteOnly?: boolean;
    privacySetting?: 'public' | 'private';
    location?: string;
    latitude?: number;
    longitude?: number;
  }) => apiClient.post('/api/communities', data).then(res => res.data),
  join: (id: number) => apiClient.post(`/api/communities/${id}/join`).then(res => res.data),
  leave: (id: number) => apiClient.post(`/api/communities/${id}/leave`).then(res => res.data),
  getMembers: (id: number) => apiClient.get(`/api/communities/${id}/members`).then(res => res.data),
  getWallPosts: (id: number) => apiClient.get(`/api/communities/${id}/wall`).then(res => res.data),
  createWallPost: (id: number, content: string, imageUrl?: string) =>
    apiClient.post(`/api/communities/${id}/wall`, { content, imageUrl }).then(res => res.data),
  deleteWallPost: (communityId: number, postId: number) =>
    apiClient.delete(`/api/communities/${communityId}/wall/${postId}`).then(res => res.data),
  updateMemberRole: (communityId: number, userId: number, role: 'member' | 'moderator') =>
    apiClient.put(`/api/communities/${communityId}/members/${userId}`, { role }).then(res => res.data),
  removeMember: (communityId: number, userId: number) =>
    apiClient.delete(`/api/communities/${communityId}/members/${userId}`).then(res => res.data),

  // Prayer Requests
  getPrayerRequests: (communityId: number) =>
    apiClient.get(`/api/communities/${communityId}/prayer-requests`).then(res => res.data),
  createPrayerRequest: (communityId: number, data: { title: string; content: string; isAnonymous?: boolean }) =>
    apiClient.post(`/api/communities/${communityId}/prayer-requests`, data).then(res => res.data),
  markPrayerAnswered: (communityId: number, prayerId: number, answeredDescription?: string) =>
    apiClient.patch(`/api/communities/${communityId}/prayer-requests/${prayerId}/answered`, { answeredDescription }).then(res => res.data),

  // Join Requests (for private communities)
  getJoinRequests: (communityId: number) =>
    apiClient.get(`/api/communities/${communityId}/join-requests`).then(res => res.data),
  approveJoinRequest: (communityId: number, requestId: number) =>
    apiClient.post(`/api/communities/${communityId}/join-requests/${requestId}/approve`).then(res => res.data),
  denyJoinRequest: (communityId: number, requestId: number) =>
    apiClient.post(`/api/communities/${communityId}/join-requests/${requestId}/deny`).then(res => res.data),
  requestToJoin: (communityId: number) =>
    apiClient.post(`/api/communities/${communityId}/request-join`).then(res => res.data),

  // Community Invitations
  inviteUser: (communityId: number, inviteeId: number, sendDm: boolean = true) =>
    apiClient.post(`/api/communities/${communityId}/invite-user`, { inviteeId, sendDm }).then(res => res.data),
  getPendingInvitations: () =>
    apiClient.get('/api/community-invitations/pending').then(res => res.data),
  acceptInvitation: (invitationId: number) =>
    apiClient.post(`/api/community-invitations/${invitationId}/accept`).then(res => res.data),
  declineInvitation: (invitationId: number) =>
    apiClient.post(`/api/community-invitations/${invitationId}/decline`).then(res => res.data),
};

// Direct Messages API
export const messagesAPI = {
  getConversations: () => apiClient.get('/api/messages/conversations').then(res => res.data),
  getMessages: (otherUserId: number) => apiClient.get(`/api/messages/${otherUserId}`).then(res => res.data),
  sendMessage: (receiverId: number, content: string) =>
    apiClient.post('/api/messages/send', { receiverId, content }).then(res => res.data),
  markConversationRead: (otherUserId: number) =>
    apiClient.post(`/api/messages/mark-conversation-read/${otherUserId}`).then(res => res.data),
  getUnreadCount: () => apiClient.get('/api/messages/unread-count').then(res => res.data),
  deleteMessage: (messageId: number) =>
    apiClient.delete(`/api/messages/${messageId}`).then(res => res.data),
  muteConversation: (userId: number) =>
    apiClient.post(`/api/messages/mute/${userId}`).then(res => res.data),
  unmuteConversation: (userId: number) =>
    apiClient.delete(`/api/messages/mute/${userId}`).then(res => res.data),
  isMuted: (userId: number) =>
    apiClient.get(`/api/messages/mute/${userId}`).then(res => res.data),
};

// Community Chat API
export const chatAPI = {
  getChatRoom: (communityId: number) =>
    apiClient.get(`/api/communities/${communityId}/chat/room`).then(res => res.data),
  getChatMessages: (communityId: number, limit = 50) =>
    apiClient.get(`/api/communities/${communityId}/chat/messages`, { params: { limit } }).then(res => res.data),
};

// Follow/Connection API
export const followAPI = {
  followUser: (userId: number) =>
    apiClient.post(`/api/users/${userId}/follow`).then(res => res.data),
  unfollowUser: (userId: number) =>
    apiClient.delete(`/api/users/${userId}/follow`).then(res => res.data),
  getFollowers: (userId: number) =>
    apiClient.get(`/api/users/${userId}/followers`).then(res => res.data),
  getFollowing: (userId: number) =>
    apiClient.get(`/api/users/${userId}/following`).then(res => res.data),
  getFollowStatus: (userId: number) =>
    apiClient.get(`/api/users/${userId}/follow-status`).then(res => res.data),
  getUserProfile: (userId: number) =>
    apiClient.get(`/api/users/${userId}/profile`).then(res => res.data),
};

// Search API
export const searchAPI = {
  searchUsers: (query: string) =>
    apiClient.get('/api/users', { params: { search: query } }).then(res => res.data),
};

// Events API
export const eventsAPI = {
  getAll: () => apiClient.get('/api/events').then(res => res.data),
  getById: (id: number) => apiClient.get(`/api/events/${id}`).then(res => res.data),
  create: (data: {
    title: string;
    description: string;
    location?: string;
    latitude?: string; // Backend expects strings (text columns)
    longitude?: string;
    eventDate: string; // YYYY-MM-DD format
    startTime: string; // HH:MM:SS format
    endTime: string; // HH:MM:SS format
    communityId?: number | null; // Optional - null for "The Connection" events (app-owner only)
    isPublic?: boolean; // true = visible on main Events page, false = private to community
  }) => apiClient.post('/api/events', data).then(res => res.data),
  update: (id: number, data: Partial<{
    title: string;
    description: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    eventDate: string;
    startTime: string;
    endTime: string;
  }>) => apiClient.patch(`/api/events/${id}`, data).then(res => res.data),
  delete: (id: number) => apiClient.delete(`/api/events/${id}`).then(res => res.data),
  rsvp: (id: number, status: string) =>
    apiClient.post(`/api/events/${id}/rsvp`, { status }).then(res => res.data),
  getAttendees: (id: number) =>
    apiClient.get(`/api/events/${id}/rsvps/manage`).then(res => res.data),
  // Send announcement to all RSVPed attendees (host only)
  announce: (id: number, message: string) =>
    apiClient.post(`/api/events/${id}/announce`, { message }).then(res => res.data),

  // Event Invitations
  inviteUsers: (eventId: number, inviteeIds: number[], sendDm: boolean = true) =>
    apiClient.post(`/api/events/${eventId}/invite`, { inviteeIds, sendDm }).then(res => res.data),
  getPendingInvitations: () =>
    apiClient.get('/api/event-invitations/pending').then(res => res.data),
  acceptInvitation: (invitationId: number) =>
    apiClient.post(`/api/event-invitations/${invitationId}/accept`).then(res => res.data),
  declineInvitation: (invitationId: number) =>
    apiClient.post(`/api/event-invitations/${invitationId}/decline`).then(res => res.data),

  // Nearby Users Invitations (Connection Hosted events only)
  getNearbyUsersCount: (eventId: number, radiusMiles: number = 30) =>
    apiClient.get(`/api/events/${eventId}/nearby-users-count`, { params: { radius: radiusMiles } }).then(res => res.data),
  inviteNearbyUsers: (eventId: number, radiusMiles: number = 30, sendNotifications: boolean = true) =>
    apiClient.post(`/api/events/${eventId}/invite-nearby`, { radiusMiles, sendNotifications }).then(res => res.data),
};

// Safety & Moderation API
export const safetyAPI = {
  // Report content (posts, microblogs, communities, events, etc.)
  reportContent: (data: {
    subjectType: 'post' | 'microblog' | 'community' | 'event' | 'prayer_request' | 'comment';
    subjectId: number;
    reason: 'spam' | 'harassment' | 'inappropriate' | 'hate_speech' | 'false_info' | 'other';
    description?: string;
  }) => apiClient.post('/api/reports', data).then(res => res.data),

  // Report a user
  reportUser: (data: {
    userId: number;
    reason: string;
    description?: string;
  }) => apiClient.post('/api/user-reports', data).then(res => res.data),

  // Block a user
  blockUser: (data: {
    userId: number;
    reason?: string;
  }) => apiClient.post('/api/blocks', data).then(res => res.data),

  // Unblock a user
  unblockUser: (userId: number) =>
    apiClient.delete(`/api/blocks/${userId}`).then(res => res.data),

  // Get list of blocked users
  getBlockedUsers: () =>
    apiClient.get('/api/blocked-users').then(res => res.data),
};

// Sermons API (Video playback with MUX + JW Player)
export const sermonsAPI = {
  // Get playback data for a sermon (includes HLS URL and ads config)
  getPlayback: (sermonId: number) =>
    apiClient.get(`/api/sermons/${sermonId}/playback`).then(res => res.data),
};

// Upload API for profile pictures, event images, etc.
export const uploadAPI = {
  // Upload profile picture - returns the URL of the uploaded image
  uploadProfilePicture: async (imageUri: string, fileName?: string): Promise<{ url: string }> => {
    const formData = new FormData();

    // Get file extension from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1] || 'jpg';
    const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
    const name = fileName || `profile-${Date.now()}.${fileType}`;

    // Append file as form data
    formData.append('image', {
      uri: imageUri,
      name,
      type: mimeType,
    } as any);

    const response = await apiClient.post('/api/upload/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Upload event image
  uploadEventImage: async (imageUri: string, fileName?: string): Promise<{ url: string }> => {
    const formData = new FormData();

    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1] || 'jpg';
    const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
    const name = fileName || `event-${Date.now()}.${fileType}`;

    formData.append('image', {
      uri: imageUri,
      name,
      type: mimeType,
    } as any);

    const response = await apiClient.post('/api/upload/event-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

export default apiClient;
