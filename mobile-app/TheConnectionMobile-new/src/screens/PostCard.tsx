/**
 * PostCard - Native React Native component
 * Matches the Figma design for forum post previews
 */

import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, Badge, Avatar, useTheme } from '../theme';

// Icons - you can replace these with @expo/vector-icons or lucide-react-native
const ArrowUpIcon = ({ color, filled }: { color: string; filled?: boolean }) => (
  <Text style={{ fontSize: 16, color }}>▲</Text>
);
const ArrowDownIcon = ({ color, filled }: { color: string; filled?: boolean }) => (
  <Text style={{ fontSize: 16, color }}>▼</Text>
);
const CommentIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 14, color }}>💬</Text>
);
const ShareIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 14, color }}>↗</Text>
);
const BookmarkIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 14, color }}>🔖</Text>
);

export interface Post {
  id: number;
  channel: string;
  channelIcon: string;
  author: string;
  timeAgo: string;
  title: string;
  content: string;
  votes: number;
  comments: number;
  flair: string;
}

interface PostCardProps {
  post: Post;
  onPress?: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
  const { colors, spacing, radii } = useTheme();
  const [votes, setVotes] = useState(post.votes);
  const [voteStatus, setVoteStatus] = useState<'up' | 'down' | null>(null);

  const handleVote = (type: 'up' | 'down') => {
    if (voteStatus === type) {
      setVoteStatus(null);
      setVotes(votes + (type === 'up' ? -1 : 1));
    } else if (voteStatus === null) {
      setVoteStatus(type);
      setVotes(votes + (type === 'up' ? 1 : -1));
    } else {
      setVoteStatus(type);
      setVotes(votes + (type === 'up' ? 2 : -2));
    }
  };

  const formatVotes = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.card,
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      {/* Post Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        {/* Channel & Author Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <Avatar initials={post.channelIcon} size={24} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
            <Text variant="caption" color="foreground" style={{ fontWeight: '600' }}>
              {post.channel}
            </Text>
            <Text variant="caption" color="mutedForeground">•</Text>
            <Text variant="caption" color="mutedForeground">u/{post.author}</Text>
            <Text variant="caption" color="mutedForeground">•</Text>
            <Text variant="caption" color="mutedForeground">{post.timeAgo}</Text>
          </View>
        </View>

        {/* Post Title */}
        <Text variant="body" style={{ fontWeight: '500', marginBottom: spacing.sm }}>
          {post.title}
        </Text>

        {/* Post Content Preview */}
        <Text
          variant="bodySmall"
          color="mutedForeground"
          numberOfLines={2}
          style={{ marginBottom: spacing.sm }}
        >
          {post.content}
        </Text>

        {/* Flair */}
        <Badge variant="secondary">{post.flair}</Badge>
      </View>

      {/* Action Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.muted,
        }}
      >
        {/* Votes */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Pressable
            onPress={() => handleVote('up')}
            style={({ pressed }) => ({
              padding: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: pressed ? colors.muted : 'transparent',
            })}
          >
            <ArrowUpIcon
              color={voteStatus === 'up' ? colors.accent : colors.mutedForeground}
              filled={voteStatus === 'up'}
            />
          </Pressable>
          <Text
            variant="caption"
            style={{
              minWidth: 35,
              textAlign: 'center',
              color: voteStatus === 'up'
                ? colors.accent
                : voteStatus === 'down'
                ? colors.mutedForeground
                : colors.foreground,
            }}
          >
            {formatVotes(votes)}
          </Text>
          <Pressable
            onPress={() => handleVote('down')}
            style={({ pressed }) => ({
              padding: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: pressed ? colors.muted : 'transparent',
            })}
          >
            <ArrowDownIcon
              color={colors.mutedForeground}
              filled={voteStatus === 'down'}
            />
          </Pressable>
        </View>

        {/* Comments */}
        <Pressable
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.full,
            backgroundColor: pressed ? colors.muted : 'transparent',
          })}
        >
          <CommentIcon color={colors.mutedForeground} />
          <Text variant="caption" color="mutedForeground">
            {post.comments}
          </Text>
        </Pressable>

        {/* Share */}
        <Pressable
          style={({ pressed }) => ({
            padding: spacing.sm,
            borderRadius: radii.full,
            backgroundColor: pressed ? colors.muted : 'transparent',
          })}
        >
          <ShareIcon color={colors.mutedForeground} />
        </Pressable>

        {/* Bookmark */}
        <Pressable
          style={({ pressed }) => ({
            padding: spacing.sm,
            borderRadius: radii.full,
            backgroundColor: pressed ? colors.muted : 'transparent',
          })}
        >
          <BookmarkIcon color={colors.mutedForeground} />
        </Pressable>
      </View>
    </Pressable>
  );
}
