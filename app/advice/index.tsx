/**
 * ADVICE LISTING PAGE - Shows all Global Community advice posts
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  StatusBar,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import apiClient from '../../src/lib/apiClient';
import { formatDistanceToNow } from 'date-fns';
import { shareAdvice } from '../../src/lib/shareUrls';

interface AdvicePost {
  id: number;
  content: string;
  author?: {
    id: number;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
  };
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  replyCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  anonymousNickname?: string;
  imageUrls?: string[];
  sourceUrl?: string;
}

export default function AdviceListScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [upvotedPosts, setUpvotedPosts] = useState<Set<number>>(new Set());
  const [unupvotedPosts, setUnupvotedPosts] = useState<Set<number>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());
  const [unbookmarkedPosts, setUnbookmarkedPosts] = useState<Set<number>>(new Set());
  const [menuPost, setMenuPost] = useState<AdvicePost | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['advice-list', user?.id],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/microblogs?topic=QUESTION&limit=20&cursor=${pageParam}`
        : '/api/microblogs?topic=QUESTION&limit=20';
      const response = await apiClient.get(url);
      const respData = response.data;
      const items = respData.microblogs || respData.items || (Array.isArray(respData) ? respData : []);
      const nextCursor = respData.nextCursor || null;
      return { items, nextCursor };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user,
  });

  const advicePosts = data?.pages.flatMap(page => page.items) || [];

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async ({ postId, isCurrentlyLiked }: { postId: number; isCurrentlyLiked: boolean }) => {
      if (isCurrentlyLiked) {
        return apiClient.delete(`/api/microblogs/${postId}/like`);
      } else {
        return apiClient.post(`/api/microblogs/${postId}/like`);
      }
    },
    onMutate: async ({ postId, isCurrentlyLiked }) => {
      if (isCurrentlyLiked) {
        setUpvotedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
        setUnupvotedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
      } else {
        setUpvotedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
        setUnupvotedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['advice-list'] });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ postId, isCurrentlyBookmarked }: { postId: number; isCurrentlyBookmarked: boolean }) => {
      if (isCurrentlyBookmarked) {
        return apiClient.delete(`/api/microblogs/${postId}/bookmark`);
      } else {
        return apiClient.post(`/api/microblogs/${postId}/bookmark`);
      }
    },
    onMutate: async ({ postId, isCurrentlyBookmarked }) => {
      if (isCurrentlyBookmarked) {
        setBookmarkedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
        setUnbookmarkedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
      } else {
        setBookmarkedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
        setUnbookmarkedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['advice-list'] });
    },
  });

  const handleUpvote = useCallback((postId: number, isCurrentlyLiked: boolean) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to upvote posts.');
      return;
    }
    upvoteMutation.mutate({ postId, isCurrentlyLiked });
  }, [user, upvoteMutation]);

  const handleBookmark = useCallback((postId: number, isCurrentlyBookmarked: boolean) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to bookmark posts.');
      return;
    }
    bookmarkMutation.mutate({ postId, isCurrentlyBookmarked });
  }, [user, bookmarkMutation]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle sharing an advice post
  const handleShare = useCallback(async (post: AdvicePost) => {
    setMenuPost(null);
    const result = await shareAdvice(post.id, post.content);
    if (!result.success && result.error !== 'Share dismissed') {
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  }, []);

  // Handle reporting an advice post
  const handleReport = useCallback((post: AdvicePost) => {
    setMenuPost(null);
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post? Our team will review it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post(`/api/microblogs/${post.id}/report`, {
                reason: 'inappropriate_content',
              });
              Alert.alert('Reported', 'Thank you for your report. Our team will review it.');
            } catch {
              Alert.alert('Error', 'Failed to report. Please try again.');
            }
          },
        },
      ]
    );
  }, []);

  // Show dropdown menu for a post
  const showMenu = useCallback((post: AdvicePost, pageY: number) => {
    setMenuPosition({ x: 0, y: pageY + 25 });
    setMenuPost(post);
  }, []);

  const renderItem = ({ item }: { item: AdvicePost }) => {
    const isUpvoted = unupvotedPosts.has(item.id) ? false : (upvotedPosts.has(item.id) || item.isLiked);
    const isBookmarked = unbookmarkedPosts.has(item.id) ? false : (bookmarkedPosts.has(item.id) || item.isBookmarked);
    const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

    return (
      <Pressable
        style={[styles.adviceCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
        onPress={() => router.push({ pathname: '/advice/[id]' as any, params: { id: item.id.toString() } })}
      >
        <View style={styles.adviceHeader}>
          <View style={styles.adviceHeaderLeft}>
            {item.anonymousNickname ? (
              <Text style={[styles.adviceNickname, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.anonymousNickname}
              </Text>
            ) : (
              <Text style={[styles.adviceNickname, { color: colors.textSecondary }]}>
                Anonymous
              </Text>
            )}
            <Text style={[styles.adviceTime, { color: colors.textMuted }]}>
              · {timeAgo.replace('about ', '')}
            </Text>
          </View>
          <View style={styles.adviceHeaderRight}>
            <Pressable onPress={(e) => { e.stopPropagation(); handleBookmark(item.id, isBookmarked); }} hitSlop={8}>
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={18}
                color={isBookmarked ? colors.primary : colors.textMuted}
              />
            </Pressable>
            <Pressable onPress={(e) => { e.stopPropagation(); showMenu(item, e.nativeEvent.pageY); }} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.adviceContent, { color: colors.textPrimary }]} numberOfLines={4}>
          {item.content}
        </Text>

        {/* Image Thumbnails */}
        {item.imageUrls && item.imageUrls.length > 0 && (
          <View style={styles.imageThumbnails}>
            {item.imageUrls.slice(0, 3).map((url, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: url }} style={styles.thumbnail} resizeMode="cover" />
                {index === 2 && item.imageUrls && item.imageUrls.length > 3 && (
                  <View style={styles.moreImagesOverlay}>
                    <Text style={styles.moreImagesText}>+{item.imageUrls.length - 3}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Link Indicator */}
        {item.sourceUrl && (
          <View style={[styles.linkIndicator, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="link" size={14} color={colors.primary} />
            <Text style={[styles.linkIndicatorText, { color: colors.primary }]} numberOfLines={1}>
              {item.sourceUrl.replace(/^https?:\/\//, '').split('/')[0]}
            </Text>
          </View>
        )}

        <View style={styles.adviceFooter}>
          <View style={styles.adviceStats}>
            <Pressable
              style={styles.adviceStat}
              onPress={() => handleUpvote(item.id, isUpvoted)}
              hitSlop={8}
            >
              <Ionicons
                name={isUpvoted ? "arrow-up" : "arrow-up-outline"}
                size={18}
                color={isUpvoted ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.adviceStatText, { color: isUpvoted ? colors.primary : colors.textMuted }]}>
                {item.likeCount || 0}
              </Text>
            </Pressable>
            <View style={styles.adviceStat}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.adviceStatText, { color: colors.textMuted }]}>
                {item.commentCount || item.replyCount || 0}
              </Text>
            </View>
            <View style={[styles.adviceBadge, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="help-circle" size={12} color="#EC4899" />
              <Text style={[styles.adviceBadgeText, { color: '#EC4899' }]}>Seeking Advice</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        {/* Custom Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderSubtle }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Global Community</Text>
          <View style={styles.headerRight} />
        </View>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : advicePosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No advice posts yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Be the first to ask for advice from the community!
            </Text>
          </View>
        ) : (
          <FlatList
            data={advicePosts}
            keyExtractor={(item) => `advice-${item.id}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}

        {/* Dropdown Menu */}
        {menuPost && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuPost(null)}
          >
            <TouchableWithoutFeedback onPress={() => setMenuPost(null)}>
              <View style={styles.dropdownOverlay}>
                <View
                  style={[
                    styles.dropdownMenu,
                    {
                      backgroundColor: colors.surface,
                      top: menuPosition.y,
                      right: 16,
                      shadowColor: '#000',
                    }
                  ]}
                >
                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => handleShare(menuPost)}
                  >
                    <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
                    <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                      Share
                    </Text>
                  </Pressable>
                  <View style={[styles.dropdownDivider, { backgroundColor: colors.borderSubtle }]} />
                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => handleReport(menuPost)}
                  >
                    <Ionicons name="flag-outline" size={18} color="#EF4444" />
                    <Text style={[styles.dropdownText, { color: '#EF4444' }]}>
                      Report
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Advice Card
  adviceCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  adviceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0, // Allow shrinking
  },
  adviceHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0, // Don't shrink
  },
  adviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adviceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  adviceNickname: {
    fontSize: 12,
    fontStyle: 'italic',
    flexShrink: 1,
    minWidth: 0,
  },
  adviceTime: {
    fontSize: 12,
  },
  adviceContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  imageThumbnails: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  thumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  linkIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 200,
  },
  adviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  adviceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  adviceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adviceStatText: {
    fontSize: 13,
  },
  adviceCta: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Dropdown Menu styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    minWidth: 140,
    borderRadius: 12,
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
});
