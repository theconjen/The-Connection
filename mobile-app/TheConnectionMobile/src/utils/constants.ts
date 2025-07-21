import Constants from 'expo-constants';

export const API_CONFIG = {
  baseUrl: __DEV__ 
    ? 'http://localhost:5000/api' 
    : 'https://your-production-domain.com/api',
  timeout: 10000,
};

export const SOCKET_CONFIG = {
  url: __DEV__ 
    ? 'http://localhost:5000' 
    : 'https://your-production-domain.com',
  options: {
    transports: ['websocket'],
    autoConnect: true,
  },
};

export const COLORS = {
  primary: '#E91E63',
  secondary: '#9C27B0',
  background: '#F8F9FB',
  surface: '#FFFFFF',
  text: '#1A1625',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const GRADIENTS = {
  primary: ['#E91E63', '#9C27B0'],
  secondary: ['#3B82F6', '#8B5CF6'],
  success: ['#10B981', '#059669'],
  warm: ['#F59E0B', '#D97706'],
};

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 50,
};

export const SHADOW = {
  small: {
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  medium: {
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const ANIMATION = {
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
  },
};

export const PERMISSIONS = {
  camera: 'Allow The Connection to access your camera to share photos and videos with your community.',
  photos: 'Allow The Connection to access your photos to share with your community.',
  location: 'Allow The Connection to use your location to connect you with nearby Christians and local events.',
  notifications: 'Allow The Connection to send you notifications about prayer requests, messages, and community updates.',
};

export const APP_CONFIG = {
  name: 'The Connection',
  version: Constants.expoConfig?.version || '1.0.0',
  buildNumber: Constants.expoConfig?.ios?.buildNumber || '1',
  bundleId: Constants.expoConfig?.ios?.bundleIdentifier || 'com.theconnection.mobile',
  androidPackage: Constants.expoConfig?.android?.package || 'com.theconnection.mobile',
};

export const SOCIAL_FEATURES = {
  maxPostLength: 500,
  maxCommentLength: 200,
  maxBioLength: 150,
  maxUsernameLength: 30,
  minPasswordLength: 6,
};

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 50,
};

export const CACHE_KEYS = {
  user: 'user',
  authToken: 'authToken',
  preferences: 'preferences',
  lastSeen: 'lastSeen',
};

export const ROUTES = {
  auth: 'Auth',
  home: 'Home',
  microblogs: 'Microblogs',
  communities: 'Communities',
  prayerRequests: 'PrayerRequests',
  events: 'Events',
  bibleStudy: 'BibleStudy',
  apologetics: 'Apologetics',
  messages: 'Messages',
  profile: 'Profile',
};

export default {
  API_CONFIG,
  SOCKET_CONFIG,
  COLORS,
  GRADIENTS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOW,
  ANIMATION,
  PERMISSIONS,
  APP_CONFIG,
  SOCIAL_FEATURES,
  PAGINATION,
  CACHE_KEYS,
  ROUTES,
};