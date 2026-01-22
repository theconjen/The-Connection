/**
 * Theme Provider - Legacy re-export
 *
 * This file now re-exports from ThemeContext for backward compatibility.
 * The actual theme implementation is in src/contexts/ThemeContext.tsx
 */

import { useTheme as useThemeHook } from '../contexts/ThemeContext';

// Re-export everything from ThemeContext
export {
  ThemeProvider,
  useTheme,
  type Theme,
} from '../contexts/ThemeContext';

// Helper hooks for convenience
export const useColors = () => useThemeHook().colors;
export const useIsDarkMode = () => useThemeHook().colorScheme === 'dark';

// Utility hook for themed styles
type StyleFactory<T> = (theme: ReturnType<typeof useThemeHook>) => T;

export function useThemedStyles<T>(factory: StyleFactory<T>): T {
  const theme = useThemeHook();
  return factory(theme);
}
