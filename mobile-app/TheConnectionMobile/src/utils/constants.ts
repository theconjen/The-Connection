// Configuration constants for the mobile app
export const API_CONFIG = {
  baseUrl: __DEV__ ? 'http://localhost:5000/api' : 'https://your-production-domain.com/api',
  timeout: 30000,
  retryAttempts: 3,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  SETTINGS: 'appSettings',
  OFFLINE_DATA: 'offlineData',
};

export const COLORS = {
  primary: '#E91E63',
  primaryLight: '#FF6B9D',
  secondary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F8F9FB',
  surface: '#FFFFFF',
  text: '#1A1D29',
  textSecondary: '#64748B',
  border: '#E1E5E9',
};

export const SIZES = {
  touchTarget: 44,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
};

export const FONTS = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    title: 24,
    heading: 28,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const HAPTIC_PATTERNS = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
} as const;