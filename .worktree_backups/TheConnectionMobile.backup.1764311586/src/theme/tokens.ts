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
    borderLight: '#F3F4F6',

    // Status colors
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    success: '#10B981',
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

    // Backgrounds
    background: '#0F172A',
    foreground: '#F1F5F9',
    surface: '#1E293B',
    surfaceSecondary: '#334155',

    // Borders
    border: '#334155',
    borderLight: '#475569',

    // Status colors
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',

    // UI elements
    card: '#1E293B',
    cardForeground: '#F1F5F9',
    muted: '#334155',
    mutedForeground: '#94A3B8',
    input: '#334155',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
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
} as const;

export const shadows = {
  sm: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  lg: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
} as const;

export const typeScale = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
} as const;

export type ColorSet = typeof colors.light | typeof colors.dark;
export type ThemeTokens = {
  colors: ColorSet;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  typeScale: typeof typeScale;
};
