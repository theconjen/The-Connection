// Theme tokens matching The Connection official color palette
// Synced with client/src/index.css
export const colors = {
  light: {
    background: '#F5F8FA',     // hsl(220 25% 97%) - Soft White
    foreground: '#0D1829',     // hsl(220 30% 10%) - Deep text
    primary: '#0B132B',        // hsl(225 60% 11%) - Deep Navy Blue
    primaryForeground: '#FFFFFF',
    secondary: '#222D99',      // hsl(230 63% 37%) - Rich Royal Blue
    secondaryForeground: '#FFFFFF',
    accent: '#4A90E2',         // hsl(215 75% 55%) - Blue Accent
    accentForeground: '#FFFFFF',
    border: '#D1D8DE',         // hsl(220 20% 85%)
    muted: '#EAEEF2',          // hsl(220 15% 92%)
    mutedForeground: '#637083', // hsl(220 10% 40%)
    card: '#FFFFFF',
    cardForeground: '#0D1829',
    destructive: '#D83636',    // hsl(0 75% 45%)
    destructiveForeground: '#FFFFFF',
  },
  dark: {
    background: '#0B1220',     // hsl(225 38% 7%) - Deep Navy background
    foreground: '#F5F7FA',     // hsl(225 10% 98%)
    primary: '#1F2A4D',        // hsl(225 70% 25%) - Brighter Navy
    primaryForeground: '#FFFFFF',
    secondary: '#3D4DBF',      // hsl(230 75% 50%) - Brighter Royal Blue
    secondaryForeground: '#FFFFFF',
    accent: '#5AA0F2',         // hsl(215 85% 65%) - Brighter Blue
    accentForeground: '#FFFFFF',
    border: '#3A4557',         // hsl(225 26% 26%)
    muted: '#1D2635',          // hsl(225 28% 16%)
    mutedForeground: '#D9DDE3', // hsl(225 10% 85%)
    card: '#1D2635',           // hsl(225 30% 16%)
    cardForeground: '#F5F7FA',
    destructive: '#EF5A5A',    // hsl(0 80% 55%)
    destructiveForeground: '#FFFFFF',
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
