import React from 'react';
import { Pressable, Text, StyleSheet, PressableProps, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radii, spacing } from '../../theme/tokens';

interface ThemedButtonProps extends PressableProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function ThemedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  children,
  ...props
}: ThemedButtonProps) {
  const { colors } = useTheme();

  const getButtonStyles = () => {
    const baseStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: radii.md,
      paddingHorizontal: size === 'sm' ? spacing.md : size === 'lg' ? spacing.xl : spacing.lg,
      paddingVertical: size === 'sm' ? spacing.sm : size === 'lg' ? spacing.md : spacing.sm + 2,
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        backgroundColor: colors.buttonPrimaryBg,
      };
    }

    if (variant === 'secondary') {
      return {
        ...baseStyle,
        backgroundColor: colors.buttonSecondaryBg,
      };
    }

    // outline
    return {
      ...baseStyle,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.buttonOutlineBorder,
    };
  };

  const getTextColor = () => {
    if (variant === 'primary') return colors.buttonPrimaryText;
    if (variant === 'secondary') return colors.buttonSecondaryText;
    return colors.buttonOutlineText;
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        getButtonStyles(),
        isDisabled && { opacity: 0.5 },
        pressed && !isDisabled && { opacity: 0.8 },
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text
          style={{
            color: getTextColor(),
            fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 15,
            fontWeight: '600',
          }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
