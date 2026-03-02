import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/apiClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

interface Microblog {
  id: number;
  content: string;
  author?: {
    id: number;
    username: string;
    displayName: string;
    profileImageUrl?: string;
  };
  createdAt: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  communityId?: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
}

interface ApologeticsQA {
  id: string;
  question: string;
  areaName: string;
  tagName?: string;
  answer: string;
  sources?: string[];
}

export default function BookmarksScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'advice' | 'apologetics'>('advice');

  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0F1419',
    textSecondary: isDark ? '#8B98A5' : '#536471',
    border: isDark ? '#2F3336' : '#EFF3F4',
    primary: '#1D9BF0',
    tabActive: isDark ? '#FFFFFF' : '#0F1419',
    tabInactive: isDark ? '#71767B' : '#536471',
    cardBackground: isDark ? '#16181C' : '#FFFFFF',
  };

  const styles = getStyles(colors, isDark);

  // Fetch bookmarked advice posts (microblogs with topic=QUESTION)
  const {
    data: bookmarkedAdvice = [],
    isLoading: isLoadingAdvice,
    refetch: refetchAdvice,
  } = useQuery<Microblog[]>({
    queryKey: ['/api/microblogs/bookmarks/advice'],
    queryFn: async () => {
      const response = await apiClient.get('/api/microblogs/bookmarks');
      // Filter to only show advice posts (topic=QUESTION)
      const allBookmarks = response.data || [];
      return allBookmarks.filter((m: any) => m.topic === 'QUESTION');
    },
    enabled: !!user && activeTab === 'advice',
  });

  // Fetch bookmarked apologetics Q&A
  const {
    data: bookmarkedApologetics = [],
    isLoading: isLoadingApologetics,
    refetch: refetchApologetics,
  } = useQuery<ApologeticsQA[]>({
    queryKey: ['/api/apologetics/bookmarks/full'],
    queryFn: async () => {
      // First get the bookmarked IDs
      const bookmarksResponse = await apiClient.get<string[]>('/api/apologetics/bookmarks');
      const bookmarkedIds = bookmarksResponse.data;

      if (bookmarkedIds.length === 0) return [];

      // Then fetch each Q&A detail
      const qaPromises = bookmarkedIds.map(id =>
        apiClient.get(`/api/apologetics/questions/${id}`)
      );
      const qaResponses = await Promise.all(qaPromises);
      return qaResponses.map(r => r.data);
    },
    enabled: !!user && activeTab === 'apologetics',
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'advice') {
      await refetchAdvice();
    } else {
      await refetchApologetics();
    }
    setRefreshing(false);
  };

  const handleUnbookmarkAdvice = async (adviceId: number) => {
    try {
      await apiClient.delete(`/api/microblogs/${adviceId}/bookmark`);
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs/bookmarks/advice'] });
      queryClient.invalidateQueries({ queryKey: ['advice-posts'] });
    } catch (error) {
    }
  };

  const handleUnbookmarkApologetics = async (questionId: string) => {
    try {
      await apiClient.delete(`/api/apologetics/bookmarks/${questionId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/apologetics/bookmarks/full'] });
      queryClient.invalidateQueries({ queryKey: ['apologetics-bookmarks'] });
    } catch (error) {
    }
  };

  const renderAdviceItem = (advice: Microblog & { anonymousNickname?: string }) => (
    <Pressable
      key={advice.id}
      style={styles.postCard}
      onPress={() => router.push({ pathname: '/advice/[id]' as any, params: { id: advice.id.toString() } })}
    >
      <View style={styles.postHeader}>
        <View style={styles.adviceBadge}>
          <Ionicons name="help-circle" size={14} color="#EC4899" />
          <Text style={styles.adviceBadgeText}>Seeking Advice</Text>
          {(advice as any).anonymousNickname && (
            <Text style={styles.adviceNickname}>from {(advice as any).anonymousNickname}</Text>
          )}
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleUnbookmarkAdvice(advice.id);
          }}
          style={styles.unbookmarkButton}
        >
          <Ionicons name="bookmark" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={styles.postContent} numberOfLines={4}>{advice.content}</Text>

      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="arrow-up-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{advice.likeCount || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{advice.replyCount || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.timestamp}>
            {new Date(advice.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const renderApologeticsItem = (qa: ApologeticsQA) => (
    <Pressable
      key={qa.id}
      style={styles.postCard}
      onPress={() => router.push(`/apologetics/${qa.id}` as any)}
    >
      <View style={styles.postHeader}>
        <View style={styles.apologeticsBadge}>
          <Ionicons name="book" size={14} color={colors.primary} />
          <Text style={styles.forumBadgeText}>Apologetics</Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleUnbookmarkApologetics(qa.id);
          }}
          style={styles.unbookmarkButton}
        >
          <Ionicons name="bookmark" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={styles.postTitle}>{qa.question}</Text>

      {qa.areaName && (
        <View style={styles.qaMetadata}>
          <Text style={styles.qaAreaText}>{qa.areaName}</Text>
          {qa.tagName && (
            <>
              <Text style={styles.qaMetadataDivider}>•</Text>
              <Text style={styles.qaTagText}>{qa.tagName}</Text>
            </>
          )}
        </View>
      )}

      <Text style={styles.postContent} numberOfLines={3}>
        {qa.answer}
      </Text>

      {qa.sources && qa.sources.length > 0 && (
        <View style={styles.sourcesIndicator}>
          <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.sourcesText}>
            {qa.sources.length} {qa.sources.length === 1 ? 'source' : 'sources'}
          </Text>
        </View>
      )}
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No bookmarks yet</Text>
      <Text style={styles.emptyStateText}>
        {activeTab === 'advice'
          ? 'Bookmark advice posts to save them for later'
          : 'Bookmark Q&A entries from Apologetics to save them for later'}
      </Text>
      <Pressable
        style={{
          marginTop: 16,
          backgroundColor: colors.primary,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        onPress={() => router.push('/(tabs)/advice')}
      >
        <Ionicons name="compass-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Browse Advice</Text>
      </Pressable>
    </View>
  );

  const isLoading = activeTab === 'advice' ? isLoadingAdvice : isLoadingApologetics;

  const data = activeTab === 'advice' ? bookmarkedAdvice : bookmarkedApologetics;

  const isEmpty = !isLoading && data.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <Text style={styles.headerSubtitle}>
            {data.length} {data.length === 1 ? 'item' : 'items'} saved
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'advice' && styles.tabActive]}
          onPress={() => setActiveTab('advice')}
        >
          <Ionicons
            name="help-circle"
            size={20}
            color={activeTab === 'advice' ? colors.tabActive : colors.tabInactive}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'advice' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Advice
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'apologetics' && styles.tabActive]}
          onPress={() => setActiveTab('apologetics')}
        >
          <Ionicons
            name="book"
            size={20}
            color={activeTab === 'apologetics' ? colors.tabActive : colors.tabInactive}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'apologetics' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Q&A
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isEmpty ? (
          renderEmptyState()
        ) : activeTab === 'advice' ? (
          bookmarkedAdvice.map(renderAdviceItem)
        ) : (
          bookmarkedApologetics.map(renderApologeticsItem)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    headerTextContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '600',
    },
    tabTextActive: {
      color: colors.tabActive,
    },
    tabTextInactive: {
      color: colors.tabInactive,
    },
    content: {
      flex: 1,
    },
    postCard: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      backgroundColor: colors.surfaceBackground,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#2F3336' : '#EFF3F4',
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorText: {
      gap: 2,
    },
    authorName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    timestamp: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    unbookmarkButton: {
      padding: 8,
    },
    adviceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)',
      borderRadius: 12,
    },
    adviceBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#EC4899',
    },
    adviceNickname: {
      fontSize: 11,
      fontStyle: 'italic',
      color: colors.textSecondary,
      marginLeft: 4,
    },
    postTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    postContent: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    postStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    loadingContainer: {
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      padding: 48,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptyStateText: {
      fontSize: 15,
      textAlign: 'center',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    apologeticsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF',
      borderRadius: 12,
    },
    qaMetadata: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    qaAreaText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    qaMetadataDivider: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    qaTagText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '400',
    },
    sourcesIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
    },
    sourcesText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
}
