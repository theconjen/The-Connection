/**
 * The Connection - Theme Provider
 * 
 * Provides theme context throughout the app with automatic light/dark mode support.
 * Wrap your app's root component with <ThemeProvider> to use.
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme, ColorSchemeName } from 'react-native';
import { colors, spacing, radii, shadows, fontSize, lineHeight, fontFamily, fontWeight, AnyColorSet } from './tokens';

// ============================================================================
// THEME TYPE
// ============================================================================

export interface Theme {
  colorScheme: 'light' | 'dark';
  colors: AnyColorSet;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  fontSize: typeof fontSize;
  lineHeight: typeof lineHeight;
  fontFamily: typeof fontFamily;
  fontWeight: typeof fontWeight;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<Theme | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  /** Force a specific color scheme (overrides system preference) */
  forcedColorScheme?: 'light' | 'dark';
}

export function ThemeProvider({ children, forcedColorScheme }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  
  const theme = useMemo<Theme>(() => {
    const colorScheme = forcedColorScheme ?? systemColorScheme ?? 'light';
    
    return {
      colorScheme,
      colors: colors[colorScheme],
      spacing,
      radii,
      shadows,
      fontSize,
      lineHeight,
      fontFamily,
      fontWeight,
    };
  }, [systemColorScheme, forcedColorScheme]);
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Access the current theme
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}

/**
 * Access just the colors from the current theme
 */
export function useColors() {
  return useTheme().colors;
}

/**
 * Check if dark mode is active
 */
export function useIsDarkMode(): boolean {
  return useTheme().colorScheme === 'dark';
}

// ============================================================================
// UTILITY: Create themed styles
// ============================================================================

type StyleFactory<T> = (theme: Theme) => T;

/**
 * Hook to create styles that automatically update with theme changes.
 * Similar to StyleSheet.create but with theme access.
 * 
 * @example
 * const styles = useThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background,
 *     padding: theme.spacing.lg,
 *   },
 * }));
 */
export function useThemedStyles<T>(factory: StyleFactory<T>): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
