import React, { createContext, useContext, PropsWithChildren, useMemo, useEffect } from 'react';
import { Appearance, ColorSchemeName, Text } from 'react-native';
import { colors, spacing, radii, shadows, typeScale, ThemeTokens } from './theme/tokens';

export type Theme = ThemeTokens & { scheme: ColorSchemeName };

const ThemeContext = createContext<Theme>({
  colors: colors.light,
  spacing,
  radii,
  shadows,
  typeScale,
  scheme: 'light',
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: PropsWithChildren<{}>) {
  const scheme = Appearance.getColorScheme() || 'light';

  const theme: Theme = useMemo(() => ({
    colors: scheme === 'dark' ? colors.dark : colors.light,
    spacing,
    radii,
    shadows,
    typeScale,
    scheme,
  }), [scheme]);

  // Apply default Text styles once (font family from loaded fonts)
  useEffect(() => {
    try {
      // @ts-ignore RN global Text default props pattern
      if (Text.defaultProps == null) Text.defaultProps = {};
      // @ts-ignore
      // Only set Inter if fonts loaded successfully, otherwise use system default
      Text.defaultProps.style = [{
        fontFamily: 'Inter', // Falls back to system font if not loaded
        color: theme.colors.foreground,
        fontSize: theme.typeScale.md
      }];
    } catch (error) {
      console.error('[ThemeProvider] Error setting default text props:', error);
      // Continue without custom fonts
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
