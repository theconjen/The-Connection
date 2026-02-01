/**
 * PostCard - Native React Native component
 * Matches the Figma design for forum post previews
 */

import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, Image, Text as RNText } from 'react-native';
import { Text, Badge, Avatar } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { sharePost } from '../lib/shareUrls';
import { ImageCarousel } from '../components/ImageCarousel';
import { ClergyBadge } from '../components/ClergyBadge';

// Helper to extract first sentence from text
function getFirstSentence(text: string): { firstSentence: string; rest: string } {
  const match = text.match(/^(.*?[.!?])(\s|$)/);
  if (match) {
    return {
      firstSentence: match[1],
      rest: text.slice(match[1].length).trim(),
    };
  }
  if (text.length > 120) {
    const breakPoint = text.lastIndexOf(' ', 120);
    const cutoff = breakPoint > 60 ? breakPoint : 120;
    return {
      firstSentence: text.slice(0, cutoff),
      rest: text.slice(cutoff).trim(),
    };
  }
  return { firstSentence: text, rest: '' };
}

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
  isVerifiedClergy?: boolean;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  flair: string;
  isLiked?: boolean;
  // Media fields
  imageUrls?: string[];
  videoUrl?: string;
  gifUrl?: string;
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
          {/* Header Row: Author identity hierarchy */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <Pressable
              style={{ flex: 1 }}
              onPress={(e) => {
                e.stopPropagation();
                if (!post.isAnonymous && post.authorId && onAuthorPress) {
                  onAuthorPress(post.authorId);
                }
              }}
              disabled={post.isAnonymous || !post.authorId || !onAuthorPress}
            >
              {post.isAnonymous ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
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
                  <Text style={{ fontSize: 12, color: colors.textMuted, opacity: 0.6, marginHorizontal: 4 }}>·</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, opacity: 0.7 }}>{post.timeAgo}</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: colors.textPrimary,
                    }}
                  >
                    {post.displayName || post.username || post.author}
                  </Text>
                  {post.isVerifiedClergy && <ClergyBadge size="small" />}
                  <Text style={{ fontSize: 12, color: colors.textMuted, opacity: 0.6, marginHorizontal: 4 }}>·</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, opacity: 0.7 }}>{post.timeAgo}</Text>
                </View>
              )}
            </Pressable>

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

          {/* Post Content Preview with Expand/Collapse - Bold first sentence */}
          <View style={{ marginBottom: spacing.sm }}>
            <Text
              variant="bodySmall"
              color="textMuted"
              numberOfLines={isExpanded ? undefined : 2}
            >
              {(() => {
                const { firstSentence, rest } = getFirstSentence(post.content);
                return (
                  <>
                    <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{firstSentence}</Text>
                    {rest ? <Text>{' '}{rest}</Text> : null}
                  </>
                );
              })()}
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
                  {isExpanded ? 'Show less' : 'Open discussion'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Media Content */}
          {post.gifUrl && (
            <Image
              source={{ uri: post.gifUrl }}
              style={{
                width: '100%',
                height: 180,
                borderRadius: radii.md,
                marginBottom: spacing.sm,
                backgroundColor: colors.surfaceMuted,
              }}
              resizeMode="contain"
            />
          )}

          {post.imageUrls && post.imageUrls.length > 0 && (
            <View style={{ marginBottom: spacing.sm }}>
              <ImageCarousel
                images={post.imageUrls}
                height={post.imageUrls.length === 1 ? 200 : 180}
                borderRadius={radii.md}
              />
            </View>
          )}

          {post.videoUrl && (
            <View style={{
              position: 'relative',
              marginBottom: spacing.sm,
              borderRadius: radii.md,
              overflow: 'hidden',
            }}>
              <Image
                source={{ uri: post.videoUrl }}
                style={{
                  width: '100%',
                  height: 180,
                  backgroundColor: colors.surfaceMuted,
                }}
                resizeMode="cover"
              />
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}>
                <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          )}

          {/* Flair - hide "Discussion" label since pills already show type */}
          {post.flair && post.flair !== 'Discussion' && (
            <Badge variant="secondary">{post.flair}</Badge>
          )}

          {/* Engagement prompt when both counts are zero */}
          {(post.comments || 0) === 0 && (post.likes || 0) === 0 && (
            <Pressable
              onPress={onPress}
              style={{
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md + 2,
                backgroundColor: colors.surfaceMuted,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                marginTop: spacing.sm,
                alignSelf: 'flex-start',
              }}
            >
              <Text variant="caption" style={{ color: colors.textPrimary, fontWeight: '500' }}>
                Join the discussion
              </Text>
            </Pressable>
          )}

          {/* Action Buttons - icons have reduced opacity when counts are zero */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.md,
          }}>
            {/* Left side: Comments and Like */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              {/* Comments - show icon always, reduced opacity when count is 0 */}
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  padding: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                  opacity: (post.comments || 0) === 0 ? 0.7 : 1,
                })}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color={colors.textMuted}
                  style={(post.comments || 0) === 0 ? { opacity: 0.5 } : undefined}
                />
                {(post.comments || 0) > 0 && (
                  <Text variant="caption" color="textMuted">
                    {post.comments}
                  </Text>
                )}
              </Pressable>

              {/* Like Button - reduced opacity when count is 0 and not liked */}
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
                  opacity: (post.likes || 0) === 0 && !post.isLiked ? 0.7 : 1,
                })}
              >
                <Ionicons
                  name={post.isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={post.isLiked ? colors.like : colors.textMuted}
                  style={(post.likes || 0) === 0 && !post.isLiked ? { opacity: 0.5 } : undefined}
                />
                {(post.likes || 0) > 0 && (
                  <Text
                    variant="caption"
                    style={{ color: post.isLiked ? colors.like : colors.textMuted }}
                  >
                    {formatCount(post.likes)}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Right side: Share and Bookmark */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  sharePost(post.id, post.title || 'Post');
                }}
                style={({ pressed }) => ({
                  padding: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                })}
              >
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
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
    </View>
  </Pressable>
  );
}
