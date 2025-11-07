import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

export const Label: React.FC<TextProps> = ({ style, ...props }) => (
  <Text style={[styles.label, style]} {...props} />
);

const styles = StyleSheet.create({
  label: { fontSize: 14, color: '#374151' },
});

export default Label;
