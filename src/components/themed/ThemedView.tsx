import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemedViewProps extends ViewProps {
  variant?: 'background' | 'backgroundSoft' | 'surface' | 'surfaceMuted';
}

export function ThemedView({ variant = 'background', style, ...props }: ThemedViewProps) {
  const { colors } = useTheme();

  const backgroundColor = variant === 'background'
    ? colors.background
    : variant === 'backgroundSoft'
    ? colors.backgroundSoft
    : variant === 'surface'
    ? colors.surface
    : colors.surfaceMuted;

  return <View style={[{ backgroundColor }, style]} {...props} />;
}
