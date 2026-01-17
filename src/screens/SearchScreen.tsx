import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text,  } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchScreenProps {
  onClose?: () => void;
  defaultFilter?: SearchFilter;
}

type SearchFilter = 'all' | 'accounts' | 'communities' | 'events' | 'forms';

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filter: SearchFilter;
  createdAt: string;
}

interface AdvancedFilters {
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all';
  sortBy?: 'relevance' | 'recent' | 'popular';
  location?: string;
  verified?: boolean;
}

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

const SEARCH_HISTORY_KEY = '@search_history';
const SAVED_SEARCHES_KEY = '@saved_searches';
const MAX_HISTORY = 10;

export default function SearchScreen({ onClose, defaultFilter = 'all' }: SearchScreenProps) {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>(defaultFilter);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    dateRange: 'all',
    sortBy: 'relevance',
  });

  // Load search history and saved searches on mount
  useEffect(() => {
    loadSearchHistory();
    loadSavedSearches();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const addToSearchHistory = async (query: string) => {
    if (!query.trim()) return;
    try {
      const updatedHistory = [
        query,
        ...searchHistory.filter(q => q !== query),
      ].slice(0, MAX_HISTORY);
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearSearchHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const saveCurrentSearch = async () => {
    if (!saveSearchName.trim() || !searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a name for this search');
      return;
    }

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: saveSearchName,
      query: searchQuery,
      filter: activeFilter,
      createdAt: new Date().toISOString(),
    };

    try {
      const updated = [newSavedSearch, ...savedSearches];
      setSavedSearches(updated);
      await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
      setShowSaveModal(false);
      setSaveSearchName('');
      Alert.alert('Success', 'Search saved successfully!');
    } catch (error) {
      console.error('Error saving search:', error);
      Alert.alert('Error', 'Failed to save search');
    }
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      const updated = savedSearches.filter(s => s.id !== id);
      setSavedSearches(updated);
      await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setSearchQuery(search.query);
    setActiveFilter(search.filter);
  };

  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ['/api/search', searchQuery, activeFilter, advancedFilters],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      // Add to search history when performing a search
      addToSearchHistory(searchQuery);

      const response = await apiClient.get('/api/search', {
        params: {
          q: searchQuery,
          filter: activeFilter,
          dateRange: advancedFilters.dateRange,
          sortBy: advancedFilters.sortBy,
          location: advancedFilters.location,
          verified: advancedFilters.verified,
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
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surfaceMuted,
              borderRadius: spacing.md,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search communities, posts, people, and more..."
            placeholderTextColor={colors.textMuted}
            autoFocus
            style={[
              styles.searchInput,
              {
                color: colors.textPrimary,
                paddingHorizontal: spacing.md,
              },
            ]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={{ padding: spacing.sm }}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <Pressable onPress={onClose} style={{ padding: spacing.sm }}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Filters */}
      <View
        style={[
          styles.filtersContainer,
          {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            {filters.map((filter) => (
              <Pressable
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={({ pressed }) => [
                  styles.filterButton,
                  {
                    backgroundColor:
                      activeFilter === filter.id ? colors.primary : colors.surfaceMuted,
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
                    color: activeFilter === filter.id ? colors.primaryForeground : colors.textPrimary,
                  }}
                >
                  {filter.label}
                </Text>
              </Pressable>
            ))}

            {/* Advanced Filters Button */}
            <Pressable
              onPress={() => setShowAdvancedFilters(true)}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  backgroundColor: colors.surfaceMuted,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: spacing.full,
                  opacity: pressed ? 0.7 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                },
              ]}
            >
              <Ionicons name="options-outline" size={16} color={colors.textPrimary} />
              <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                Filters
              </Text>
            </Pressable>

            {/* Save Search Button */}
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setShowSaveModal(true)}
                style={({ pressed }) => [
                  styles.filterButton,
                  {
                    backgroundColor: colors.surfaceMuted,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: spacing.full,
                    opacity: pressed ? 0.7 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                  },
                ]}
              >
                <Ionicons name="bookmark-outline" size={16} color={colors.textPrimary} />
                <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                  Save
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView style={{ flex: 1 }}>
        {searchQuery.length === 0 ? (
          // Empty state
          <View style={styles.emptyState}>
            <Ionicons name="arrow-up-outline" size={64} color={colors.textMuted} />
            <Text
              variant="body"
              style={{
                fontWeight: '600',
                marginTop: spacing.md,
                color: colors.textMuted,
              }}
            >
              Start typing to search communities, posts, and people
            </Text>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <View style={{ marginTop: spacing.xl * 2, width: '100%' }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: spacing.lg,
                    marginBottom: spacing.md,
                  }}
                >
                  <Text variant="title">Recent Searches</Text>
                  <Pressable onPress={clearSearchHistory}>
                    <Text variant="caption" style={{ color: colors.primary }}>
                      Clear All
                    </Text>
                  </Pressable>
                </View>

                {searchHistory.map((query, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setSearchQuery(query)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                        borderTopWidth: index === 0 ? 1 : 0,
                        borderBottomWidth: 1,
                        borderColor: colors.borderSubtle,
                        padding: spacing.md,
                        paddingHorizontal: spacing.lg,
                        flexDirection: 'row',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                    <Text
                      variant="body"
                      style={{ flex: 1, marginLeft: spacing.md }}
                      numberOfLines={1}
                    >
                      {query}
                    </Text>
                    <Ionicons name="arrow-up-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <View style={{ marginTop: spacing.xl, width: '100%' }}>
                <Text variant="title" style={{ marginBottom: spacing.md, paddingHorizontal: spacing.lg }}>
                  Saved Searches
                </Text>

                {savedSearches.map((search, index) => (
                  <Pressable
                    key={search.id}
                    onPress={() => loadSavedSearch(search)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                        borderTopWidth: index === 0 ? 1 : 0,
                        borderBottomWidth: 1,
                        borderColor: colors.borderSubtle,
                        padding: spacing.md,
                        paddingHorizontal: spacing.lg,
                        flexDirection: 'row',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <Ionicons name="bookmark" size={20} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text variant="body" style={{ fontWeight: '600' }}>
                        {search.name}
                      </Text>
                      <Text variant="caption" color="textMuted" numberOfLines={1}>
                        {search.query} • {search.filter}
                      </Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          'Delete Search',
                          `Delete "${search.name}"?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => deleteSavedSearch(search.id),
                            },
                          ]
                        );
                      }}
                      style={{ padding: spacing.sm }}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}

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
                    backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: colors.borderSubtle,
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
                  <Text variant="caption" color="textMuted">
                    Find groups
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>

              <Pressable
                onPress={() => router.push('/feed')}
                style={({ pressed }) => [
                  styles.quickAccessItem,
                  {
                    backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                    borderBottomWidth: 1,
                    borderColor: colors.borderSubtle,
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
                  <Text variant="caption" color="textMuted">
                    Latest posts
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>

              <Pressable
                onPress={() => router.push('/events')}
                style={({ pressed }) => [
                  styles.quickAccessItem,
                  {
                    backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                    borderBottomWidth: 1,
                    borderColor: colors.borderSubtle,
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
                  <Text variant="caption" color="textMuted">
                    Upcoming events
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>
        ) : isLoading ? (
          <View style={[styles.emptyState, { paddingVertical: spacing.xl * 2 }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="bodySmall" color="textMuted" style={{ marginTop: spacing.md }}>
              Searching...
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={colors.textMuted} />
            <Text
              variant="body"
              style={{
                fontWeight: '600',
                marginTop: spacing.md,
                color: colors.textMuted,
              }}
            >
              No results found
            </Text>
            <Text variant="caption" color="textMuted" style={{ marginTop: spacing.sm }}>
              Try different keywords
            </Text>
          </View>
        ) : (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
            {results.map((result, index) => (
              <Pressable
                key={`${result.type}-${result.id}`}
                onPress={() => handleResultPress(result)}
                style={({ pressed }) => [
                  styles.resultItem,
                  {
                    backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                    borderBottomWidth: index < results.length - 1 ? 1 : 0,
                    borderBottomColor: colors.borderSubtle,
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
                      backgroundColor: colors.surfaceMuted,
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
                    color="textMuted"
                    numberOfLines={2}
                    style={{ marginTop: 2 }}
                  >
                    {getResultSubtitle(result)}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Save Search Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSaveModal(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderRadius: spacing.lg,
                padding: spacing.xl,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text variant="title" style={{ marginBottom: spacing.lg }}>
              Save Search
            </Text>

            <TextInput
              value={saveSearchName}
              onChangeText={setSaveSearchName}
              placeholder="Enter search name..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceMuted,
                  color: colors.textPrimary,
                  borderRadius: spacing.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  marginBottom: spacing.lg,
                },
              ]}
            />

            <View
              style={{
                backgroundColor: colors.surfaceMuted,
                borderRadius: spacing.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
              }}
            >
              <Text variant="bodySmall" color="textMuted">
                Search Query
              </Text>
              <Text variant="body" style={{ marginTop: spacing.xs }}>
                {searchQuery}
              </Text>
              <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
                Filter: {activeFilter}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Pressable
                onPress={() => {
                  setShowSaveModal(false);
                  setSaveSearchName('');
                }}
                style={[
                  styles.modalButton,
                  {
                    flex: 1,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: spacing.md,
                    paddingVertical: spacing.md,
                    alignItems: 'center',
                  },
                ]}
              >
                <Text variant="body" style={{ fontWeight: '600' }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={saveCurrentSearch}
                style={[
                  styles.modalButton,
                  {
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: spacing.md,
                    paddingVertical: spacing.md,
                    alignItems: 'center',
                  },
                ]}
              >
                <Text
                  variant="body"
                  style={{ fontWeight: '600', color: colors.primaryForeground }}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Advanced Filters Modal */}
      <Modal
        visible={showAdvancedFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdvancedFilters(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAdvancedFilters(false)}
        >
          <Pressable
            style={[
              styles.advancedFiltersModal,
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: spacing.xl,
                borderTopRightRadius: spacing.xl,
                padding: spacing.xl,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.xl,
              }}
            >
              <Text variant="title">Advanced Filters</Text>
              <Pressable
                onPress={() => setShowAdvancedFilters(false)}
                style={{ padding: spacing.sm }}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date Range */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text variant="body" style={{ fontWeight: '600', marginBottom: spacing.md }}>
                  Date Range
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {(['today', 'week', 'month', 'year', 'all'] as const).map((range) => (
                    <Pressable
                      key={range}
                      onPress={() =>
                        setAdvancedFilters((prev) => ({ ...prev, dateRange: range }))
                      }
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor:
                            advancedFilters.dateRange === range ? colors.primary : colors.surfaceMuted,
                          paddingHorizontal: spacing.lg,
                          paddingVertical: spacing.sm,
                          borderRadius: spacing.full,
                        },
                      ]}
                    >
                      <Text
                        variant="bodySmall"
                        style={{
                          fontWeight: '600',
                          color:
                            advancedFilters.dateRange === range
                              ? colors.primaryForeground
                              : colors.textPrimary,
                        }}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Sort By */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text variant="body" style={{ fontWeight: '600', marginBottom: spacing.md }}>
                  Sort By
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {(['relevance', 'recent', 'popular'] as const).map((sort) => (
                    <Pressable
                      key={sort}
                      onPress={() => setAdvancedFilters((prev) => ({ ...prev, sortBy: sort }))}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor:
                            advancedFilters.sortBy === sort ? colors.primary : colors.surfaceMuted,
                          paddingHorizontal: spacing.lg,
                          paddingVertical: spacing.sm,
                          borderRadius: spacing.full,
                        },
                      ]}
                    >
                      <Text
                        variant="bodySmall"
                        style={{
                          fontWeight: '600',
                          color:
                            advancedFilters.sortBy === sort
                              ? colors.primaryForeground
                              : colors.textPrimary,
                        }}
                      >
                        {sort.charAt(0).toUpperCase() + sort.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Location */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text variant="body" style={{ fontWeight: '600', marginBottom: spacing.md }}>
                  Location (Optional)
                </Text>
                <TextInput
                  value={advancedFilters.location || ''}
                  onChangeText={(text) =>
                    setAdvancedFilters((prev) => ({ ...prev, location: text }))
                  }
                  placeholder="Enter location..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surfaceMuted,
                      color: colors.textPrimary,
                      borderRadius: spacing.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                    },
                  ]}
                />
              </View>

              {/* Verified Only */}
              <Pressable
                onPress={() =>
                  setAdvancedFilters((prev) => ({ ...prev, verified: !prev.verified }))
                }
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: spacing.md,
                  padding: spacing.md,
                  marginBottom: spacing.xl,
                }}
              >
                <View>
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    Verified Accounts Only
                  </Text>
                  <Text variant="caption" color="textMuted">
                    Show only verified users and communities
                  </Text>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: advancedFilters.verified ? colors.primary : colors.borderSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {advancedFilters.verified && (
                    <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
                  )}
                </View>
              </Pressable>

              {/* Reset and Apply Buttons */}
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Pressable
                  onPress={() =>
                    setAdvancedFilters({ dateRange: 'all', sortBy: 'relevance' })
                  }
                  style={[
                    styles.modalButton,
                    {
                      flex: 1,
                      backgroundColor: colors.surfaceMuted,
                      borderRadius: spacing.md,
                      paddingVertical: spacing.md,
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    Reset
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowAdvancedFilters(false)}
                  style={[
                    styles.modalButton,
                    {
                      flex: 1,
                      backgroundColor: colors.primary,
                      borderRadius: spacing.md,
                      paddingVertical: spacing.md,
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text
                    variant="body"
                    style={{ fontWeight: '600', color: colors.primaryForeground }}
                  >
                    Apply
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
  },
  modalInput: {
    fontSize: 15,
    height: 44,
  },
  modalButton: {
    // Styles inline
  },
  advancedFiltersModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
  },
  filterChip: {
    // Styles inline
  },
});
