/**
 * ADVICE LISTING PAGE - Shows all Global Community advice posts
 * Inside (tabs) to show bottom navigation bar
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  TextInput,
  Modal,
  TouchableWithoutFeedback,
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
}

// Reddit-style hot score for advice posts
// Gives new posts a fair chance while rewarding engagement logarithmically
// Formula: score = log10(engagement) + (post_time / 45000)
// - First 10 upvotes matter as much as going from 10→100 or 100→1000
// - Every 12.5 hours, a new post gains +1 point just for being newer
// - A 0-vote post from now ranks equal to a 10-vote post from 12.5 hours ago
function calculateHotScore(post: AdvicePost): number {
  const upvotes = post.likeCount || 0;
  const replies = post.replyCount || post.commentCount || 0;
  const createdAtSeconds = new Date(post.createdAt).getTime() / 1000;

  // Epoch: Jan 1, 2024 - keeps numbers manageable
  const EPOCH = new Date('2024-01-01T00:00:00Z').getTime() / 1000;

  // Combined engagement (replies worth 2x for advice questions - they represent actual help)
  const engagement = Math.max(1, upvotes + (replies * 2));

  // Logarithmic engagement: 1-10 = 10-100 = 100-1000 (equal weight)
  // This prevents high-engagement posts from dominating indefinitely
  const engagementScore = Math.log10(engagement);

  // Time bonus: every 12.5 hours = +1 point for being newer
  // This gives new posts a fair chance to be seen
  const timeScore = (createdAtSeconds - EPOCH) / 45000;

  // Wilson-inspired penalty for low-engagement posts (prevents 1-vote posts from gaming)
  // Posts with <5 total engagement get a confidence penalty
  let score = engagementScore + timeScore;

  const totalEngagement = upvotes + replies;
  if (totalEngagement < 5) {
    const confidence = totalEngagement > 0
      ? Math.min(1, totalEngagement / 5)
      : 0.1;
    score *= (0.5 + (confidence * 0.5));
  }

  return score;
}

export default function AdviceListScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [upvotedPosts, setUpvotedPosts] = useState<Set<number>>(new Set());
  const [unupvotedPosts, setUnupvotedPosts] = useState<Set<number>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());
  const [unbookmarkedPosts, setUnbookmarkedPosts] = useState<Set<number>>(new Set());
  const [reportedPosts, setReportedPosts] = useState<Set<number>>(new Set());

  // Menu state
  const [menuPost, setMenuPost] = useState<AdvicePost | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

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

  // Memoize sorted posts by hot score (Reddit-style ranking)
  const sortedPosts = useMemo(() =>
    [...advicePosts].sort((a, b) => calculateHotScore(b) - calculateHotScore(a)),
    [advicePosts]
  );

  // Memoize filtered posts based on search query
  const filteredPosts = useMemo(() =>
    searchQuery.trim()
      ? sortedPosts.filter(post =>
          post.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : sortedPosts,
    [sortedPosts, searchQuery]
  );

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

  const showMenu = useCallback((post: AdvicePost, event: any) => {
    event.stopPropagation();
    const { pageY, pageX } = event.nativeEvent;
    setMenuPosition({ top: pageY + 5, right: 16 });
    setMenuPost(post);
  }, []);

  const handleShare = useCallback(async () => {
    if (!menuPost) return;
    setMenuPost(null);
    const preview = menuPost.content?.slice(0, 100) || '';
    await shareAdvice(menuPost.id, preview);
  }, [menuPost]);

  const handleReport = useCallback(() => {
    if (!menuPost) return;
    const postId = menuPost.id;
    setMenuPost(null);
    Alert.alert(
      'Report Content',
      'Are you sure you want to report this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: async () => {
          setReportedPosts(prev => new Set(prev).add(postId));
          try {
            await apiClient.post('/api/reports', {
              subjectType: 'microblog',
              subjectId: postId,
              reason: 'inappropriate_content',
            });
          } catch (error) {
          }
        }},
      ]
    );
  }, [menuPost]);

  const handleUndoReport = useCallback((postId: number) => {
    setReportedPosts(prev => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: AdvicePost }) => {
    const isUpvoted = unupvotedPosts.has(item.id) ? false : (upvotedPosts.has(item.id) || item.isLiked);
    const isBookmarked = unbookmarkedPosts.has(item.id) ? false : (bookmarkedPosts.has(item.id) || item.isBookmarked);
    const isReported = reportedPosts.has(item.id);
    const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

    // Show reported placeholder
    if (isReported) {
      return (
        <View style={[styles.adviceCard, styles.reportedCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}>
          <View style={styles.reportedContent}>
            <Ionicons name="flag" size={24} color={colors.textMuted} />
            <Text style={[styles.reportedTitle, { color: colors.textSecondary }]}>
              Content Reported
            </Text>
            <Text style={[styles.reportedText, { color: colors.textMuted }]}>
              This will be reviewed by The Connection Team
            </Text>
            <Pressable
              style={[styles.undoButton, { borderColor: colors.textMuted }]}
              onPress={() => handleUndoReport(item.id)}
            >
              <Text style={[styles.undoButtonText, { color: colors.textMuted }]}>Undo</Text>
            </Pressable>
          </View>
        </View>
      );
    }

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
            <Pressable onPress={() => handleBookmark(item.id, isBookmarked)} hitSlop={8}>
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={18}
                color={isBookmarked ? colors.primary : colors.textMuted}
              />
            </Pressable>
            <Pressable onPress={(e) => showMenu(item, e)} hitSlop={8}>
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.adviceContent, { color: colors.textPrimary }]} numberOfLines={4}>
          {item.content}
        </Text>

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
  }, [colors, router, upvotedPosts, unupvotedPosts, bookmarkedPosts, unbookmarkedPosts, reportedPosts, handleUpvote, handleBookmark, handleUndoReport, showMenu]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Global Community</Text>
        <View style={styles.headerRight} />
      </View>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search topics..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={searchQuery ? "search-outline" : "chatbubbles-outline"}
            size={64}
            color={colors.textMuted}
          />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {searchQuery ? 'No results found' : 'No advice posts yet'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery
              ? `Try searching for something else`
              : 'Be the first to ask for advice from the community!'
            }
          </Text>
          {searchQuery && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={[styles.clearSearchButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.clearSearchButtonText}>Clear Search</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
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
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
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
      <Modal
        visible={!!menuPost}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuPost(null)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuPost(null)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, top: menuPosition.top, right: menuPosition.right }]}>
                <Pressable style={styles.dropdownItem} onPress={handleShare}>
                  <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
                  <Text style={[styles.dropdownItemText, { color: colors.textPrimary }]}>Share</Text>
                </Pressable>
                <View style={[styles.dropdownDivider, { backgroundColor: colors.borderSubtle }]} />
                <Pressable style={styles.dropdownItem} onPress={handleReport}>
                  <Ionicons name="flag-outline" size={18} color="#EF4444" />
                  <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>Report</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
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
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  adviceHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
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
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearSearchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Dropdown Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    minWidth: 150,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 1,
    marginHorizontal: 12,
  },

  // Reported Card
  reportedCard: {
    minHeight: 120,
    justifyContent: 'center',
  },
  reportedContent: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  reportedTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  reportedText: {
    fontSize: 13,
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
});
