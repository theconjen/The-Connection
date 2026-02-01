/**
 * Clergy Badge Component
 * Displays a badge for verified clergy members
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ClergyBadgeProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function ClergyBadge({ size = 'medium', style }: ClergyBadgeProps) {
  const sizes = {
    small: { iconSize: 10, container: 16 },
    medium: { iconSize: 12, container: 20 },
    large: { iconSize: 16, container: 26 },
  };

  const sizeConfig = sizes[size];

  return (
    <View
      style={[
        styles.badge,
        {
          width: sizeConfig.container,
          height: sizeConfig.container,
          borderRadius: sizeConfig.container / 2,
        },
        style,
      ]}
      accessibilityLabel="Verified Clergy"
    >
      <Ionicons
        name="shield-checkmark"
        size={sizeConfig.iconSize}
        color="#D97706"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
  },
});

export default ClergyBadge;
