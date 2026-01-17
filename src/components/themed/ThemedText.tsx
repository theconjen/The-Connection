import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/tokens';

interface ThemedTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodyLarge' | 'caption' | 'small';
  color?: 'primary' | 'secondary' | 'muted' | 'inverse';
}

export function ThemedText({
  variant = 'body',
  color = 'primary',
  style,
  ...props
}: ThemedTextProps) {
  const { colors } = useTheme();

  const textColor =
    color === 'primary'
      ? colors.textPrimary
      : color === 'secondary'
      ? colors.textSecondary
      : color === 'muted'
      ? colors.textMuted
      : colors.textInverse;

  const typographyStyle = typography[variant];

  return (
    <Text
      style={[
        {
          color: textColor,
          fontSize: typographyStyle.fontSize,
          fontWeight: typographyStyle.fontWeight,
          lineHeight: typographyStyle.lineHeight,
        },
        style,
      ]}
      {...props}
    />
  );
}
