/**
 * ChannelCard - Native React Native component
 * Displays community/channel cards in horizontal scroll
 */

import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text,  } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

const CheckIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 10, color }}>✓</Text>
);

export interface Channel {
  id: number;
  name: string;
  members: string;
  icon: string;
  isJoined: boolean;
  communityId?: number; // Link to community for navigation
  slug?: string; // Community slug
  color?: string; // Community brand color (hex)
}

// Helper to get contrasting text color based on background brightness
function getContrastColor(hexColor: string): string {
  // Default to white if no color
  if (!hexColor) return '#FFFFFF';

  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, dark color for light backgrounds
  return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
}

interface ChannelCardProps {
  channel: Channel;
  onToggleJoin?: (joined: boolean) => void;
  onPress?: (channel: Channel) => void; // Navigate to channel/community
}

export function ChannelCard({ channel, onToggleJoin, onPress }: ChannelCardProps) {
  const { colors, spacing, radii, shadows } = useTheme();
  const [isJoined, setIsJoined] = useState(channel.isJoined);

  const handlePress = () => {
    // Navigate to channel if onPress is provided, otherwise toggle join
    if (onPress) {
      onPress(channel);
    } else {
      const newJoinedState = !isJoined;
      setIsJoined(newJoinedState);
      onToggleJoin?.(newJoinedState);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          width: 96,
          height: 96,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: pressed ? colors.accent : colors.borderSubtle,
          borderRadius: radii.lg,
          padding: spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
        },
      ]}
    >
      {/* Channel Icon */}
      <View style={{ position: 'relative' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: channel.color || colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: channel.color ? getContrastColor(channel.color) : colors.secondaryForeground,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            {channel.icon}
          </Text>
        </View>

        {/* Joined Checkmark */}
        {isJoined && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckIcon color={colors.accentForeground} />
          </View>
        )}
      </View>

      {/* Channel Name */}
      <Text
        variant="caption"
        numberOfLines={1}
        style={{ textAlign: 'center', width: '100%' }}
      >
        {channel.name}
      </Text>

      {/* Member Count */}
      <Text variant="caption" color="textMuted">
        {channel.members}
      </Text>
    </Pressable>
  );
}

// Add Channel Button - for discovering new communities (opens filters)
export function AddChannelCard({
  onPress,
  activeFilterCount = 0
}: {
  onPress?: () => void;
  activeFilterCount?: number;
}) {
  const { colors, spacing, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 96,
          height: 96,
          borderWidth: 2,
          borderColor: colors.primary,
          borderRadius: radii.lg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          backgroundColor: pressed ? colors.primary + '15' : colors.primary + '08',
        },
      ]}
    >
      <View style={{ position: 'relative' }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 22, color: colors.primaryForeground, fontWeight: '300' }}>+</Text>
        </View>
        {/* Filter count badge */}
        {activeFilterCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: colors.destructive || '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700' }}>
              {activeFilterCount}
            </Text>
          </View>
        )}
      </View>
      <Text variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
        Discover
      </Text>
    </Pressable>
  );
}
