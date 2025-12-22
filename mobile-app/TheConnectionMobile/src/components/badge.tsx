import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { colors, spacing } from '../theme/tokens';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ variant = 'default', children, style, textStyle }: BadgeProps) {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? colors.dark : colors.light;

  const containerStyles = [
    styles.base,
    variant === 'default' && { backgroundColor: palette.primary, borderColor: 'transparent' },
    variant === 'secondary' && { backgroundColor: palette.muted, borderColor: 'transparent' },
    variant === 'destructive' && { backgroundColor: palette.destructive, borderColor: 'transparent' },
    variant === 'outline' && { backgroundColor: 'transparent', borderColor: palette.border },
    style,
  ];

  const textStyles = [
    styles.text,
    variant === 'default' && { color: palette.primaryForeground },
    variant === 'secondary' && { color: palette.text },
    variant === 'destructive' && { color: palette.destructiveForeground },
    variant === 'outline' && { color: palette.text },
    textStyle,
  ];

  return (
    <View style={containerStyles}>
      <Text style={textStyles}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export const badgeVariants = {};
