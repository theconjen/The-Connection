/**
 * PostDetailScreen - Native React Native screen
 * Full post view with content, voting, and comments
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Text, Avatar, useTheme } from '../theme';
import { Comments, Comment, sampleComments } from './Comments';
import { Post } from './PostCard';

// Icons
const BackIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>←</Text>
);
const MoreIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>⋯</Text>
);
const ArrowUpIcon = ({ color, filled }: { color: string; filled?: boolean }) => (
  <Text style={{ fontSize: 18, color }}>{filled ? '▲' : '△'}</Text>
);
const ArrowDownIcon = ({ color, filled }: { color: string; filled?: boolean }) => (
  <Text style={{ fontSize: 18, color }}>{filled ? '▼' : '▽'}</Text>
);
const CommentIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 16, color }}>💬</Text>
);
const ShareIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 16, color }}>↗</Text>
);
const BookmarkIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 16, color }}>🔖</Text>
);

interface PostDetailScreenProps {
  post: Post;
  comments?: Comment[];
  onBack?: () => void;
}

export function PostDetailScreen({
  post,
  comments = sampleComments,
  onBack,
}: PostDetailScreenProps) {
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

  // Sample expanded content
  const fullContent = `${post.content}

The Rise of AI-Powered Development

Artificial intelligence is no longer just a buzzword in web development—it's becoming an integral part of our daily workflow. From AI-assisted coding to automated testing and deployment, these tools are helping developers work more efficiently than ever before.

Performance-First Frameworks

The next generation of web frameworks is putting performance at the forefront. Edge computing, server-side rendering, and progressive enhancement are no longer optional—they're becoming the standard.

Component-Driven Development

The shift towards component-driven development has fundamentally changed how we approach building user interfaces. Design systems and component libraries are now essential tools in every developer's toolkit.

Whether you're a seasoned developer or just starting your journey, there's never been a more exciting time to be building for the web.`;

  const blockquote =
    '"The best way to predict the future is to build it. And in web development, we\'re building it faster and better than ever before."';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={colors.background === '#F5F8FA' ? 'dark-content' : 'light-content'}
      />

      {/* Header */}
      <View
        style={{
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => ({
            padding: spacing.sm,
            borderRadius: radii.full,
            backgroundColor: pressed ? colors.muted : 'transparent',
            marginLeft: -spacing.sm,
          })}
        >
          <BackIcon color={colors.foreground} />
        </Pressable>
        <Text variant="body" style={{ fontWeight: '500' }}>
          {post.channel}
        </Text>
        <Pressable
          style={({ pressed }) => ({
            padding: spacing.sm,
            borderRadius: radii.full,
            backgroundColor: pressed ? colors.muted : 'transparent',
            marginRight: -spacing.sm,
          })}
        >
          <MoreIcon color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Post Content Card */}
        <View style={{ backgroundColor: colors.card }}>
          {/* Post Header */}
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}
            >
              <Avatar initials={post.channelIcon} size={32} />
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                    {post.channel}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    •
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    Posted by u/{post.author}
                  </Text>
                </View>
                <Text variant="caption" color="mutedForeground">
                  {post.timeAgo}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text variant="title" style={{ marginBottom: spacing.sm }}>
              {post.title}
            </Text>

            {/* Flair */}
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                backgroundColor: colors.muted,
                borderRadius: radii.sm,
                marginBottom: spacing.md,
              }}
            >
              <Text variant="caption" style={{ color: colors.secondary }}>
                {post.flair}
              </Text>
            </View>
          </View>

          {/* Post Body */}
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
            {fullContent.split('\n\n').map((paragraph, index) => {
              // Check if it's a heading (starts with capital and is short)
              const isHeading =
                paragraph.length < 50 &&
                !paragraph.includes('.') &&
                paragraph === paragraph.trim();

              if (isHeading && index > 0) {
                return (
                  <Text
                    key={index}
                    variant="body"
                    style={{
                      fontWeight: '600',
                      marginTop: spacing.lg,
                      marginBottom: spacing.sm,
                    }}
                  >
                    {paragraph}
                  </Text>
                );
              }

              return (
                <Text
                  key={index}
                  variant="body"
                  style={{ marginBottom: spacing.md, lineHeight: 24 }}
                >
                  {paragraph}
                </Text>
              );
            })}

            {/* Blockquote */}
            <View
              style={{
                marginVertical: spacing.lg,
                padding: spacing.md,
                backgroundColor: colors.muted,
                borderLeftWidth: 2,
                borderLeftColor: colors.accent,
              }}
            >
              <Text variant="body" style={{ fontStyle: 'italic' }}>
                {blockquote}
              </Text>
            </View>
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
              borderTopColor: colors.border,
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
                variant="bodySmall"
                style={{
                  minWidth: 40,
                  textAlign: 'center',
                  fontWeight: '500',
                  color:
                    voteStatus === 'up'
                      ? colors.accent
                      : voteStatus === 'down'
                      ? colors.mutedForeground
                      : colors.foreground,
                }}
              >
                {votes}
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
                gap: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radii.full,
                backgroundColor: pressed ? colors.muted : 'transparent',
              })}
            >
              <CommentIcon color={colors.mutedForeground} />
              <Text variant="bodySmall" color="mutedForeground">
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
        </View>

        {/* Comments Section */}
        <View style={{ marginTop: spacing.sm }}>
          <Comments
            comments={comments}
            onReply={(id) => console.log('Reply to', id)}
            onSubmitComment={(text) => console.log('New comment:', text)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
