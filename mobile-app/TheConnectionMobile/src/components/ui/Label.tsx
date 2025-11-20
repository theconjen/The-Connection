import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

export type LabelProps = TextProps & { htmlFor?: string | undefined };

export const Label = React.forwardRef<
  React.ComponentRef<typeof Text>,
  LabelProps
>(({ style, ...props }, ref) => (
  <Text ref={ref as any} style={[styles.label, style]} {...(props as any)} />
));
Label.displayName = 'Label';

const styles = StyleSheet.create({
  label: { fontSize: 14, color: '#374151' },
});

export default Label;
