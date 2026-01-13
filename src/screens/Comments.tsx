/**
 * Comments - Native React Native component
 * Threaded comment system matching the Figma design
 */

import React, { useState } from 'react';
import { View, Pressable, TextInput, FlatList } from 'react-native';
import { Text, Avatar,  } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

// Icons
const ArrowUpIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 12, color }}>▲</Text>
);
const ArrowDownIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 12, color }}>▼</Text>
);
const ReplyIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 10, color }}>💬</Text>
);
const ShareIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 10, color }}>↗</Text>
);
const MoreIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 14, color }}>⋯</Text>
);

export interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  votes: number;
  timeAgo: string;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  onReply?: (commentId: number) => void;
}

function CommentItem({ comment, isReply = false, onReply }: CommentItemProps) {
  const { colors, spacing, radii } = useTheme();
  const [voteStatus, setVoteStatus] = useState<'up' | 'down' | null>(null);
  const [showReplies, setShowReplies] = useState(true);

  const currentVotes =
    voteStatus === 'up'
      ? comment.votes + 1
      : voteStatus === 'down'
      ? comment.votes - 1
      : comment.votes;

  return (
    <View
      style={[
        isReply && {
          marginLeft: spacing.xl,
          borderLeftWidth: 2,
          borderLeftColor: colors.border,
          paddingLeft: spacing.sm,
        },
      ]}
    >
      <View
        style={{
          backgroundColor: colors.card,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {/* Avatar */}
          <Avatar initials={comment.avatar} size={32} />

          {/* Content */}
          <View style={{ flex: 1 }}>
            {/* Author & Time */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.xs,
              }}
            >
              <Text variant="bodySmall" style={{ fontWeight: '500' }}>
                u/{comment.author}
              </Text>
              <Text variant="caption" color="mutedForeground">
                • {comment.timeAgo}
              </Text>
            </View>

            {/* Comment Text */}
            <Text variant="bodySmall" style={{ marginBottom: spacing.sm }}>
              {comment.content}
            </Text>

            {/* Actions */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              {/* Vote buttons */}
              <Pressable
                onPress={() => setVoteStatus(voteStatus === 'up' ? null : 'up')}
                style={{ padding: spacing.xs }}
              >
                <ArrowUpIcon
                  color={voteStatus === 'up' ? colors.accent : colors.mutedForeground}
                />
              </Pressable>
              <Text
                variant="caption"
                style={{
                  minWidth: 30,
                  textAlign: 'center',
                  color:
                    voteStatus === 'up'
                      ? colors.accent
                      : voteStatus === 'down'
                      ? colors.mutedForeground
                      : colors.foreground,
                }}
              >
                {currentVotes}
              </Text>
              <Pressable
                onPress={() => setVoteStatus(voteStatus === 'down' ? null : 'down')}
                style={{ padding: spacing.xs }}
              >
                <ArrowDownIcon color={colors.mutedForeground} />
              </Pressable>

              {/* Reply */}
              <Pressable
                onPress={() => onReply?.(comment.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.sm,
                  backgroundColor: pressed ? colors.muted : 'transparent',
                  marginLeft: spacing.sm,
                })}
              >
                <ReplyIcon color={colors.mutedForeground} />
                <Text variant="caption" color="mutedForeground">
                  Reply
                </Text>
              </Pressable>

              {/* Share */}
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.sm,
                  backgroundColor: pressed ? colors.muted : 'transparent',
                })}
              >
                <ShareIcon color={colors.mutedForeground} />
                <Text variant="caption" color="mutedForeground">
                  Share
                </Text>
              </Pressable>

              {/* More */}
              <Pressable
                style={({ pressed }) => ({
                  padding: spacing.xs,
                  borderRadius: radii.sm,
                  backgroundColor: pressed ? colors.muted : 'transparent',
                  marginLeft: 'auto',
                })}
              >
                <MoreIcon color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && showReplies && (
        <View style={{ marginTop: spacing.xs }}>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply onReply={onReply} />
          ))}
        </View>
      )}
    </View>
  );
}

interface CommentsProps {
  comments: Comment[];
  onReply?: (commentId: number) => void;
  onSubmitComment?: (text: string) => void;
}

export function Comments({ comments, onReply, onSubmitComment }: CommentsProps) {
  const { colors, spacing, radii } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [sortBy, setSortBy] = useState<'best' | 'top' | 'new'>('best');

  const handleSubmit = () => {
    if (commentText.trim()) {
      onSubmitComment?.(commentText.trim());
      setCommentText('');
    }
  };

  return (
    <View style={{ backgroundColor: colors.card }}>
      {/* Comment Input */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
          <Avatar initials="You" size={32} />
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor={colors.mutedForeground}
            onSubmitEditing={handleSubmit}
            style={{
              flex: 1,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.full,
              fontSize: 14,
              color: colors.foreground,
              backgroundColor: colors.background,
            }}
          />
        </View>
      </View>

      {/* Sort Options */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {(['best', 'top', 'new'] as const).map((option) => (
          <Pressable key={option} onPress={() => setSortBy(option)}>
            <Text
              variant="bodySmall"
              style={{
                color: sortBy === option ? colors.accent : colors.mutedForeground,
                fontWeight: sortBy === option ? '600' : '400',
                textTransform: 'capitalize',
              }}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Comments List */}
      <View>
        {comments.map((comment) => (
          <View
            key={comment.id}
            style={{ borderBottomWidth: 1, borderBottomColor: colors.muted }}
          >
            <CommentItem comment={comment} onReply={onReply} />
          </View>
        ))}
      </View>
    </View>
  );
}

// Sample comments data export for testing
export const sampleComments: Comment[] = [
  {
    id: 1,
    author: 'techguru42',
    avatar: 'TG',
    content:
      "Great insights! I've been using AI coding assistants for the past 6 months and it's completely changed my workflow. The productivity gains are real.",
    votes: 342,
    timeAgo: '8h ago',
    replies: [
      {
        id: 2,
        author: 'devmaster',
        avatar: 'DM',
        content:
          "Which AI assistant do you recommend? I've been looking into a few options but haven't committed to one yet.",
        votes: 89,
        timeAgo: '7h ago',
      },
      {
        id: 3,
        author: 'techguru42',
        avatar: 'TG',
        content:
          "I've been using GitHub Copilot mostly. It integrates really well with VS Code and the suggestions are quite accurate. Worth trying the free trial!",
        votes: 134,
        timeAgo: '6h ago',
      },
    ],
  },
  {
    id: 4,
    author: 'reactfan2023',
    avatar: 'RF',
    content:
      'The component-driven development section really resonates with me. We recently refactored our entire codebase to use a design system and the consistency improvements are incredible.',
    votes: 156,
    timeAgo: '5h ago',
  },
  {
    id: 5,
    author: 'webdev_ninja',
    avatar: 'WN',
    content:
      "Hot take: while AI tools are helpful, I think we need to be careful not to rely on them too much. Understanding the fundamentals is still crucial.",
    votes: 203,
    timeAgo: '4h ago',
    replies: [
      {
        id: 6,
        author: 'juniordev',
        avatar: 'JD',
        content:
          "100% agree. I see a lot of junior devs copying AI suggestions without understanding what the code does. That's a recipe for bugs down the line.",
        votes: 67,
        timeAgo: '3h ago',
      },
    ],
  },
  {
    id: 7,
    author: 'performance_freak',
    avatar: 'PF',
    content:
      "Performance-first frameworks are the way to go. Users don't care about what framework you used, they care about how fast your site loads.",
    votes: 421,
    timeAgo: '2h ago',
  },
];
