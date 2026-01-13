import React, { useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { useRouter } from 'expo-router';

interface SearchScreenProps {
  onClose?: () => void;
}

type SearchFilter = 'all' | 'accounts' | 'communities' | 'events' | 'forms';

interface SearchResult {
  type: 'user' | 'community' | 'post' | 'event';
  id: number;
  title?: string;
  name?: string;
  username?: string;
  displayName?: string;
  description?: string;
  content?: string;
  avatarUrl?: string;
  iconName?: string;
  memberCount?: number;
  isPrivate?: boolean;
  location?: string;
  startTime?: string;
}

export default function SearchScreen({ onClose }: SearchScreenProps) {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');

  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ['/api/search', searchQuery, activeFilter],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const response = await apiClient.get('/api/search', {
        params: {
          q: searchQuery,
          filter: activeFilter,
        },
      });
      return response.data;
    },
    enabled: searchQuery.length >= 2,
  });

  const filters: { id: SearchFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'events', label: 'Events' },
    { id: 'forms', label: 'Forms' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'communities', label: 'Communities' },
  ];

  const handleResultPress = (result: SearchResult) => {
    switch (result.type) {
      case 'user':
        router.push(`/profile/${result.id}`);
        break;
      case 'community':
        router.push(`/communities/${result.id}`);
        break;
      case 'post':
        router.push(`/posts/${result.id}`);
        break;
      case 'question':
        router.push(`/apologetics/${result.id}`);
        break;
    }
  };

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'user':
        return 'person-circle-outline';
      case 'community':
        return 'people-outline';
      case 'post':
        return 'document-text-outline';
      case 'question':
        return 'help-circle-outline';
      default:
        return 'search-outline';
    }
  };

  const getResultSubtitle = (result: SearchResult) => {
    switch (result.type) {
      case 'user':
        return `@${result.username}`;
      case 'community':
        return `${result.memberCount || 0} members${result.isPrivate ? ' • Private' : ''}`;
      case 'post':
      case 'question':
        return result.content?.substring(0, 100);
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.muted,
              borderRadius: spacing.md,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.mutedForeground} style={{ marginLeft: spacing.md }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search communities, posts, people, and more..."
            placeholderTextColor={colors.mutedForeground}
            autoFocus
            style={[
              styles.searchInput,
              {
                color: colors.foreground,
                paddingHorizontal: spacing.md,
              },
            ]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={{ padding: spacing.sm }}>
              <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <Pressable onPress={onClose} style={{ padding: spacing.sm }}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Filters */}
      <View
        style={[
          styles.filtersContainer,
          {
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {filters.map((filter) => (
              <Pressable
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={({ pressed }) => [
                  styles.filterButton,
                  {
                    backgroundColor:
                      activeFilter === filter.id ? colors.primary : colors.muted,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: spacing.full,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  variant="bodySmall"
                  style={{
                    fontWeight: '600',
                    color: activeFilter === filter.id ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView style={{ flex: 1 }}>
        {searchQuery.length === 0 ? (
          // Empty state
          <View style={styles.emptyState}>
            <Ionicons name="arrow-up-outline" size={64} color={colors.mutedForeground} />
            <Text
              variant="body"
              style={{
                fontWeight: '600',
                marginTop: spacing.md,
                color: colors.mutedForeground,
              }}
            >
              Start typing to search communities, posts, and people
            </Text>

            {/* Quick Access */}
            <View style={{ marginTop: spacing.xl * 2, width: '100%' }}>
              <Text variant="title" style={{ marginBottom: spacing.md, paddingHorizontal: spacing.lg }}>
                Quick Access
              </Text>

              <Pressable
                onPress={() => router.push('/communities')}
                style={({ pressed }) => [
                  styles.quickAccessItem,
                  {
                    backgroundColor: pressed ? colors.muted : colors.card,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.md,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${colors.primary}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="people-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    Communities
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    Find groups
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </Pressable>

              <Pressable
                onPress={() => router.push('/feed')}
                style={({ pressed }) => [
                  styles.quickAccessItem,
                  {
                    backgroundColor: pressed ? colors.muted : colors.card,
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.md,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${colors.primary}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="refresh-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    Feed
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    Latest posts
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </Pressable>

              <Pressable
                onPress={() => router.push('/events')}
                style={({ pressed }) => [
                  styles.quickAccessItem,
                  {
                    backgroundColor: pressed ? colors.muted : colors.card,
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.md,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${colors.primary}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    Events
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    Upcoming events
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
        ) : isLoading ? (
          <View style={[styles.emptyState, { paddingVertical: spacing.xl * 2 }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="bodySmall" color="mutedForeground" style={{ marginTop: spacing.md }}>
              Searching...
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={colors.mutedForeground} />
            <Text
              variant="body"
              style={{
                fontWeight: '600',
                marginTop: spacing.md,
                color: colors.mutedForeground,
              }}
            >
              No results found
            </Text>
            <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
              Try different keywords
            </Text>
          </View>
        ) : (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            {results.map((result, index) => (
              <Pressable
                key={`${result.type}-${result.id}`}
                onPress={() => handleResultPress(result)}
                style={({ pressed }) => [
                  styles.resultItem,
                  {
                    backgroundColor: pressed ? colors.muted : colors.card,
                    borderBottomWidth: index < results.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    padding: spacing.md,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              >
                {/* Icon/Avatar */}
                {result.avatarUrl ? (
                  <Image
                    source={{ uri: result.avatarUrl }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.muted,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: `${colors.primary}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={getResultIcon(result) as any}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                )}

                {/* Content */}
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    {result.title || result.name || result.displayName || result.username}
                  </Text>
                  <Text
                    variant="caption"
                    color="mutedForeground"
                    numberOfLines={2}
                    style={{ marginTop: 2 }}
                  >
                    {getResultSubtitle(result)}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 40,
  },
  filtersContainer: {
    // Styles inline
  },
  filterButton: {
    // Styles inline
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
