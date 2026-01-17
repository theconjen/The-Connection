/**
 * PostCard - Native React Native component
 * Matches the Figma design for forum post previews
 */

import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, Badge, Avatar } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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
  authorId?: number;
  isAnonymous?: boolean;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  flair: string;
  isLiked?: boolean;
}

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLikePress?: () => void;
  onAuthorPress?: (authorId: number) => void;
  onBookmarkPress?: () => void;
  onMorePress?: () => void;
  isBookmarked?: boolean;
}

export function PostCard({ post, onPress, onLikePress, onAuthorPress, onBookmarkPress, onMorePress, isBookmarked }: PostCardProps) {
  const { colors, spacing, radii } = useTheme();

  const formatCount = (count: number | undefined | null) => {
    if (count === undefined || count === null) {
      return '0';
    }
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
          backgroundColor: colors.surface,
          opacity: pressed ? 0.95 : 1,
          marginBottom: 1,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          overflow: 'hidden',
        },
      ]}
    >
      {/* Post Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md }}>
        {/* Top Row: Channel/Author Info + Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          {/* Channel & Author Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <Avatar initials={post.channelIcon} size={24} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap', flex: 1 }}>
              <Text variant="caption" color="foreground" style={{ fontWeight: '600' }}>
                {post.channel}
              </Text>
              <Text variant="caption" color="mutedForeground">•</Text>
              {post.isAnonymous ? (
                <Text
                  variant="caption"
                  color="mutedForeground"
                  style={{ fontStyle: 'italic' }}
                >
                  Anonymous
                </Text>
              ) : (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    if (post.authorId && onAuthorPress) {
                      onAuthorPress(post.authorId);
                    }
                  }}
                  disabled={!post.authorId || !onAuthorPress}
                >
                  <Text
                    variant="caption"
                    color="mutedForeground"
                    style={{ textDecorationLine: onAuthorPress && post.authorId ? 'underline' : 'none' }}
                  >
                    @{post.author}
                  </Text>
                </Pressable>
              )}
              <Text variant="caption" color="mutedForeground">•</Text>
              <Text variant="caption" color="mutedForeground">{post.timeAgo}</Text>
            </View>
          </View>

          {/* Top Right Actions: Bookmark + More */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            {/* Bookmark */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onBookmarkPress?.();
              }}
              style={({ pressed }) => ({
                padding: spacing.sm,
                borderRadius: radii.full,
                backgroundColor: pressed ? colors.muted : 'transparent',
              })}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isBookmarked ? colors.bookmark : colors.textMuted}
              />
            </Pressable>

            {/* More Menu */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onMorePress?.();
              }}
              style={({ pressed }) => ({
                padding: spacing.sm,
                borderRadius: radii.full,
                backgroundColor: pressed ? colors.muted : 'transparent',
              })}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
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

        {/* Action Buttons - Match microblog layout */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          marginTop: spacing.md,
        }}>
          {/* Comments */}
          <Pressable
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              padding: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: pressed ? colors.muted : 'transparent',
            })}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
            <Text variant="caption" color="mutedForeground">
              {post.comments}
            </Text>
          </Pressable>

          {/* Like Button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onLikePress?.();
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              padding: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: pressed ? colors.muted : 'transparent',
            })}
          >
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={post.isLiked ? colors.like : colors.textMuted}
            />
            <Text
              variant="caption"
              style={{ color: post.isLiked ? colors.like : colors.textMuted }}
            >
              {formatCount(post.likes)}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
