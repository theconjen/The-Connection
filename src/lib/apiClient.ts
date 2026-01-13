import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use API URL from environment variables
// TEMPORARY: Hardcoded for debugging
const API_BASE_URL = 'https://api.theconnection.app';

console.log('[API Client] Using API URL:', API_BASE_URL);
console.log('[API Client] Testing API connection...');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // React Native doesn't support automatic cookie handling
});

// Request interceptor to add JWT token and session cookie
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Try JWT token first (preferred for mobile)
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
        console.info('[API] Using JWT token for auth');
      } else {
        console.warn('[API] No JWT token found');
      }

      // Also try session cookie as fallback
      const sessionCookie = await SecureStore.getItemAsync('sessionCookie');
      if (sessionCookie) {
        config.headers['Cookie'] = sessionCookie;
        console.info('[API] Using session cookie for auth');
      } else {
        console.warn('[API] No session cookie found');
      }

      console.info('[API Request]', config.method?.toUpperCase(), config.url);
    } catch (error) {
      console.error('Error reading auth credentials:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to capture session cookie
apiClient.interceptors.response.use(
  async (response) => {
    console.info('[API Response]', response.status, response.config.url);
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const sessionCookie = cookies.find((c: string) => c.includes('sessionId='));
      if (sessionCookie) {
        const cookieValue = sessionCookie.split(';')[0];
        await SecureStore.setItemAsync('sessionCookie', cookieValue);
      }
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Suppress expected errors that are handled gracefully in the UI
      const message = error.response.data?.message || '';
      const status = error.response.status;
      const url = error.config?.url || '';

      // Don't log these expected errors
      const suppressedErrors = [
        { status: 400, messageIncludes: 'Already a member' },
        { status: 400, messageIncludes: 'already a member' },
      ];

      const shouldSuppress = suppressedErrors.some(
        (suppressed) =>
          status === suppressed.status &&
          message.toLowerCase().includes(suppressed.messageIncludes.toLowerCase())
      );

      if (!shouldSuppress) {
        console.error('[API Error]', status, url, error.response.data);
      }
    } else {
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

// Posts API
export const postsAPI = {
  create: (data: { text: string; title?: string; communityId?: number; imageUrl?: string; videoUrl?: string; location?: string; taggedUserIds?: number[] }) =>
    apiClient.post('/api/posts', data),
  getAll: () => apiClient.get('/api/posts'),
  getById: (id: number) => apiClient.get(`/api/posts/${id}`),
  upvote: (id: number) => apiClient.post(`/api/posts/${id}/upvote`),
};

// Communities API
export const communitiesAPI = {
  getAll: () => apiClient.get('/api/communities').then(res => res.data),
  getById: (id: number) => apiClient.get(`/api/communities/${id}`).then(res => res.data),
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
  }) => {
    return apiClient.post('/api/communities', data).then(res => {
      return res.data;
    }).catch(err => {
      console.error('API: Create community failed:', err.response?.status, err.response?.data);
      throw err;
    });
  },
  join: (id: number) => apiClient.post(`/api/communities/${id}/join`).then(res => res.data),
  leave: (id: number) => apiClient.post(`/api/communities/${id}/leave`).then(res => res.data),
  getMembers: (id: number) => apiClient.get(`/api/communities/${id}/members`).then(res => res.data),
  getWallPosts: (id: number) => apiClient.get(`/api/communities/${id}/wall`).then(res => res.data),
  createWallPost: (id: number, content: string) =>
    apiClient.post(`/api/communities/${id}/wall`, { content }).then(res => res.data),
  deleteWallPost: (communityId: number, postId: number) =>
    apiClient.delete(`/api/communities/${communityId}/wall/${postId}`).then(res => res.data),
  updateMemberRole: (communityId: number, userId: number, role: 'member' | 'moderator') =>
    apiClient.put(`/api/communities/${communityId}/members/${userId}`, { role }).then(res => res.data),
  removeMember: (communityId: number, userId: number) =>
    apiClient.delete(`/api/communities/${communityId}/members/${userId}`).then(res => res.data),
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

// Events API
export const eventsAPI = {
  getAll: () => apiClient.get('/api/events').then(res => res.data),
  getById: (id: number) => apiClient.get(`/api/events/${id}`).then(res => res.data),
  create: (data: {
    title: string;
    description: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    startTime: string;
    endTime?: string;
    communityId?: number;
  }) => apiClient.post('/api/events', data).then(res => res.data),
  update: (id: number, data: Partial<{
    title: string;
    description: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    startTime: string;
    endTime?: string;
  }>) => apiClient.put(`/api/events/${id}`, data).then(res => res.data),
  delete: (id: number) => apiClient.delete(`/api/events/${id}`).then(res => res.data),
  rsvp: (id: number, status: string) =>
    apiClient.post(`/api/events/${id}/rsvp`, { status }).then(res => res.data),
};

export default apiClient;
