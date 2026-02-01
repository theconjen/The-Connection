import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import type { TextVariant, FontWeightName } from '../../theme/typography';
import { getDefaultWeightForVariant, getTypographyStyle } from '../../theme/typography';

type ThemedTextProps = TextProps & {
  variant?: TextVariant;
  weight?: FontWeightName; // regular | medium | semibold | bold
  color?: 'primary' | 'secondary' | 'muted' | 'inverse';
  muted?: boolean; // Shorthand for color="muted"
};

export function ThemedText({
  variant = 'body',
  weight,
  color,
  muted,
  style,
  ...props
}: ThemedTextProps) {
  const { colors, typography } = useTheme();

  // Determine color
  const textColor = muted || color === 'muted'
    ? colors.textMuted
    : color === 'secondary'
    ? colors.textSecondary
    : color === 'inverse'
    ? colors.textInverse
    : colors.textPrimary;

  // Determine font weight (use weight prop or default for variant)
  const chosenWeight = weight ?? getDefaultWeightForVariant(variant);

  // Get font family for the chosen weight
  const fontFamily = typography.family[chosenWeight] ?? typography.family.regular;

  // Get typography style (fontSize, lineHeight)
  const variantStyle = getTypographyStyle(variant);

  return (
    <Text
      {...props}
      style={[
        {
          color: textColor,
          fontFamily,
          fontSize: variantStyle.fontSize,
          lineHeight: variantStyle.lineHeight,
        },
        style,
      ]}
    />
  );
}
