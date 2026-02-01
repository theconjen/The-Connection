import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, shadows, spacing } from '../../theme/tokens';

interface ThemedCardProps extends ViewProps {
  padding?: keyof typeof spacing;
  radius?: keyof typeof radii;
  shadow?: keyof typeof shadows;
  withBorder?: boolean;
}

export function ThemedCard({
  padding = 'md',
  radius = 'lg',
  shadow = 'sm',
  withBorder = true,
  style,
  ...props
}: ThemedCardProps) {
  const { colors } = useTheme();

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: radii[radius],
    padding: spacing[padding],
    ...(withBorder && {
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    }),
    ...shadows[shadow],
  };

  return <View style={[cardStyle, style]} {...props} />;
}
