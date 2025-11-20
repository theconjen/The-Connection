import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  colors: typeof lightColors;
}

// Light theme colors
const lightColors = {
  // Brand colors
  primary: '#0B132B',
  primaryForeground: '#FFFFFF',
  secondary: '#222D99',
  secondaryForeground: '#FFFFFF',
  accent: '#4A90E2',
  accentForeground: '#FFFFFF',

  // Background colors
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',

  // Text colors
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Status colors
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',

  // UI elements
  card: '#FFFFFF',
  cardForeground: '#111827',
  muted: '#F3F4F6',
  mutedForeground: '#6B7280',
  input: '#E5E7EB',
};

// Dark theme colors
const darkColors = {
  // Brand colors (slightly adjusted for dark mode)
  primary: '#4A90E2',
  primaryForeground: '#FFFFFF',
  secondary: '#5B6CC6',
  secondaryForeground: '#FFFFFF',
  accent: '#60A5FA',
  accentForeground: '#FFFFFF',

  // Background colors
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',

  // Text colors
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',

  // Border colors
  border: '#334155',
  borderLight: '#475569',

  // Status colors
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',

  // UI elements
  card: '#1E293B',
  cardForeground: '#F1F5F9',
  muted: '#334155',
  mutedForeground: '#94A3B8',
  input: '#334155',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theconnection_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  // Determine actual theme based on setting
  const actualTheme: 'light' | 'dark' =
    theme === 'system'
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : theme;

  const colors = actualTheme === 'dark' ? darkColors : lightColors;

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, colors }}>
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
