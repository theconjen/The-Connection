/**
 * Design Token System
 * Semantic color system for light and dark modes
 * Premium, modern, non-cringey palette with warm paper (light) and ink night (dark)
 */

import { typography } from './typography';

// Brand identity colors (use for primary actions, headers, highlights)
export const brandColors = {
  primary: '#0B132B',      // Ink navy
  secondary: '#222D99',    // Deep blue
  accent: '#4A90E2',       // Sky blue
  header: '#7B9CAF',       // Soft blue-gray
} as const;

// Optional accent colors (use sparingly for visual variety)
export const accentColors = {
  gold: '#C7A45B',
  sage: '#7C8F78',
  terracotta: '#B56A55',
} as const;

// Semantic color tokens - Light Mode
export const lightColors = {
  // Backgrounds
  background: '#F3EFE9',        // Warm paper
  backgroundSoft: '#F7F5F1',    // Panels/sheets
  surface: '#FFFFFF',           // Cards
  surfaceMuted: '#ECE7E1',      // Chips, segmented, subtle sections

  // Text
  textPrimary: '#0B132B',       // Ink
  textSecondary: '#3A3F50',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  // Borders
  borderSubtle: '#E2DED7',
  borderSoft: '#D6D2CB',

  // Icons
  iconDefault: '#6B7280',
  iconMuted: '#9CA3AF',
  iconActive: '#4A90E2',

  // Buttons
  buttonPrimaryBg: '#0B132B',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#222D99',
  buttonSecondaryText: '#FFFFFF',
  buttonOutlineBorder: '#0B132B',
  buttonOutlineText: '#0B132B',

  // Links & Focus
  link: '#4A90E2',
  focusRing: '#7B9CAF',

  // Status
  success: '#2E7D32',
  warning: '#B26A00',
  danger: '#B00020',
  info: '#4A90E2',

  // Social actions
  like: '#F91880',
  likeActive: '#E0176B',
  repost: '#00BA7C',
  repostActive: '#00A56F',
  bookmark: '#4A90E2',
  bookmarkActive: '#1A8CD8',

  // Input
  input: '#E2DED7',
  inputFocus: '#D6D2CB',

  // Brand (for compatibility)
  primary: brandColors.primary,
  primaryForeground: '#FFFFFF',
  secondary: brandColors.secondary,
  secondaryForeground: '#FFFFFF',
  accent: brandColors.accent,
  accentForeground: '#FFFFFF',
  header: brandColors.header,
  headerForeground: '#FFFFFF',
} as const;

// Semantic color tokens - Dark Mode
export const darkColors = {
  // Backgrounds
  background: '#0A0F1C',        // Deep ink (not pure black)
  backgroundSoft: '#101623',    // Panels/sheets
  surface: '#141A2A',           // Cards
  surfaceMuted: '#1A2032',      // Chips, segmented, subtle sections

  // Text
  textPrimary: '#F3EFE9',       // Paper
  textSecondary: '#D8D3CC',
  textMuted: '#9AA0AA',
  textInverse: '#0A0F1C',

  // Borders
  borderSubtle: '#1F263A',
  borderSoft: '#262E45',

  // Icons
  iconDefault: '#9AA0AA',
  iconMuted: '#6B7280',
  iconActive: '#4A90E2',

  // Buttons
  buttonPrimaryBg: '#F3EFE9',
  buttonPrimaryText: '#0A0F1C',
  buttonSecondaryBg: '#4A90E2',
  buttonSecondaryText: '#0A0F1C',
  buttonOutlineBorder: '#F3EFE9',
  buttonOutlineText: '#F3EFE9',

  // Links & Focus
  link: '#7B9CAF',
  focusRing: '#4A90E2',

  // Status
  success: '#66BB6A',
  warning: '#FFB74D',
  danger: '#EF5350',
  info: '#4A90E2',

  // Social actions
  like: '#F91880',
  likeActive: '#FF2D96',
  repost: '#00BA7C',
  repostActive: '#00D68F',
  bookmark: '#4A90E2',
  bookmarkActive: '#3DAEFF',

  // Input
  input: '#1F263A',
  inputFocus: '#262E45',

  // Brand (for compatibility)
  primary: '#F3EFE9',
  primaryForeground: '#0A0F1C',
  secondary: '#4A90E2',
  secondaryForeground: '#0A0F1C',
  accent: '#7B9CAF',
  accentForeground: '#0A0F1C',
  header: '#8FA6BD',
  headerForeground: '#0A0F1C',
} as const;

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Border radius scale
export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Shadow definitions
export const shadows = {
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
} as const;

// Typography - imported from typography.ts (Figtree font system)
export { typography } from './typography';

// Legacy typeScale for backwards compatibility
export const typeScale = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  '2xl': 28,
} as const;

// Combined color object for backwards compatibility
export const colors = {
  light: lightColors,
  dark: darkColors,
} as const;

// Type exports
export type ColorSet = typeof lightColors | typeof darkColors;
export type ThemeMode = 'light' | 'dark';
export type ThemeTokens = {
  colors: ColorSet;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  typography: typeof typography;
};
