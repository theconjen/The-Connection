/**
 * The Connection - React Native Theme Tokens
 * 
 * Design system matching the web app's official color palette.
 * Import this file to access colors, spacing, typography, and shadows.
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  light: {
    background: '#F5F8FA',           // Soft White
    foreground: '#0D1829',           // Deep text
    primary: '#0B132B',              // Deep Navy Blue
    primaryForeground: '#FFFFFF',
    secondary: '#222D99',            // Rich Royal Blue
    secondaryForeground: '#FFFFFF',
    accent: '#4A90E2',               // Blue Accent
    accentForeground: '#FFFFFF',
    border: '#D1D8DE',
    muted: '#EAEEF2',
    mutedForeground: '#637083',
    card: '#FFFFFF',
    cardForeground: '#0D1829',
    destructive: '#D83636',
    destructiveForeground: '#FFFFFF',
    // Additional semantic colors
    success: '#22C55E',
    successForeground: '#FFFFFF',
    warning: '#F59E0B',
    warningForeground: '#FFFFFF',
    // Legacy / convenience aliases used across mobile code
    text: '#0D1829',
    textSecondary: '#637083',
    surface: '#FFFFFF',
    surfaceSecondary: '#EAEEF2',
    input: '#D1D8DE',
    borderLight: '#D1D8DE',
  },
  dark: {
    background: '#0B1220',           // Deep Navy background
    foreground: '#F5F7FA',
    primary: '#1F2A4D',              // Brighter Navy
    primaryForeground: '#FFFFFF',
    secondary: '#3D4DBF',            // Brighter Royal Blue
    secondaryForeground: '#FFFFFF',
    accent: '#5AA0F2',               // Brighter Blue
    accentForeground: '#FFFFFF',
    border: '#3A4557',
    muted: '#1D2635',
    mutedForeground: '#D9DDE3',
    card: '#1D2635',
    cardForeground: '#F5F7FA',
    destructive: '#EF5A5A',
    destructiveForeground: '#FFFFFF',
    // Additional semantic colors
    success: '#4ADE80',
    successForeground: '#FFFFFF',
    warning: '#FBBF24',
    warningForeground: '#0D1829',
    // Legacy / convenience aliases used across mobile code
    text: '#F5F7FA',
    textSecondary: '#D9DDE3',
    surface: '#1D2635',
    surfaceSecondary: '#1D2635',
    input: '#3A4557',
    borderLight: '#3A4557',
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const radii = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ============================================================================
// SHADOWS (React Native format)
// ============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const fontFamily = {
  // Update these to match your actual loaded fonts
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ColorScheme = 'light' | 'dark';
export type ColorSet = typeof colors.light;
// AnyColorSet covers either light or dark color sets (used when runtime may be either)
export type AnyColorSet = typeof colors[keyof typeof colors];
export type SpacingKey = keyof typeof spacing;
export type RadiiKey = keyof typeof radii;
export type ShadowKey = keyof typeof shadows;
export type FontSizeKey = keyof typeof fontSize;

// Backwards-compatible alias used in some older mobile files
export const typeScale = fontSize;

// Aggregate theme tokens type used by some ThemeProvider implementations
export type ThemeTokens = {
  colors: AnyColorSet;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  typeScale: typeof fontSize;
};

