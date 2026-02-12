/**
 * Advice Post Detail Screen
 * Shows community advice questions with responses (forum-like)
 * Uses upvote instead of like for community-driven engagement
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import apiClient from '../../src/lib/apiClient';
import { Text } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { shareAdvice, shareAdviceResponse } from '../../src/lib/shareUrls';
import { ShareContentModal, ShareableContent } from '../../src/components/ShareContentModal';

// Get avatar URL with fallback to UI Avatars
function getAvatarUrl(author?: any): string {
  if (!author) return 'https://ui-avatars.com/api/?name=U&background=222D99&color=fff';
  const url = author.profileImageUrl || author.avatarUrl;
  if (url) return url;
  const name = author.displayName || author.username || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=222D99&color=fff`;
}

// Generate contextual prompt for empty comments based on post content
function getContextualPrompt(post: any): string {
  const content = (post?.content || '').toLowerCase();

  if (content.includes('how do you') || content.includes('tips for') || content.includes('any advice')) {
    return 'Share your experience or advice';
  }
  if (content.includes('pray') || content.includes('prayer')) {
    return 'How can you encourage?';
  }
  if (content.includes('?')) {
    return 'What are your thoughts on this?';
  }
  if (content.includes('struggl') || content.includes('challeng') || content.includes('difficult')) {
    return 'Have you experienced something similar?';
  }

  const defaults = [
    'Share your perspective',
    'How would you respond?',
    'What wisdom would you offer?',
  ];
  return defaults[(post?.id || 0) % defaults.length];
}

export default function AdviceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ y: 0 });
  const [responseMenuVisible, setResponseMenuVisible] = useState<number | null>(null);
  const [responseMenuPosition, setResponseMenuPosition] = useState({ y: 0 });
  const [isPostReported, setIsPostReported] = useState(false);
  const [reportedResponses, setReportedResponses] = useState<Set<number>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState<ShareableContent | null>(null);
  const [myHelpfulMarkReplyId, setMyHelpfulMarkReplyId] = useState<number | null>(null);

  const adviceId = parseInt(id || '0');

  // Fetch advice post (stored as microblog with topic=QUESTION)
  const { data: advicePost, isLoading: adviceLoading } = useQuery({
    queryKey: ['advice', adviceId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/microblogs/${adviceId}`);
      return response.data;
    },
  });

  // Fetch responses
  const { data: responses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ['advice-responses', adviceId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/microblogs/${adviceId}/comments`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching advice responses:', error);
        return [];
      }
    },
  });

  // Add response mutation
  const responseMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(`/api/microblogs/${adviceId}/comments`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advice-responses', adviceId] });
      queryClient.invalidateQueries({ queryKey: ['advice', adviceId] });
      queryClient.invalidateQueries({ queryKey: ['advice-posts'] });
      setCommentText('');
    },
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const isUpvoted = advicePost?.isLiked;
      if (isUpvoted) {
        await apiClient.delete(`/api/microblogs/${adviceId}/like`);
      } else {
        await apiClient.post(`/api/microblogs/${adviceId}/like`);
      }
      return !isUpvoted;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['advice', adviceId] });
      const previous = queryClient.getQueryData(['advice', adviceId]);
      queryClient.setQueryData(['advice', adviceId], (old: any) => ({
        ...old,
        isLiked: !old?.isLiked,
        likeCount: (old?.likeCount || 0) + (old?.isLiked ? -1 : 1),
      }));
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['advice', adviceId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['advice', adviceId] });
      queryClient.invalidateQueries({ queryKey: ['advice-posts'] });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const isBookmarked = advicePost?.isBookmarked;
      if (isBookmarked) {
        await apiClient.delete(`/api/microblogs/${adviceId}/bookmark`);
      } else {
        await apiClient.post(`/api/microblogs/${adviceId}/bookmark`);
      }
      return !isBookmarked;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['advice', adviceId] });
      const previous = queryClient.getQueryData(['advice', adviceId]);
      queryClient.setQueryData(['advice', adviceId], (old: any) => ({
        ...old,
        isBookmarked: !old?.isBookmarked,
      }));
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['advice', adviceId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['advice', adviceId] });
    },
  });

  // Mark helpful mutation - any user can mark ONE reply per question
  const markHelpfulMutation = useMutation({
    mutationFn: async (replyId: number) => {
      const response = await apiClient.post(`/api/microblogs/${adviceId}/replies/${replyId}/mark-helpful`);
      return response.data;
    },
    onMutate: async (replyId: number) => {
      // Optimistic update
      setMyHelpfulMarkReplyId(replyId);
    },
    onSuccess: (data) => {
      // Update with server response
      setMyHelpfulMarkReplyId(data.mark?.replyId || null);
      queryClient.invalidateQueries({ queryKey: ['advice-responses', adviceId] });
    },
    onError: () => {
      // Revert on error
      setMyHelpfulMarkReplyId(null);
      Alert.alert('Error', 'Could not mark as helpful. Please try again.');
    },
  });

  // Unmark helpful mutation
  const unmarkHelpfulMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`/api/microblogs/${adviceId}/mark-helpful`);
      return response.data;
    },
    onMutate: async () => {
      setMyHelpfulMarkReplyId(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advice-responses', adviceId] });
    },
    onError: () => {
      Alert.alert('Error', 'Could not remove helpful mark. Please try again.');
    },
  });

  // Handle marking/unmarking helpful
  const handleToggleHelpful = (replyId: number) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to mark responses as helpful.');
      return;
    }

    if (myHelpfulMarkReplyId === replyId) {
      // Already marked this reply - unmark it
      unmarkHelpfulMutation.mutate();
    } else {
      // Mark this reply (will switch from previous if any)
      markHelpfulMutation.mutate(replyId);
    }
  };

  const handleSubmitResponse = () => {
    if (!commentText.trim()) return;
    responseMutation.mutate(commentText.trim());
  };

  const formatTime = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getAuthorName = (data: any): string => {
    if (data?.isAnonymous) return 'Anonymous';
    return data?.author?.displayName ||
           data?.author?.username ||
           data?.authorName ||
           'Unknown User';
  };

  // Handle sharing the main advice post
  const handleSharePost = async () => {
    setMenuVisible(false);
    const preview = advicePost?.content || '';
    const result = await shareAdvice(adviceId, preview);
    if (!result.success && result.error !== 'Share dismissed') {
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  // Handle sharing a response
  const handleShareResponse = async (response: any) => {
    setResponseMenuVisible(null);
    const result = await shareAdviceResponse(adviceId, response.content);
    if (!result.success && result.error !== 'Share dismissed') {
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  // Handle in-app sharing of the main advice post
  const handleInAppSharePost = () => {
    setMenuVisible(false);
    const preview = advicePost?.content || '';
    setShareContent({
      type: 'advice',
      id: adviceId,
      title: advicePost?.anonymousNickname ? `Advice from ${advicePost.anonymousNickname}` : 'Advice Post',
      preview: preview.length > 150 ? preview.substring(0, 150) + '...' : preview,
    });
    setShowShareModal(true);
  };

  // Handle in-app sharing of a response
  const handleInAppShareResponse = (response: any) => {
    setResponseMenuVisible(null);
    const authorName = response.author?.displayName || response.author?.username || 'User';
    setShareContent({
      type: 'advice',
      id: adviceId,
      title: `Response from ${authorName}`,
      preview: response.content.length > 150 ? response.content.substring(0, 150) + '...' : response.content,
    });
    setShowShareModal(true);
  };

  // Handle report for main post
  const handleReportPost = () => {
    setMenuVisible(false);
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post? Our team will review it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            setIsPostReported(true);
            try {
              await apiClient.post('/api/reports', {
                subjectType: 'microblog',
                subjectId: adviceId,
                reason: 'inappropriate_content',
              });
            } catch (error) {
              console.error('Error reporting post:', error);
            }
          },
        },
      ]
    );
  };

  const handleUndoReportPost = () => {
    setIsPostReported(false);
  };

  // Handle report for a response
  const handleReportResponse = (response: any) => {
    setResponseMenuVisible(null);
    Alert.alert(
      'Report Response',
      'Are you sure you want to report this response? Our team will review it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            setReportedResponses(prev => new Set(prev).add(response.id));
            try {
              await apiClient.post('/api/reports', {
                subjectType: 'microblog',
                subjectId: response.id,
                reason: 'inappropriate_content',
                description: 'Comment/response on advice post',
              });
            } catch (error) {
              console.error('Error reporting response:', error);
            }
          },
        },
      ]
    );
  };

  const handleUndoReportResponse = (responseId: number) => {
    setReportedResponses(prev => {
      const next = new Set(prev);
      next.delete(responseId);
      return next;
    });
  };

  // Show dropdown menu for main post
  const showPostMenu = (pageY: number) => {
    setMenuPosition({ y: pageY + 25 });
    setMenuVisible(true);
  };

  // Show dropdown menu for a response
  const showResponseMenu = (response: any, pageY: number) => {
    setResponseMenuPosition({ y: pageY + 25 });
    setResponseMenuVisible(response.id);
  };

  if (adviceLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isUpvoted = advicePost?.isLiked || false;
  const isBookmarked = advicePost?.isBookmarked || false;
  const upvoteCount = advicePost?.likeCount || 0;
  const responseCount = responses?.length || advicePost?.commentCount || 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/advice')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Advice</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {advicePost && (
            <View style={styles.postSection}>
              {/* Question Card - Anonymous with optional nickname */}
              {isPostReported ? (
                <View style={[styles.questionCard, styles.reportedCard]}>
                  <View style={styles.reportedContent}>
                    <Ionicons name="flag" size={28} color={colors.textMuted} />
                    <Text style={[styles.reportedTitle, { color: colors.textSecondary }]}>
                      Content Reported
                    </Text>
                    <Text style={[styles.reportedText, { color: colors.textMuted }]}>
                      This will be reviewed by The Connection Team
                    </Text>
                    <Pressable
                      style={[styles.undoButton, { borderColor: colors.textMuted }]}
                      onPress={handleUndoReportPost}
                    >
                      <Text style={[styles.undoButtonText, { color: colors.textMuted }]}>Undo</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
              <View style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <View style={[styles.anonymousAvatar, { backgroundColor: colors.surfaceMuted }]}>
                    <Ionicons name="person" size={20} color={colors.textMuted} />
                  </View>
                  <View style={styles.authorInfo}>
                    <Text style={[styles.postAuthorName, { color: colors.textSecondary }]}>
                      {advicePost.anonymousNickname || 'Anonymous'}
                    </Text>
                    <Text style={styles.postTime}>
                      {advicePost.createdAt ? formatTime(advicePost.createdAt) : 'Recently'}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    {/* Edit button - only show for own posts */}
                    {user?.id === advicePost?.userId && (
                      <Pressable
                        onPress={() => router.push(`/advice/edit/${adviceId}` as any)}
                        hitSlop={8}
                        style={styles.cardAction}
                      >
                        <Ionicons name="pencil-outline" size={18} color={colors.textMuted} />
                      </Pressable>
                    )}
                    <Pressable onPress={() => bookmarkMutation.mutate()} hitSlop={8} style={styles.cardAction}>
                      <Ionicons
                        name={isBookmarked ? "bookmark" : "bookmark-outline"}
                        size={20}
                        color={isBookmarked ? colors.primary : colors.textMuted}
                      />
                    </Pressable>
                    <Pressable onPress={(e) => showPostMenu(e.nativeEvent.pageY)} hitSlop={8} style={styles.cardAction}>
                      <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>

                {/* Topic Badge */}
                <View style={styles.topicBadge}>
                  <Ionicons name="help-circle" size={14} color="#EC4899" />
                  <Text style={styles.topicBadgeText}>Seeking Advice</Text>
                </View>

                {/* Content */}
                <Text style={styles.postContent}>{advicePost.content}</Text>

                {/* Attached Images */}
                {advicePost.imageUrls && advicePost.imageUrls.length > 0 && (
                  <View style={styles.attachedImages}>
                    {advicePost.imageUrls.map((imageUrl: string, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.attachedImageWrapper,
                          advicePost.imageUrls.length === 1 && styles.singleAttachedImage,
                        ]}
                        onPress={() => {/* Could open image viewer */}}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.attachedImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Attached Link */}
                {advicePost.sourceUrl && (
                  <TouchableOpacity
                    style={[styles.linkPreview, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}
                    onPress={() => Linking.openURL(advicePost.sourceUrl)}
                  >
                    <Ionicons name="link" size={16} color={colors.primary} />
                    <Text style={[styles.linkPreviewText, { color: colors.primary }]} numberOfLines={1}>
                      {advicePost.sourceUrl}
                    </Text>
                    <Ionicons name="open-outline" size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}

                {/* Tags */}
                {advicePost.tags && advicePost.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {advicePost.tags.map((tag: string, index: number) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Actions */}
                <View style={styles.postActions}>
                  <Pressable
                    style={styles.postAction}
                    onPress={() => upvoteMutation.mutate()}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={isUpvoted ? "arrow-up" : "arrow-up-outline"}
                      size={22}
                      color={isUpvoted ? colors.primary : colors.textSecondary}
                    />
                    {upvoteCount > 0 && (
                      <Text style={[styles.postActionText, isUpvoted && { color: colors.primary }]}>
                        {upvoteCount}
                      </Text>
                    )}
                  </Pressable>
                  <View style={styles.postAction}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                    {responseCount > 0 && (
                      <Text style={styles.postActionText}>{responseCount}</Text>
                    )}
                  </View>
                </View>
              </View>
              )}
            </View>
          )}

          {/* Responses Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              {responseCount > 0 ? `Responses (${responseCount})` : 'Share your wisdom'}
            </Text>

            {responsesLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : !responses || responses.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={40}
                  color={colors.textMuted || colors.textSecondary}
                  style={{ opacity: 0.6 }}
                />
                <Text style={styles.emptyCommentsPrompt}>
                  {getContextualPrompt(advicePost)}
                </Text>
                <Text style={styles.emptyCommentsSubtext}>
                  Your perspective matters here.
                </Text>
              </View>
            ) : (
              responses.map((response: any) => {
                const isResponseReported = reportedResponses.has(response.id);

                if (isResponseReported) {
                  return (
                    <View key={response.id} style={[styles.commentCard, styles.reportedResponseCard]}>
                      <View style={styles.reportedResponseContent}>
                        <Ionicons name="flag" size={20} color={colors.textMuted} />
                        <Text style={[styles.reportedResponseTitle, { color: colors.textSecondary }]}>
                          Response Reported
                        </Text>
                        <Text style={[styles.reportedResponseText, { color: colors.textMuted }]}>
                          This will be reviewed by The Connection Team
                        </Text>
                        <Pressable
                          style={[styles.undoButton, { borderColor: colors.textMuted }]}
                          onPress={() => handleUndoReportResponse(response.id)}
                        >
                          <Text style={[styles.undoButtonText, { color: colors.textMuted }]}>Undo</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                }

                const isMarkedHelpful = response.isMarkedHelpfulByMe || myHelpfulMarkReplyId === response.id;
                const helpfulCount = response.helpfulCount || 0;
                const isTopHelpful = helpfulCount > 0 && responses.every((r: any) => r.helpfulCount <= helpfulCount);

                return (
                  <View key={response.id} style={[styles.commentCard, isTopHelpful && styles.topHelpfulCard]}>
                    <Image
                      source={{ uri: getAvatarUrl(response.author) }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentMain}>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentAuthorRow}>
                          <Text style={styles.commentAuthorName}>
                            {response.author?.displayName || response.author?.username || 'User'}
                          </Text>
                          {/* Top Contributor Label */}
                          {response.author?.isTopContributor && (
                            <Text style={styles.topContributorLabel}>Top Contributor</Text>
                          )}
                          <Text style={styles.postDot}>·</Text>
                          {response.createdAt && (
                            <Text style={styles.postTime}>{formatTime(response.createdAt)}</Text>
                          )}
                        </View>
                        <Pressable
                          onPress={(e) => showResponseMenu(response, e.nativeEvent.pageY)}
                          hitSlop={8}
                          style={styles.responseMenuButton}
                        >
                          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
                        </Pressable>
                      </View>
                      <Text style={styles.commentContent}>{response.content}</Text>
                      {/* Helpful Mark Section */}
                      <View style={styles.responseActions}>
                        <Pressable
                          style={styles.helpfulButton}
                          onPress={() => handleToggleHelpful(response.id)}
                          hitSlop={8}
                        >
                          <Ionicons
                            name={isMarkedHelpful ? "checkmark-circle" : "checkmark-circle-outline"}
                            size={18}
                            color={isMarkedHelpful ? colors.success || '#22C55E' : colors.textMuted}
                          />
                          <Text style={[
                            styles.helpfulButtonText,
                            isMarkedHelpful && { color: colors.success || '#22C55E' }
                          ]}>
                            {helpfulCount > 0 ? helpfulCount : ''} Helpful
                          </Text>
                        </Pressable>
                        {isTopHelpful && helpfulCount > 0 && (
                          <View style={styles.mostHelpfulBadge}>
                            <Text style={styles.mostHelpfulText}>Most Helpful</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Response Input */}
        <View style={styles.inputContainer}>
          <Image source={{ uri: getAvatarUrl(user) }} style={styles.inputAvatar} />
          <TextInput
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Share your advice..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}
            onPress={handleSubmitResponse}
            disabled={!commentText.trim() || responseMutation.isPending}
          >
            {responseMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu for Post */}
        {menuVisible && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
              <View style={styles.dropdownOverlay}>
                <View
                  style={[
                    styles.dropdownMenu,
                    {
                      backgroundColor: colors.surface,
                      top: menuPosition.y,
                      right: 16,
                    }
                  ]}
                >
                  <Pressable style={styles.dropdownItem} onPress={handleInAppSharePost}>
                    <Ionicons name="paper-plane-outline" size={18} color={colors.textPrimary} />
                    <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>Send to...</Text>
                  </Pressable>
                  <View style={[styles.dropdownDivider, { backgroundColor: colors.borderSubtle }]} />
                  <Pressable style={styles.dropdownItem} onPress={handleSharePost}>
                    <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
                    <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>Share External</Text>
                  </Pressable>
                  <View style={[styles.dropdownDivider, { backgroundColor: colors.borderSubtle }]} />
                  <Pressable style={styles.dropdownItem} onPress={handleReportPost}>
                    <Ionicons name="flag-outline" size={18} color="#EF4444" />
                    <Text style={[styles.dropdownText, { color: '#EF4444' }]}>Report</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {/* Dropdown Menu for Response */}
        {responseMenuVisible !== null && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => setResponseMenuVisible(null)}
          >
            <TouchableWithoutFeedback onPress={() => setResponseMenuVisible(null)}>
              <View style={styles.dropdownOverlay}>
                <View
                  style={[
                    styles.dropdownMenu,
                    {
                      backgroundColor: colors.surface,
                      top: responseMenuPosition.y,
                      right: 16,
                    }
                  ]}
                >
                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => {
                      const response = responses.find((r: any) => r.id === responseMenuVisible);
                      if (response) handleInAppShareResponse(response);
                    }}
                  >
                    <Ionicons name="paper-plane-outline" size={18} color={colors.textPrimary} />
                    <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>Send to...</Text>
                  </Pressable>
                  <View style={[styles.dropdownDivider, { backgroundColor: colors.borderSubtle }]} />
                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => {
                      const response = responses.find((r: any) => r.id === responseMenuVisible);
                      if (response) handleShareResponse(response);
                    }}
                  >
                    <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
                    <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>Share External</Text>
                  </Pressable>
                  <View style={[styles.dropdownDivider, { backgroundColor: colors.borderSubtle }]} />
                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => {
                      const response = responses.find((r: any) => r.id === responseMenuVisible);
                      if (response) handleReportResponse(response);
                    }}
                  >
                    <Ionicons name="flag-outline" size={18} color="#EF4444" />
                    <Text style={[styles.dropdownText, { color: '#EF4444' }]}>Report</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {/* In-App Share Modal */}
        <ShareContentModal
          visible={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareContent(null);
          }}
          content={shareContent}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, theme: string) => {
  const isDark = theme === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface || colors.background
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface || colors.background
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 60,
      backgroundColor: colors.surface || colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle || colors.border
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary || colors.text
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      flex: 1
    },
    postSection: {
      backgroundColor: colors.surface || colors.background,
      borderBottomWidth: 8,
      borderBottomColor: colors.surfaceMuted || colors.muted
    },
    questionCard: {
      padding: 16,
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
      gap: 8,
    },
    cardAction: {
      padding: 4,
    },
    anonymousAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    authorInfo: {
      marginLeft: 12,
    },
    postAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.borderLight || colors.muted,
    },
    postAuthorName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary || colors.text,
    },
    postTime: {
      fontSize: 12,
      color: colors.textMuted || colors.textSecondary,
      marginTop: 2,
    },
    topicBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    topicBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#EC4899',
    },
    postContent: {
      fontSize: 17,
      color: colors.textPrimary || colors.text,
      lineHeight: 26,
      marginTop: 8,
    },
    attachedImages: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    attachedImageWrapper: {
      width: (Dimensions.get('window').width - 48) / 2,
      height: 150,
      borderRadius: 12,
      overflow: 'hidden',
    },
    singleAttachedImage: {
      width: Dimensions.get('window').width - 32,
      height: 220,
    },
    attachedImage: {
      width: '100%',
      height: '100%',
    },
    linkPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    linkPreviewText: {
      flex: 1,
      fontSize: 14,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      gap: 8,
    },
    tag: {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 13,
      color: '#6366F1',
      fontWeight: '500',
    },
    postActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle || colors.border,
    },
    postAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    postActionText: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    commentsSection: {
      padding: 16,
      backgroundColor: colors.surface || colors.background
    },
    commentsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary || colors.text,
      marginBottom: 16
    },
    emptyComments: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
    },
    emptyCommentsPrompt: {
      marginTop: 16,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary || colors.text,
      textAlign: 'center',
      lineHeight: 24,
    },
    emptyCommentsSubtext: {
      marginTop: 8,
      fontSize: 14,
      color: colors.textMuted || colors.textSecondary,
      fontStyle: 'italic',
    },
    commentCard: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle || colors.border,
    },
    commentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.borderLight || colors.muted,
    },
    commentMain: {
      flex: 1,
      marginLeft: 12,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    commentAuthorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      flex: 1,
    },
    responseMenuButton: {
      padding: 4,
    },
    commentAuthorName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary || colors.text,
      marginRight: 4,
    },
    commentContent: {
      fontSize: 15,
      color: colors.textPrimary || colors.text,
      lineHeight: 22,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 12,
      paddingBottom: Platform.OS === 'ios' ? 34 : 12,
      backgroundColor: colors.surface || colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle || colors.border,
      alignItems: 'flex-end',
    },
    inputAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.borderLight || colors.muted,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceMuted || colors.muted,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      maxHeight: 100,
      marginHorizontal: 12,
      color: colors.textPrimary || colors.text,
    },
    postButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    postButtonDisabled: {
      opacity: 0.5,
    },
    postDot: {
      color: colors.textMuted || colors.textSecondary,
      marginHorizontal: 4,
    },
    dropdownOverlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    dropdownMenu: {
      position: 'absolute',
      minWidth: 140,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      overflow: 'hidden',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 10,
    },
    dropdownText: {
      fontSize: 15,
      fontWeight: '500',
    },
    dropdownDivider: {
      height: 1,
      marginHorizontal: 12,
    },

    // Reported Card Styles
    reportedCard: {
      justifyContent: 'center',
      minHeight: 140,
    },
    reportedContent: {
      alignItems: 'center',
      paddingVertical: 20,
      gap: 8,
    },
    reportedTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 4,
    },
    reportedText: {
      fontSize: 14,
      textAlign: 'center',
    },
    undoButton: {
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
    },
    undoButtonText: {
      fontSize: 13,
      fontWeight: '500',
    },

    // Reported Response Card
    reportedResponseCard: {
      justifyContent: 'center',
      minHeight: 100,
      marginLeft: 0,
    },
    reportedResponseContent: {
      alignItems: 'center',
      paddingVertical: 16,
      gap: 6,
    },
    reportedResponseTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 2,
    },
    reportedResponseText: {
      fontSize: 12,
      textAlign: 'center',
    },

    // Gamification: Helpful Marks and Top Contributor styles
    topContributorLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginLeft: 6,
      fontWeight: '500',
    },
    responseActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      gap: 12,
    },
    helpfulButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    helpfulButtonText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '500',
    },
    topHelpfulCard: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.04)',
      borderLeftWidth: 3,
      borderLeftColor: '#22C55E',
      marginLeft: -16,
      paddingLeft: 13,
    },
    mostHelpfulBadge: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    mostHelpfulText: {
      fontSize: 11,
      color: '#22C55E',
      fontWeight: '600',
    },
  });
};
