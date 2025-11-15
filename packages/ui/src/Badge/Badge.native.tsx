/**
 * React Native Badge component
 */

import React from 'react';
import { Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';

export interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  variant = 'default',
  children,
  style,
  textStyle,
}: BadgeProps) {
  const containerStyle = [
    styles.base,
    styles[`${variant}Container` as keyof typeof styles],
    style,
  ] as ViewStyle[];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles],
    textStyle,
  ] as TextStyle[];

  return (
    <View style={containerStyle}>
      <Text style={textStyleCombined}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  defaultContainer: {
    backgroundColor: '#0ea5e9', // primary
    borderColor: 'transparent',
  },
  defaultText: {
    color: '#ffffff', // primary-foreground
  },
  secondaryContainer: {
    backgroundColor: '#f1f5f9', // secondary
    borderColor: 'transparent',
  },
  secondaryText: {
    color: '#0f172a', // secondary-foreground
  },
  destructiveContainer: {
    backgroundColor: '#ef4444', // destructive
    borderColor: 'transparent',
  },
  destructiveText: {
    color: '#ffffff', // destructive-foreground
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderColor: '#e2e8f0',
  },
  outlineText: {
    color: '#0f172a', // foreground
  },
});

export const badgeVariants = {}; // For compatibility with web version
