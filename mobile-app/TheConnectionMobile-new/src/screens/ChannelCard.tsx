/**
 * ChannelCard - Native React Native component
 * Displays community/channel cards in horizontal scroll
 */

import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, useTheme } from '../theme';

const CheckIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 10, color }}>✓</Text>
);

export interface Channel {
  id: number;
  name: string;
  members: string;
  icon: string;
  isJoined: boolean;
}

interface ChannelCardProps {
  channel: Channel;
  onToggleJoin?: (joined: boolean) => void;
}

export function ChannelCard({ channel, onToggleJoin }: ChannelCardProps) {
  const { colors, spacing, radii, shadows } = useTheme();
  const [isJoined, setIsJoined] = useState(channel.isJoined);

  const handlePress = () => {
    const newJoinedState = !isJoined;
    setIsJoined(newJoinedState);
    onToggleJoin?.(newJoinedState);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          width: 96,
          height: 96,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: pressed ? colors.accent : colors.border,
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
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: colors.secondaryForeground,
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
      <Text variant="caption" color="mutedForeground">
        {channel.members}
      </Text>
    </Pressable>
  );
}

// Add Channel Button - for discovering new communities
export function AddChannelCard({ onPress }: { onPress?: () => void }) {
  const { colors, spacing, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 96,
          height: 96,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: pressed ? colors.accent : colors.border,
          borderRadius: radii.lg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          backgroundColor: pressed ? colors.muted : 'transparent',
        },
      ]}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18, color: colors.mutedForeground }}>+</Text>
      </View>
      <Text variant="caption" color="mutedForeground">
        Discover
      </Text>
    </Pressable>
  );
}
