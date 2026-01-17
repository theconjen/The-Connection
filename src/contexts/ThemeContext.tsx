import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii, shadows, typeScale, typography, ColorSet } from '../theme/tokens';

type ThemePreference = 'light' | 'dark' | 'system';

// Theme shape for components (matches old ThemeProvider.Theme)
export interface Theme {
  colorScheme: 'light' | 'dark';
  colors: ColorSet;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  typeScale: typeof typeScale;
  typography: typeof typography;
}

interface ThemeContextType extends Theme {
  // Theme preference setting
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theconnection_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine actual color scheme based on preference
  const colorScheme: 'light' | 'dark' =
    themePreference === 'system'
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : themePreference;

  // Get the appropriate color set from tokens
  const activeColors = colors[colorScheme];

  // Load saved theme preference on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Re-render when system color scheme changes (for 'system' mode)
  useEffect(() => {
    if (isLoaded && themePreference === 'system') {
      // Force re-render to pick up system theme changes
    }
  }, [systemColorScheme, themePreference, isLoaded]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemePreference(savedTheme as ThemePreference);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setTheme = async (newTheme: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemePreference(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: themePreference,
        setTheme,
        colorScheme,
        colors: activeColors,
        spacing,
        radii,
        shadows,
        typeScale,
        typography,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
