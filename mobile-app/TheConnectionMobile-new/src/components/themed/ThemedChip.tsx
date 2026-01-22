import React from 'react';
import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radii, spacing } from '../../theme/tokens';

interface ThemedChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  selected?: boolean;
  size?: 'sm' | 'md';
}

export function ThemedChip({
  label,
  selected = false,
  size = 'md',
  style,
  ...props
}: ThemedChipProps) {
  const { colors } = useTheme();

  const chipStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: size === 'sm' ? spacing.sm : spacing.md,
    paddingVertical: size === 'sm' ? spacing.xs : spacing.sm,
    borderRadius: radii.full,
    backgroundColor: selected ? colors.buttonPrimaryBg : colors.surfaceMuted,
    borderWidth: 1,
    borderColor: selected ? colors.buttonPrimaryBg : colors.borderSoft,
  };

  const textColor = selected ? colors.buttonPrimaryText : colors.textSecondary;

  return (
    <Pressable
      style={({ pressed }) => [chipStyle, pressed && { opacity: 0.7 }, style]}
      {...props}
    >
      <Text
        style={{
          color: textColor,
          fontSize: size === 'sm' ? 12 : 13,
          fontWeight: selected ? '600' : '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
