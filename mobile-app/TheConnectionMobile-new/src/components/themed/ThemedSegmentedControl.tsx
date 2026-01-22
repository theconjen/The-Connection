import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radii, spacing } from '../../theme/tokens';

interface ThemedSegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export function ThemedSegmentedControl({
  options,
  selectedIndex,
  onSelectIndex,
}: ThemedSegmentedControlProps) {
  const { colors } = useTheme();

  const containerStyle = {
    flexDirection: 'row' as const,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: 3,
  };

  return (
    <View style={containerStyle}>
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;

        const segmentStyle = {
          flex: 1,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          backgroundColor: isSelected ? colors.buttonPrimaryBg : 'transparent',
        };

        const textColor = isSelected ? colors.buttonPrimaryText : colors.textSecondary;

        return (
          <Pressable
            key={option}
            style={({ pressed }) => [
              segmentStyle,
              pressed && !isSelected && { backgroundColor: colors.borderSoft },
            ]}
            onPress={() => onSelectIndex(index)}
          >
            <Text
              style={{
                color: textColor,
                fontSize: 14,
                fontWeight: isSelected ? '600' : '500',
              }}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
