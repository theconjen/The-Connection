import React, { createContext, useContext, PropsWithChildren, useMemo, useEffect } from 'react';
import { Appearance, ColorSchemeName, Text } from 'react-native';
import { colors, spacing, radii, shadows, typeScale, ThemeTokens } from '../theme/tokens';

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
    // @ts-ignore RN global Text default props pattern
    if (Text.defaultProps == null) Text.defaultProps = {};
    // @ts-ignore
    Text.defaultProps.style = [{ fontFamily: 'Inter', color: theme.colors.foreground, fontSize: theme.typeScale.md }];
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
