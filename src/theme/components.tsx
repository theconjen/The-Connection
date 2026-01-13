/**
 * The Connection - Themed Components
 * 
 * Reusable UI components that automatically adapt to the current theme.
 * These mirror the styling patterns from your web app.
 */

import React, { ReactNode } from 'react';
import {
  View,
  Text as RNText,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  PressableProps,
  ActivityIndicator,
} from 'react-native';
import { useTheme, Theme } from '../contexts/ThemeContext';

// ============================================================================
// TEXT COMPONENT
// ============================================================================

type TextVariant = 'body' | 'bodySmall' | 'label' | 'title' | 'heading' | 'caption';

interface TextProps {
  children: ReactNode;
  variant?: TextVariant;
  color?: keyof Theme['colors'];
  style?: TextStyle;
  numberOfLines?: number;
}

const textVariantStyles: Record<TextVariant, (theme: Theme) => TextStyle> = {
  body: (t) => ({ fontSize: t.typeScale.md }),
  bodySmall: (t) => ({ fontSize: t.typeScale.sm }),
  label: (t) => ({ fontSize: t.typeScale.sm, fontWeight: '500' }),
  title: (t) => ({ fontSize: t.typeScale.xl, fontWeight: '600' }),
  heading: (t) => ({ fontSize: t.typeScale['2xl'], fontWeight: '700' }),
  caption: (t) => ({ fontSize: t.typeScale.xs }),
};

export function Text({ children, variant = 'body', color = 'foreground', style, numberOfLines }: TextProps) {
  const theme = useTheme();
  const variantStyle = textVariantStyles[variant](theme);

  // Determine font family based on weight in style
  const getFontFamily = (styleObj: any) => {
    if (!styleObj) return 'PlayfairDisplay_500Medium';
    const weight = styleObj.fontWeight;
    if (weight === '700' || weight === 'bold') return 'PlayfairDisplay_700Bold';
    if (weight === '600') return 'PlayfairDisplay_600SemiBold';
    if (weight === '500') return 'PlayfairDisplay_500Medium';
    if (weight === '400' || weight === 'normal') return 'PlayfairDisplay_400Regular';
    return 'PlayfairDisplay_500Medium';
  };

  return (
    <RNText
      style={[
        {
          color: theme.colors[color] as string,
          fontFamily: getFontFamily(variantStyle),
        },
        variantStyle,
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, style, shadow = 'md' }: CardProps) {
  const theme = useTheme();
  
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        theme.shadows[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const buttonSizes: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14 },
  md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 16 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const sizeConfig = buttonSizes[size];
  
  const getVariantStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'primary':
        return { bg: theme.colors.primary, text: theme.colors.primaryForeground };
      case 'secondary':
        return { bg: theme.colors.secondary, text: theme.colors.secondaryForeground };
      case 'outline':
        return { bg: 'transparent', text: theme.colors.primary, border: theme.colors.border };
      case 'ghost':
        return { bg: 'transparent', text: theme.colors.foreground };
      case 'destructive':
        return { bg: theme.colors.destructive, text: theme.colors.destructiveForeground };
      default:
        return { bg: theme.colors.primary, text: theme.colors.primaryForeground };
    }
  };
  
  const variantStyles = getVariantStyles();
  const isDisabled = disabled || loading;
  
  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: variantStyles.bg,
          borderRadius: theme.radii.md,
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderWidth: variantStyles.border ? 1 : 0,
          borderColor: variantStyles.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={variantStyles.text} />}
      <RNText
        style={{
          color: variantStyles.text,
          fontSize: sizeConfig.fontSize,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {children}
      </RNText>
    </Pressable>
  );
}

// ============================================================================
// TEXT INPUT COMPONENT
// ============================================================================

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  const theme = useTheme();
  
  return (
    <View style={[{ gap: theme.spacing.xs }, containerStyle]}>
      {label && (
        <Text variant="label" color="foreground">
          {label}
        </Text>
      )}
      <RNTextInput
        style={[
          {
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: error ? theme.colors.destructive : theme.colors.border,
            borderRadius: theme.radii.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            fontSize: theme.typeScale.md,
            color: theme.colors.foreground,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.mutedForeground}
        {...props}
      />
      {error && (
        <Text variant="caption" color="destructive">
          {error}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// DIVIDER COMPONENT
// ============================================================================

interface DividerProps {
  style?: ViewStyle;
}

export function Divider({ style }: DividerProps) {
  const theme = useTheme();
  
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: theme.colors.border,
          marginVertical: theme.spacing.md,
        },
        style,
      ]}
    />
  );
}

// ============================================================================
// CONTAINER / SCREEN WRAPPER
// ============================================================================

interface ScreenProps {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function Screen({ children, style, padded = true }: ScreenProps) {
  const theme = useTheme();
  
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        padded && { padding: theme.spacing.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ============================================================================
// BADGE COMPONENT
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'success' | 'destructive';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const theme = useTheme();
  
  const getVariantStyles = (): { bg: string; text: string } => {
    switch (variant) {
      case 'secondary':
        return { bg: theme.colors.muted, text: theme.colors.mutedForeground };
      case 'success':
        return { bg: theme.colors.success, text: theme.colors.successForeground };
      case 'destructive':
        return { bg: theme.colors.destructive, text: theme.colors.destructiveForeground };
      default:
        return { bg: theme.colors.primary, text: theme.colors.primaryForeground };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  return (
    <View
      style={[
        {
          backgroundColor: variantStyles.bg,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.radii.full,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <RNText
        style={{
          color: variantStyles.text,
          fontSize: theme.typeScale.xs,
          fontWeight: '500',
        }}
      >
        {children}
      </RNText>
    </View>
  );
}

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

interface AvatarProps {
  size?: number;
  initials?: string;
  style?: ViewStyle;
}

export function Avatar({ size = 40, initials, style }: AvatarProps) {
  const theme = useTheme();
  
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {initials && (
        <RNText
          style={{
            color: theme.colors.secondaryForeground,
            fontSize: size * 0.4,
            fontWeight: '600',
          }}
        >
          {initials}
        </RNText>
      )}
    </View>
  );
}
