export const colors = {
  light: {
    // Brand colors
    primary: '#0B132B',
    primaryForeground: '#FFFFFF',
    secondary: '#222D99',
    secondaryForeground: '#FFFFFF',
    accent: '#4A90E2',
    accentForeground: '#FFFFFF',

    // Backgrounds
    background: '#F9FAFB',
    foreground: '#1F2937',
    surface: '#FFFFFF',
    surfaceSecondary: '#F3F4F6',

    // Borders
    border: '#E5E7EB',
    borderLight: '#475569',

    // Status colors
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    success: '#10B981',
    successForeground: '#FFFFFF',
    warning: '#F59E0B',
    info: '#3B82F6',

    // UI elements
    card: '#FFFFFF',
    cardForeground: '#111827',
    muted: '#F3F4F6',
    mutedForeground: '#6B7280',
    input: '#E5E7EB',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
  },
  dark: {
    // Brand colors (adjusted for dark mode)
    primary: '#4A90E2',
    primaryForeground: '#FFFFFF',
    secondary: '#5B6CC6',
    secondaryForeground: '#FFFFFF',
    accent: '#60A5FA',
    accentForeground: '#FFFFFF',

    // Backgrounds - improved contrast
    background: '#0B1120',
    foreground: '#F8FAFC',
    surface: '#1E293B',
    surfaceSecondary: '#334155',

    // Borders - better visibility
    border: '#475569',
    borderLight: '#64748B',

    // Status colors
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    success: '#10B981',
    successForeground: '#FFFFFF',
    warning: '#F59E0B',
    info: '#3B82F6',

    // UI elements - improved contrast
    card: '#1E2A3D',
    cardForeground: '#F8FAFC',
    muted: '#2D3748',
    mutedForeground: '#CBD5E1',
    input: '#2D3748',
    text: '#F8FAFC',
    textSecondary: '#E2E8F0',
    textTertiary: '#CBD5E1',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadows = {
  sm: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  lg: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
} as const;

export const typeScale = {
  xs: 13,
  sm: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
} as const;

export type ColorSet = typeof colors.light | typeof colors.dark;
export type ThemeTokens = {
  colors: ColorSet;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  typeScale: typeof typeScale;
};
