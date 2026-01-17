/**
 * PostCard - Native React Native component
 * Matches the Figma design for forum post previews
 */

import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Image } from 'react-native';
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
  displayName?: string;
  username?: string;
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
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCount = (count: number | undefined | null) => {
    if (count === undefined || count === null) {
      return '0';
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Helper to get avatar URL for author
  const getAvatarUrl = () => {
    if (post.isAnonymous) {
      return 'https://ui-avatars.com/api/?name=A&background=9CA3AF&color=fff';
    }
    const displayText = post.displayName || post.username || post.author;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayText)}&background=222D99&color=fff`;
  };

  // Get the display name to show
  const getDisplayName = () => {
    if (post.isAnonymous) return 'Anonymous';
    return post.displayName || post.username || post.author;
  };

  // Check if content needs "Read more" (more than 2 lines worth of text, roughly 100 chars)
  const needsExpansion = post.content.length > 100;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.backgroundSoft,
          opacity: pressed ? 0.95 : 1,
          marginBottom: 1,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          overflow: 'hidden',
        },
      ]}
    >
      {/* Post Header - Matching Microblog Style */}
      <View style={{ flexDirection: 'row', padding: spacing.lg, paddingBottom: spacing.md }}>
        {/* Avatar - 40x40 to match microblogs */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (!post.isAnonymous && post.authorId && onAuthorPress) {
              onAuthorPress(post.authorId);
            }
          }}
          disabled={post.isAnonymous || !post.authorId || !onAuthorPress}
        >
          <Image
            source={{ uri: getAvatarUrl() }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceMuted,
            }}
          />
        </Pressable>

        {/* Content Area */}
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          {/* Header Row: Channel, Author, Time, Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
              {post.isAnonymous ? (
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: colors.textMuted,
                    fontStyle: 'italic',
                  }}
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
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: colors.textPrimary,
                      textDecorationLine: onAuthorPress && post.authorId ? 'underline' : 'none',
                    }}
                  >
                    {getDisplayName()}
                  </Text>
                </Pressable>
              )}
              <Text variant="caption" color="textMuted">•</Text>
              <Text variant="caption" color="textMuted">{post.timeAgo}</Text>
            </View>

            {/* Top Right Actions */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onMorePress?.();
                }}
                style={({ pressed }) => ({
                  padding: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
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

          {/* Post Content Preview with Expand/Collapse */}
          <View style={{ marginBottom: spacing.sm }}>
            <Text
              variant="bodySmall"
              color="textMuted"
              numberOfLines={isExpanded ? undefined : 2}
            >
              {post.content}
            </Text>
            {needsExpansion && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                style={{ marginTop: spacing.xs }}
              >
                <Text
                  variant="caption"
                  style={{ color: colors.accent, fontWeight: '600' }}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Flair */}
          <Badge variant="secondary">{post.flair}</Badge>

          {/* Action Buttons - Match microblog layout */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.md,
          }}>
            {/* Left side: Comments and Like */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              {/* Comments */}
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  padding: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                })}
              >
                <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
                <Text variant="caption" color="textMuted">
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
                  backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
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

            {/* Right side: Bookmark */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onBookmarkPress?.();
              }}
              style={({ pressed }) => ({
                padding: spacing.sm,
                borderRadius: radii.full,
                backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
              })}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isBookmarked ? colors.bookmark : colors.textMuted}
              />
            </Pressable>
          </View>
      </View>
    </View>
  </Pressable>
  );
}
