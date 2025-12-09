/**
 * API Client
 * Centralized HTTP client with authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBase } from '../config';
import { getAuthToken } from './secureStorage';

// Get API base URL from environment
const API_BASE_URL = getApiBase();

console.log('API Base URL:', API_BASE_URL);

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add auth token to requests
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error adding auth token to request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Unauthorized - likely signed out/expired. Skip noisy logging.
      } else if (status === 403) {
        console.log('Forbidden - insufficient permissions');
      } else if (status === 404) {
        console.log('Resource not found');
      } else if (status >= 500) {
        const payload = error.response?.data;
        try {
          console.error('Server error:', typeof payload === 'object' ? JSON.stringify(payload) : payload);
        } catch (e) {
          console.error('Server error: <unserializable payload>');
        }
      }
    } else if (error.request) {
      console.error('Network error - no response received');
    } else {
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiClient.post('/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post('/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/user');
    return response.data;
  },

  requestMagicCode: async (email: string): Promise<{ token: string; message: string }> => {
    const response = await apiClient.post('/auth/magic', { email });
    return response.data;
  },

  verifyMagicCode: async (token: string, code: string): Promise<{ token: string; user: User }> => {
    const response = await apiClient.post('/auth/verify', { token, code });
    return response.data;
  },
};

export const communitiesAPI = {
  getAll: async () => {
    const response = await apiClient.get('/communities');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/communities/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/communities', data);
    return response.data;
  },

  join: async (id: number) => {
    const response = await apiClient.post(`/communities/${id}/join`);
    return response.data;
  },

  leave: async (id: number) => {
    const response = await apiClient.post(`/communities/${id}/leave`);
    return response.data;
  },

  getWallPosts: async (id: number) => {
    const response = await apiClient.get(`/communities/${id}/wall`);
    return response.data;
  },

  createWallPost: async (id: number, content: string) => {
    const response = await apiClient.post(`/communities/${id}/wall`, { content });
    return response.data;
  },

  getMembers: async (id: number) => {
    const response = await apiClient.get(`/communities/${id}/members`);
    return response.data;
  },
};

export const postsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/posts');
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/posts', data);
    return response.data;
  },

  upvote: async (id: number) => {
    const response = await apiClient.post(`/posts/${id}/upvote`);
    return response.data;
  },
};

export const eventsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/events');
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/events', data);
    return response.data;
  },

  rsvp: async (id: number, status: string) => {
    const response = await apiClient.post(`/events/${id}/rsvp`, { status });
    return response.data;
  },
};

export const prayerRequestsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/prayer-requests');
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/prayer-requests', data);
    return response.data;
  },

  pray: async (id: number) => {
    const response = await apiClient.post(`/prayer-requests/${id}/pray`);
    return response.data;
  },
};

export const blockedUsersAPI = {
  getAll: async () => {
    const response = await apiClient.get('/blocked-users');
    return response.data;
  },

  block: async (userId: number) => {
    const response = await apiClient.post('/blocked-users', { blockedUserId: userId });
    return response.data;
  },

  unblock: async (userId: number) => {
    const response = await apiClient.delete(`/blocked-users/${userId}`);
    return response.data;
  },
};

export const adminAPI = {
  getStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  getReports: async () => {
    const response = await apiClient.get('/admin/reports');
    return response.data;
  },

  moderateContent: async (contentType: string, contentId: number, action: string) => {
    const response = await apiClient.post('/admin/moderate', {
      contentType,
      contentId,
      action,
    });
    return response.data;
  },
};

export const searchAPI = {
  global: async (query: string) => {
    const response = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  users: async (query: string) => {
    const response = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};
