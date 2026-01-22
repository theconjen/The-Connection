/**
 * Design Token System
 * Semantic color system for light and dark modes
 * Earth-forward palette: warm, grounded, contemplative, trustworthy, reverent, human
 *
 * BLUE USAGE RESTRICTED TO:
 * - App title text
 * - Active tab underline
 * - Inline links
 * - Primary CTA text (NOT background fills)
 */

import { typography } from './typography';

// Brand identity colors
export const brandColors = {
  primary: '#0B132B',      // Ink navy - text only, never bg fills
  secondary: '#5C6B5E',    // Sage green (earth tone) - replaces blue
  accent: '#7C8F78',       // Sage accent - primary earth tone
  header: '#F3EFE9',       // Warm paper
} as const;

// Earth accent colors (primary decorative palette)
export const accentColors = {
  gold: '#C7A45B',         // Warm gold
  sage: '#7C8F78',         // PRIMARY earth accent
  sageMuted: '#9BA89D',    // Lighter sage for inactive states
  sageDeep: '#5C6B5E',     // Deeper sage for emphasis
  terracotta: '#B56A55',   // Warm terracotta (secondary)
  cream: '#E8E4DC',        // Warm cream
} as const;

// Blue - RESTRICTED usage only (links, active underlines, critical CTAs)
export const restrictedBlue = {
  link: '#4A6FA5',         // Muted blue for links only
  activeUnderline: '#3D5A80', // Active tab underline only
} as const;

// Semantic color tokens - Light Mode (Earth-Forward)
export const lightColors = {
  // Backgrounds (unchanged - warm paper)
  background: '#F3EFE9',        // Warm paper - KEEP
  backgroundSoft: '#F7F5F1',    // Panels/sheets - KEEP
  surface: '#FFFFFF',           // Cards
  surfaceMuted: '#ECE7E1',      // Chips, segmented, subtle sections
  surfaceMutedForeground: '#5C6B5E', // Earth tone for muted surfaces

  // Text
  textPrimary: '#0B132B',       // Ink - KEEP
  textSecondary: '#4A4F5C',     // Warmer gray
  textMuted: '#6B7264',         // Earth-tinted muted
  textInverse: '#FFFFFF',

  // Borders (warmer)
  borderSubtle: '#DDD8D0',      // Warmer
  borderSoft: '#C9C4BB',        // Warmer
  borderEarth: '#C9D4C9',       // Sage-tinted border (subtle)
  headerBorder: '#D6D2CB',      // Subtle warm divider below header

  // Icons - Darker for contrast on warm paper
  iconDefault: '#4A4F45',       // Dark earth gray
  iconMuted: '#6B7264',         // Medium earth gray
  iconActive: '#0B132B',        // Ink for active
  iconInactive: '#7C8F78',      // Sage for inactive tabs
  iconHeader: '#0B132B',        // Ink for header icons

  // Buttons - Earth forward, no blue fills
  buttonPrimaryBg: '#F3EFE9',     // Warm paper bg (not blue fill)
  buttonPrimaryText: '#0B132B',   // Ink text
  buttonPrimaryIcon: '#0B132B',   // Ink icon
  buttonPrimaryBorder: '#5C6B5E', // Sage border
  buttonSecondaryBg: '#ECE7E1', // Surface muted
  buttonSecondaryText: '#0B132B',
  buttonSecondaryBorder: '#7C8F78', // Sage
  buttonOutlineBorder: '#5C6B5E',
  buttonOutlineText: '#0B132B',

  // Links & Focus - ONLY place for blue
  link: '#4A6FA5',              // Muted blue - links ONLY
  focusRing: '#7C8F78',         // Sage focus ring

  // Status
  success: '#5C6B5E',           // Sage green (was bright green)
  warning: '#B26A00',           // Keep warm
  danger: '#A03030',            // Warmer red
  destructive: '#A03030',       // Alias for danger (red regardless of mode)
  info: '#6B7B6E',              // Sage-gray (NOT blue)

  // Social actions - Keep distinctive but warmer
  like: '#C4636A',              // Warmer rose (was hot pink)
  likeActive: '#B05058',
  repost: '#7C8F78',            // Sage accent
  repostActive: '#5C6B5E',
  bookmark: '#7C8F78',          // Sage (was blue)
  bookmarkActive: '#5C6B5E',

  // Input
  input: '#E2DED7',
  inputFocus: '#C9C4BB',

  // Tabs - Earth tones
  tabActive: '#0B132B',         // Ink for active text
  tabActiveUnderline: '#7C8F78', // Sage accent underline
  tabInactive: '#9BA89D',       // Muted sage
  tabInactiveBg: '#ECE7E1',     // Surface muted

  // Chips - Earth tones
  chipBg: '#ECE7E1',            // Surface muted
  chipBgActive: '#D4DFCF',      // Light sage
  chipText: '#5C6B5E',          // Sage text
  chipTextActive: '#0B132B',    // Ink when active

  // Brand (updated for earth-forward)
  primary: '#0B132B',           // Ink - text only
  primaryForeground: '#FFFFFF',
  secondary: '#5C6B5E',         // Sage (was blue)
  secondaryForeground: '#FFFFFF',
  accent: '#7C8F78',            // Sage accent (was sky blue)
  accentForeground: '#0B132B',
  header: '#F3EFE9',            // Warm paper
  headerForeground: '#0B132B',  // Ink text on warm paper

  // Earth palette direct access
  sage: '#7C8F78',
  sageMuted: '#9BA89D',
  sageDeep: '#5C6B5E',
  terracotta: '#B56A55',
  gold: '#C7A45B',
} as const;

// Semantic color tokens - Dark Mode (FIXED: Contrast hierarchy restored)
// PRINCIPLE: Earth tones on surfaces, NOT on the void (background)
export const darkColors = {
  // Backgrounds - Deep ink/neutral charcoal (NO green/sage/olive)
  background: '#0F0F12',        // Deep ink - neutral, slightly warm, NO green
  backgroundSoft: '#16161A',    // Slightly lighter ink - still neutral
  surface: '#1E1D22',           // Warm charcoal (brown/ink undertone) - earth lives HERE
  surfaceMuted: '#26252B',      // Slightly lighter warm charcoal
  surfaceMutedForeground: '#B8B4AC',

  // Text - Warm cream with clear hierarchy (NO green tint)
  textPrimary: '#FAF8F3',       // Warm off-white/cream - HIGH contrast
  textSecondary: '#D4D0C8',     // Slightly dimmer warm gray
  textMuted: '#9A968E',         // Clearly readable warm gray - NO olive
  textInverse: '#0F0F12',

  // Borders - Visible warm gray (INCREASED contrast)
  borderSubtle: '#2E2D33',      // Visible against background
  borderSoft: '#3D3B44',        // Clear card separation
  borderEarth: '#4A4842',       // Warm accent border
  headerBorder: '#2E2D33',      // Subtle divider below header

  // Icons - Clear on dark, earth accents where appropriate
  iconDefault: '#C4C0B8',       // Warm light gray - readable
  iconMuted: '#8A867E',         // Medium warm gray
  iconActive: '#D4A860',        // Gold for active - clear accent
  iconInactive: '#6E6A62',      // Muted warm gray
  iconHeader: '#FAF8F3',        // Cream for header icons - VISIBLE

  // Buttons - Earth forward
  buttonPrimaryBg: '#FAF8F3',   // Cream background
  buttonPrimaryText: '#0F0F12', // Dark text
  buttonPrimaryIcon: '#0F0F12',
  buttonPrimaryBorder: '#7C8F78',
  buttonSecondaryBg: '#26252B',
  buttonSecondaryText: '#FAF8F3',
  buttonSecondaryBorder: '#7C8F78',
  buttonOutlineBorder: '#9BA89D',
  buttonOutlineText: '#FAF8F3',

  // Links & Focus
  link: '#A8C4BC',              // Subtle teal-sage for links (readable)
  focusRing: '#D4A860',         // Gold focus ring - visible

  // Status
  success: '#8FA888',           // Brighter sage for visibility
  warning: '#D4A860',           // Warm gold
  danger: '#D47070',            // Clear red - more visible
  destructive: '#D47070',       // Alias for danger (red regardless of mode)
  info: '#A8C4BC',              // Teal-sage

  // Social actions
  like: '#E08890',              // Warm rose - brighter for dark mode
  likeActive: '#F0989F',
  repost: '#9BA89D',            // Sage muted
  repostActive: '#B8C4B8',
  bookmark: '#D4A860',          // Gold for bookmark - distinctive
  bookmarkActive: '#E4B870',

  // Input
  input: '#1E1D22',             // Darker - matches surface for subtlety
  inputFocus: '#26252B',

  // Tabs - Clear hierarchy
  tabActive: '#FAF8F3',         // Cream - high contrast
  tabActiveUnderline: '#D4A860', // Gold underline - visible accent
  tabInactive: '#8A867E',       // Muted neutral gray
  tabInactiveBg: '#26252B',

  // Chips - Warm surfaces
  chipBg: '#26252B',
  chipBgActive: '#3D3B44',
  chipText: '#B8B4AC',
  chipTextActive: '#FAF8F3',

  // Brand (mode-specific overrides)
  primary: '#FAF8F3',           // Cream - readable on dark
  primaryForeground: '#0F0F12',
  secondary: '#7C8F78',         // Sage
  secondaryForeground: '#0F0F12',
  accent: '#D4A860',            // Gold accent - visible
  accentForeground: '#0F0F12',
  header: '#1E1D22',            // Warm charcoal (matches surface)
  headerForeground: '#FAF8F3',  // Cream text - LOGO READABLE

  // Earth palette direct access
  sage: '#8FA888',              // Brighter sage for dark mode
  sageMuted: '#9BA89D',
  sageDeep: '#7C8F78',
  terracotta: '#D48878',        // Brighter terracotta
  gold: '#D4A860',
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
