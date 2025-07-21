// Shared types for the mobile app
export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  onboardingCompleted: boolean;
  isVerifiedApologeticsAnswerer: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  createdAt: string;
}

export interface Microblog {
  id: number;
  content: string;
  userId: number;
  user: User;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: string;
  isVirtual: boolean;
  createdAt: string;
}

export interface PrayerRequest {
  id: number;
  title: string;
  content: string;
  userId: number;
  user: User;
  isAnonymous: boolean;
  prayersCount: number;
  createdAt: string;
}

export type RootStackParamList = {
  Home: undefined;
  Communities: undefined;
  Microblogs: undefined;
  Events: undefined;
  PrayerRequests: undefined;
  Profile: undefined;
  Auth: undefined;
};