/**
 * New Message Screen - Instagram-style user selection for DMs
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Text } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../src/lib/apiClient';
import { useTheme } from '../src/contexts/ThemeContext';

interface User {
  id: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
}

export default function NewMessageScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const styles = getThemedStyles(colors, colorScheme);
  const [searchQuery, setSearchQuery] = useState('');

  // Search for users
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search-users', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await apiClient.get('/api/search', {
        params: { q: searchQuery, filter: 'accounts' }
      });
      return response.data || [];
    },
    enabled: searchQuery.trim().length > 1,
  });

  // Filter to only user results
  const users = searchResults?.filter((result: any) => result.type === 'user') || [];

  const handleUserSelect = (user: any) => {
    // Validate user ID before navigation
    if (!user || !user.id) {
      return;
    }

    const userId = String(user.id);

    // Navigate to message detail with the selected user
    try {
      router.push(`/messages/${userId}`);
    } catch (error) {
    }
  };

  const renderUser = ({ item }: { item: any }) => {
    const avatar = item.avatarUrl
      ? item.avatarUrl
      : (item.displayName || item.username).charAt(0).toUpperCase();
    const displayName = item.displayName || item.username;
    const canMessage = item.canMessage !== false; // Default to true if not specified

    return (
      <TouchableOpacity
        style={[styles.userItem, !canMessage && styles.userItemDisabled]}
        onPress={() => canMessage && handleUserSelect(item)}
        disabled={!canMessage}
      >
        <View style={[styles.avatarPlaceholder, !canMessage && styles.avatarDisabled]}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, !canMessage && styles.textDisabled]}>
            {displayName}
          </Text>
          {item.username !== displayName && (
            <Text style={[styles.handle, !canMessage && styles.textDisabled]}>
              @{item.username}
            </Text>
          )}
          {!canMessage && item.dmPrivacyReason && (
            <Text style={styles.privacyNote}>{item.dmPrivacyReason}</Text>
          )}
        </View>
        {canMessage ? (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        ) : (
          <Ionicons name="lock-closed" size={20} color={colors.textTertiary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Message</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {!searchQuery.trim() ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Search for people to message</Text>
              <Text style={styles.emptySubtext}>
                Enter a name or username to find members
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : !users || users.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>
                Try a different search term
              </Text>
            </View>
          ) : (
            <FlatList
              data={users}
              renderItem={renderUser}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any, colorScheme: string) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userItemDisabled: {
    opacity: 0.6,
    backgroundColor: colors.background,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarDisabled: {
    backgroundColor: colors.textTertiary,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  handle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  textDisabled: {
    color: colors.textTertiary,
  },
  privacyNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
