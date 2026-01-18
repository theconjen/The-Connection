/**
 * Library Posts List Screen
 * Browse published apologetics and polemics library entries
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../src/lib/apiClient';
import { queryKeys } from '../../../../../packages/shared/src/api/queryKeys';
import type { LibraryPost, Domain } from '../../../../../packages/shared/src/api/types';

export default function LibraryListScreen() {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState<Domain | undefined>(undefined);

  // Fetch current user capabilities
  const { data: meData } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => apiClient.getMe(),
  });

  const canAuthor = meData?.capabilities.canAuthorApologeticsPosts || false;

  // Fetch library posts
  const { data, isLoading, refetch, isRefetching } = useQuery<{
    posts: LibraryPost[];
    pagination: { limit: number; offset: number };
  }>({
    queryKey: queryKeys.libraryPosts.list({ domain: selectedDomain, status: 'published' }),
    queryFn: async () => {
      return await apiClient.listLibraryPosts({ domain: selectedDomain, status: 'published' });
    },
  });

  const posts = data?.posts || [];

  const renderPost = ({ item }: { item: LibraryPost }) => (
    <Pressable
      style={styles.postCard}
      onPress={() => router.push(`/library/${item.id}` as any)}
    >
      <View style={styles.postHeader}>
        <View style={styles.domainBadge}>
          <Ionicons
            name={item.domain === 'apologetics' ? 'shield-checkmark' : 'flame'}
            size={14}
            color="#fff"
          />
          <Text style={styles.domainText}>{item.domain}</Text>
        </View>
        {item.area && (
          <Text style={styles.areaText}>{item.area.name}</Text>
        )}
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>

      {item.summary && (
        <Text style={styles.postSummary} numberOfLines={3}>
          {item.summary}
        </Text>
      )}

      <View style={styles.postFooter}>
        <Text style={styles.authorText}>{item.authorDisplayName}</Text>
        {item.publishedAt && (
          <Text style={styles.dateText}>
            {new Date(item.publishedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Library</Text>
          {canAuthor && (
            <Pressable
              style={styles.createButton}
              onPress={() => router.push('/library/create' as any)}
            >
              <Ionicons name="add-circle" size={28} color="#3B82F6" />
            </Pressable>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          Curated articles on Christian apologetics and polemics
        </Text>
      </View>

      {/* Domain Filter */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterButton, !selectedDomain && styles.filterButtonActive]}
          onPress={() => setSelectedDomain(undefined)}
        >
          <Text style={[styles.filterButtonText, !selectedDomain && styles.filterButtonTextActive]}>
            All
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, selectedDomain === 'apologetics' && styles.filterButtonActive]}
          onPress={() => setSelectedDomain('apologetics')}
        >
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={selectedDomain === 'apologetics' ? '#fff' : '#6B7280'}
          />
          <Text style={[styles.filterButtonText, selectedDomain === 'apologetics' && styles.filterButtonTextActive]}>
            Apologetics
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, selectedDomain === 'polemics' && styles.filterButtonActive]}
          onPress={() => setSelectedDomain('polemics')}
        >
          <Ionicons
            name="flame"
            size={16}
            color={selectedDomain === 'polemics' ? '#fff' : '#6B7280'}
          />
          <Text style={[styles.filterButtonText, selectedDomain === 'polemics' && styles.filterButtonTextActive]}>
            Polemics
          </Text>
        </Pressable>
      </View>

      {/* Posts List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading library posts...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No posts found</Text>
          <Text style={styles.emptySubtext}>
            {selectedDomain
              ? `No ${selectedDomain} posts available yet`
              : 'The library is empty'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingVertical: 12,
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  domainText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  areaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  postSummary: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  authorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
