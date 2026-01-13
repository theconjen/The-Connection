/**
 * User Reputation Badge Component (ADMIN ONLY)
 * Displays user trust level and reputation score
 * This component should ONLY be shown to admins/moderators
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserReputationBadgeProps {
  reputationScore: number;
  trustLevel: number;
  size?: 'small' | 'medium' | 'large';
  showScore?: boolean;
  onPress?: () => void;
  // Note: This component should only be rendered if user isAdmin
}

const REPUTATION_BADGES = {
  5: {
    name: 'Trusted Member',
    color: '#FFD700',
    icon: 'star' as const,
    description: 'Highly trusted community member',
  },
  4: {
    name: 'Respected',
    color: '#C0C0C0',
    icon: 'shield-checkmark' as const,
    description: 'Respected community member',
  },
  3: {
    name: 'Active',
    color: '#CD7F32',
    icon: 'checkmark-circle' as const,
    description: 'Active community member',
  },
  2: {
    name: 'Member',
    color: '#4A90E2',
    icon: 'person' as const,
    description: 'Verified member',
  },
  1: {
    name: 'New',
    color: '#95A5A6',
    icon: 'person-add' as const,
    description: 'New member',
  },
};

export function UserReputationBadge({
  reputationScore,
  trustLevel,
  size = 'medium',
  showScore = true,
  onPress,
}: UserReputationBadgeProps) {
  const badge = REPUTATION_BADGES[trustLevel as keyof typeof REPUTATION_BADGES] || REPUTATION_BADGES[1];

  const sizes = {
    small: {
      iconSize: 14,
      fontSize: 11,
      padding: 4,
      gap: 4,
    },
    medium: {
      iconSize: 16,
      fontSize: 12,
      padding: 6,
      gap: 6,
    },
    large: {
      iconSize: 20,
      fontSize: 14,
      padding: 8,
      gap: 8,
    },
  };

  const sizeConfig = sizes[size];

  const content = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${badge.color}15`,
          borderColor: badge.color,
          padding: sizeConfig.padding,
          gap: sizeConfig.gap,
        },
      ]}
    >
      <Ionicons name={badge.icon} size={sizeConfig.iconSize} color={badge.color} />
      <Text
        style={[
          styles.badgeText,
          {
            color: badge.color,
            fontSize: sizeConfig.fontSize,
          },
        ]}
      >
        {badge.name}
      </Text>
      {showScore && size !== 'small' && (
        <Text
          style={[
            styles.scoreText,
            {
              fontSize: sizeConfig.fontSize - 1,
              color: badge.color,
            },
          ]}
        >
          ({reputationScore})
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '600',
  },
  scoreText: {
    fontWeight: '500',
    opacity: 0.8,
  },
});
