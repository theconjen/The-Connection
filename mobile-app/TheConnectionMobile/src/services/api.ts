// API service for mobile app
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Community, Microblog, Event, PrayerRequest } from '../types';
import { API_CONFIG } from '../utils/constants';

const API_BASE_URL = API_CONFIG.baseUrl;

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const token = await this.getAuthToken();
      
      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        credentials: 'include', // Include cookies for session authentication
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      return response.text() as any;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ user: User; token?: string }> {
    const response = await this.makeRequest<{ user: User; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      await AsyncStorage.setItem('authToken', response.token);
    }
    return response;
  }

  async register(email: string, password: string, username: string): Promise<{ user: User; token?: string }> {
    const response = await this.makeRequest<{ user: User; token?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
    
    if (response.token) {
      await AsyncStorage.setItem('authToken', response.token);
    }
    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await this.makeRequest('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequest<User>('/user');
  }

  async updateProfile(data: any): Promise<User> {
    return this.makeRequest<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUsers(): Promise<User[]> {
    return this.makeRequest<User[]>('/users');
  }

  async getUserById(userId: number): Promise<User> {
    return this.makeRequest<User>(`/users/${userId}`);
  }

  // Communities
  async getCommunities(): Promise<Community[]> {
    return this.makeRequest<Community[]>('/communities');
  }

  async getCommunityById(id: number): Promise<Community> {
    return this.makeRequest<Community>(`/communities/${id}`);
  }

  async joinCommunity(communityId: number): Promise<void> {
    return this.makeRequest(`/communities/${communityId}/join`, {
      method: 'POST',
    });
  }

  async leaveCommunity(communityId: number): Promise<void> {
    return this.makeRequest(`/communities/${communityId}/leave`, {
      method: 'POST',
    });
  }

  // Microblogs
  async getMicroblogs(filter: string = 'recent'): Promise<Microblog[]> {
    return this.makeRequest<Microblog[]>(`/microblogs?filter=${filter}`);
  }

  async getMicroblogById(id: number): Promise<Microblog> {
    return this.makeRequest<Microblog>(`/microblogs/${id}`);
  }

  async createMicroblog(content: string, imageUrl?: string): Promise<Microblog> {
    return this.makeRequest<Microblog>('/microblogs', {
      method: 'POST',
      body: JSON.stringify({ content, imageUrl }),
    });
  }

  async likeMicroblog(id: number): Promise<void> {
    return this.makeRequest(`/microblogs/${id}/like`, {
      method: 'POST',
    });
  }

  async unlikeMicroblog(id: number): Promise<void> {
    return this.makeRequest(`/microblogs/${id}/like`, {
      method: 'DELETE',
    });
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return this.makeRequest<Event[]>('/events/public');
  }

  async getEventById(id: number): Promise<Event> {
    return this.makeRequest<Event>(`/events/${id}`);
  }

  async joinEvent(id: number): Promise<void> {
    return this.makeRequest(`/events/${id}/join`, {
      method: 'POST',
    });
  }

  // Prayer Requests
  async getPrayerRequests(): Promise<PrayerRequest[]> {
    return this.makeRequest<PrayerRequest[]>('/prayer-requests');
  }

  async createPrayerRequest(title: string, description: string, isAnonymous: boolean = false): Promise<PrayerRequest> {
    return this.makeRequest<PrayerRequest>('/prayer-requests', {
      method: 'POST',
      body: JSON.stringify({ title, description, isAnonymous }),
    });
  }

  async prayForRequest(id: number): Promise<void> {
    return this.makeRequest(`/prayer-requests/${id}/pray`, {
      method: 'POST',
    });
  }

  // Direct Messages
  async getConversations(): Promise<any[]> {
    return this.makeRequest<any[]>('/dms');
  }

  async getMessages(recipientId: number): Promise<any[]> {
    return this.makeRequest<any[]>(`/dms/${recipientId}`);
  }

  async sendMessage(recipientId: number, content: string): Promise<any> {
    return this.makeRequest('/dms', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content }),
    });
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    return this.makeRequest<any[]>('/notifications');
  }

  async markNotificationAsRead(id: number): Promise<void> {
    return this.makeRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  // Image upload
  async uploadImage(imageUri: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);

    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    return response.json();
  }
}

export const apiService = new ApiService();