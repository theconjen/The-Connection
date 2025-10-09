export const colors = {
  light: {
    background: '#F2F6FA',
    foreground: '#1F2937',
    primary: '#0B132B',
    primaryForeground: '#FFFFFF',
    secondary: '#222D99',
    accent: '#4A90E2',
    border: '#E5E7EB',
    muted: '#F3F4F6',
  },
  dark: {
    background: '#0B1220',
    foreground: '#E5E7EB',
    primary: '#1F2A4D',
    primaryForeground: '#FFFFFF',
    secondary: '#2F3BC7',
    accent: '#5AA0F2',
    border: '#353F4A',
    muted: '#141923',
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
