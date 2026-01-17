// Brand colors - source of truth for brand identity
export const brandColors = {
  light: {
    primary: '#0B132B',
    secondary: '#222D99',
    accent: '#4A90E2',
    header: '#7B9CAF',
  },
  dark: {
    primary: '#0F1833',
    secondary: '#2B3BBD',
    accent: '#6AA8FF',
    header: '#8FA6BD',
  },
} as const;

export const colors = {
  light: {
    // Brand colors (use sparingly for buttons, highlights, CTAs)
    primary: brandColors.light.primary,
    primaryForeground: '#FFFFFF',
    secondary: brandColors.light.secondary,
    secondaryForeground: '#FFFFFF',
    accent: brandColors.light.accent,
    accentForeground: '#FFFFFF',
    header: brandColors.light.header,
    headerForeground: '#FFFFFF',

    // Surfaces - earthy, editorial, paper-like
    background: '#EFEAE5',        // Main screen background
    foreground: '#1A1A1A',
    surface: '#F8F4EF',           // Cards, panels
    surfaceSecondary: '#F2EDE8',  // Nested cards, replies
    surfaceNested: '#F2EDE8',     // Secondary panels
    surfaceMuted: '#E9E3DD',      // Dividers, subtle sections

    // Backgrounds (semantic aliases)
    card: '#F8F4EF',              // Card background
    cardNested: '#F2EDE8',        // Nested card background
    cardForeground: '#1A1A1A',

    // Borders - warm tones
    border: '#E5DFD9',            // Card borders, separators
    borderLight: '#DCD6D0',       // Very faint dividers
    borderSubtle: '#DCD6D0',
    headerBorder: '#E5DFD9',

    // Text - hierarchy
    text: '#1A1A1A',              // Headlines, titles
    textPrimary: '#1A1A1A',
    textSecondary: '#5B5B5B',     // Body text, labels
    textTertiary: '#7A736D',      // Breadcrumbs, metadata
    textMuted: '#7A736D',

    // Pills / Chips / Tags
    pillInactiveBg: '#F3EFE9',
    pillInactiveBorder: '#E1DBD3',
    pillInactiveText: '#5B5B5B',
    pillActiveBg: '#2B2B2B',
    pillActiveBorder: '#2B2B2B',
    pillActiveText: '#FFFFFF',

    // Status colors - Inbox states
    statusNew: '#4A90E2',
    statusAccepted: '#6AA8FF',
    statusAnswered: '#5FD6A3',
    statusDeclined: '#F2A1A8',

    // Legacy status colors (for compatibility)
    destructive: '#F2A1A8',
    destructiveForeground: '#FFFFFF',
    success: '#5FD6A3',
    successForeground: '#1A1A1A',
    warning: '#F59E0B',
    info: '#4A90E2',

    // Input
    input: '#E5DFD9',
    muted: '#E9E3DD',
    mutedForeground: '#7A736D',

    // Social action colors (likes, reposts, bookmarks)
    like: '#F91880',
    likeActive: '#E0176B',
    repost: '#00BA7C',
    repostActive: '#00A56F',
    bookmark: '#1D9BF0',
    bookmarkActive: '#1A8CD8',

    // Icon colors
    icon: '#5B5B5B',
    iconActive: '#1A1A1A',
  },
  dark: {
    // Brand colors (corrected for dark mode contrast)
    primary: brandColors.dark.primary,
    primaryForeground: '#FFFFFF',
    secondary: brandColors.dark.secondary,
    secondaryForeground: '#FFFFFF',
    accent: brandColors.dark.accent,
    accentForeground: '#FFFFFF',
    header: brandColors.dark.header,
    headerForeground: '#FFFFFF',

    // Surfaces - deep, clean, premium
    background: '#0A0F1A',        // Main screen background
    foreground: '#F1F4F7',
    surface: '#111826',           // Cards, panels
    surfaceSecondary: '#161E30',  // Nested cards, replies
    surfaceNested: '#161E30',     // Secondary panels
    surfaceMuted: '#0F1523',      // Subtle sections

    // Backgrounds (semantic aliases)
    card: '#111826',              // Card background
    cardNested: '#161E30',        // Nested card background
    cardForeground: '#F1F4F7',

    // Borders - subtle dark tones
    border: '#1F2A3F',            // Card borders
    borderLight: '#1A2336',       // Subtle dividers
    borderSubtle: '#1A2336',
    headerBorder: '#1F2A3F',

    // Text - hierarchy
    text: '#F1F4F7',              // Primary text
    textPrimary: '#F1F4F7',
    textSecondary: '#B6C2D2',     // Secondary text
    textTertiary: '#8FA0B5',      // Muted text
    textMuted: '#8FA0B5',

    // Pills / Chips / Tags (Dark)
    pillInactiveBg: '#141C2C',
    pillInactiveBorder: '#1F2A3F',
    pillInactiveText: '#B6C2D2',
    pillActiveBg: '#F1F4F7',
    pillActiveBorder: '#F1F4F7',
    pillActiveText: '#0A0F1A',

    // Status colors - Inbox states (dark)
    statusNew: '#6AA8FF',
    statusAccepted: '#8AD4FF',
    statusAnswered: '#8AFFC4',
    statusDeclined: '#FF9AA2',

    // Legacy status colors (for compatibility)
    destructive: '#FF9AA2',
    destructiveForeground: '#0A0F1A',
    success: '#8AFFC4',
    successForeground: '#0A0F1A',
    warning: '#FFD43B',
    info: '#6AA8FF',

    // Input
    input: '#161E30',
    muted: '#0F1523',
    mutedForeground: '#8FA0B5',

    // Social action colors (likes, reposts, bookmarks)
    like: '#F91880',
    likeActive: '#FF2D96',
    repost: '#00BA7C',
    repostActive: '#00D68F',
    bookmark: '#1D9BF0',
    bookmarkActive: '#3DAEFF',

    // Icon colors
    icon: '#B6C2D2',
    iconActive: '#F1F4F7',
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
