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
    borderLight: '#D1D5DB',

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
    header: '#7B9CAF', // Earth-toned blue for app header
    headerForeground: '#FFFFFF',
    headerBorder: '#6A8B9D',
    muted: '#F3F4F6',
    mutedForeground: '#6B7280',
    input: '#E5E7EB',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',

    // Social action colors (likes, reposts, bookmarks)
    like: '#F91880',
    likeActive: '#E0176B',
    repost: '#00BA7C',
    repostActive: '#00A56F',
    bookmark: '#1D9BF0',
    bookmarkActive: '#1A8CD8',

    // Icon colors
    icon: '#536471',
    iconActive: '#0F1419',
  },
  dark: {
    // Brand colors (adjusted for dark mode with better vibrancy)
    primary: '#5BA3F5',
    primaryForeground: '#FFFFFF',
    secondary: '#6B7DD9',
    secondaryForeground: '#FFFFFF',
    accent: '#70AEFF',
    accentForeground: '#FFFFFF',

    // Backgrounds - optimized for OLED and reduced eye strain
    background: '#0F1419',
    foreground: '#E7E9EA',
    surface: '#16181C',
    surfaceSecondary: '#1C1F23',

    // Borders - improved visibility in dark mode
    border: '#2F3336',
    borderLight: '#3E4347',

    // Status colors - improved contrast and visibility
    destructive: '#FF6B6B',
    destructiveForeground: '#FFFFFF',
    success: '#51CF66',
    successForeground: '#000000',
    warning: '#FFD43B',
    info: '#74C0FC',

    // UI elements - optimized contrast ratios (WCAG AAA)
    card: '#16181C',
    cardForeground: '#FFFFFF',
    header: '#5A7B8F', // Slightly lighter earth-toned blue for dark mode
    headerForeground: '#FFFFFF',
    headerBorder: '#4A6B7F',
    muted: '#1C1F23',
    mutedForeground: '#9CA3AF',
    input: '#1C1F23',
    text: '#E7E9EA',
    textSecondary: '#9CA3AF',
    textTertiary: '#B4B9BE',

    // Social action colors (likes, reposts, bookmarks)
    like: '#F91880',
    likeActive: '#FF2D96',
    repost: '#00BA7C',
    repostActive: '#00D68F',
    bookmark: '#1D9BF0',
    bookmarkActive: '#3DAEFF',

    // Icon colors
    icon: '#9CA3AF',
    iconActive: '#E7E9EA',
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
