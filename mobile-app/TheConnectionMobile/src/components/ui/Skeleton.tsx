import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

export type SkeletonProps = ViewProps & { rounded?: number };

export const Skeleton: React.FC<SkeletonProps> = ({ style, rounded = 8, ...props }) => (
  <View style={[styles.base, { borderRadius: rounded }, style]} {...props} />
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#e5e7eb',
    height: 16,
  },
});

export default Skeleton;
