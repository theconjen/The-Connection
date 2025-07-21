// API service for mobile app
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Community, Microblog, Event, PrayerRequest } from '../types';

const API_BASE_URL = 'https://your-api-domain.com/api'; // Replace with your actual API URL

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.makeRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    await AsyncStorage.setItem('authToken', response.token);
    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequest<User>('/user');
  }

  // Communities
  async getCommunities(): Promise<Community[]> {
    return this.makeRequest<Community[]>('/communities');
  }

  // Microblogs
  async getMicroblogs(): Promise<Microblog[]> {
    return this.makeRequest<Microblog[]>('/microblogs');
  }

  async createMicroblog(content: string): Promise<Microblog> {
    return this.makeRequest<Microblog>('/microblogs', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return this.makeRequest<Event[]>('/events/public');
  }

  // Prayer Requests
  async getPrayerRequests(): Promise<PrayerRequest[]> {
    return this.makeRequest<PrayerRequest[]>('/prayer-requests');
  }

  async createPrayerRequest(title: string, content: string, isAnonymous: boolean): Promise<PrayerRequest> {
    return this.makeRequest<PrayerRequest>('/prayer-requests', {
      method: 'POST',
      body: JSON.stringify({ title, content, isAnonymous }),
    });
  }
}

export const apiService = new ApiService();