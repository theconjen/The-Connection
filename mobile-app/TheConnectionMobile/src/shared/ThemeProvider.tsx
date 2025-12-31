import React, { createContext, useContext, PropsWithChildren, useMemo, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii, shadows, typeScale, ThemeTokens } from '../theme/tokens';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Theme = ThemeTokens & {
  scheme: ColorSchemeName;
  preference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
};

const THEME_STORAGE_KEY = '@theconnection_theme';

const ThemeContext = createContext<Theme>({
  colors: colors.light,
  spacing,
  radii,
  shadows,
  typeScale,
  scheme: 'light',
  preference: 'system',
  setThemePreference: async () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: PropsWithChildren<{}>) {
  const systemScheme = Appearance.getColorScheme() || 'light';
  const [preference, setPreference] = useState<ThemePreference>('system');

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setPreference(saved);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setThemePreference = async (pref: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
      setPreference(pref);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine actual scheme based on preference
  const actualScheme: ColorSchemeName =
    preference === 'system' ? systemScheme : preference;

  const theme: Theme = useMemo(() => ({
    colors: actualScheme === 'dark' ? colors.dark : colors.light,
    spacing,
    radii,
    shadows,
    typeScale,
    scheme: actualScheme,
    preference,
    setThemePreference,
  }), [actualScheme, preference]);

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
