// App constants and configuration
export const APP_CONFIG = {
  name: 'The Connection',
  version: '1.0.0',
  buildNumber: 1,
};

export const API_CONFIG = {
  // Update this to your production API URL
  baseUrl: __DEV__ 
    ? 'http://localhost:5000/api' 
    : 'https://your-production-domain.com/api',
  timeout: 10000,
};

export const COLORS = {
  primary: '#E73AA4',
  secondary: '#6B46C1',
  accent: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Grays
  gray50: '#F8F9FB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#64748B',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#1A1D29',
  
  // Background
  background: '#F8F9FB',
  surface: '#FFFFFF',
  
  // Text
  textPrimary: '#1A1D29',
  textSecondary: '#64748B',
  textMuted: '#9CA3AF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  xxxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 50,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};