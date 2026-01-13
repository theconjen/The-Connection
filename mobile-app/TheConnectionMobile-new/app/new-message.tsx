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

interface User {
  id: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
}

export default function NewMessageScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Search for users
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search-users', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await apiClient.get('/search', {
        params: { q: searchQuery, filter: 'accounts' }
      });
      return response.data || [];
    },
    enabled: searchQuery.trim().length > 1,
  });

  // Filter to only user results
  const users = searchResults?.filter((result: any) => result.type === 'user') || [];

  const handleUserSelect = (user: any) => {
    // Navigate to message detail with the selected user (using userId param like existing screen)
    router.push({
      pathname: '/messages/[userId]',
      params: { userId: user.id.toString() }
    });
  };

  const renderUser = ({ item }: { item: any }) => {
    const avatar = item.avatarUrl
      ? item.avatarUrl
      : (item.displayName || item.username).charAt(0).toUpperCase();
    const displayName = item.displayName || item.username;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserSelect(item)}
      >
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{displayName}</Text>
          {item.username !== displayName && (
            <Text style={styles.handle}>@{item.username}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#637083" />
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
            <Ionicons name="close" size={28} color="#0D1829" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Message</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#637083" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people..."
            placeholderTextColor="#637083"
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
              <Ionicons name="close-circle" size={20} color="#637083" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {!searchQuery.trim() ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#D1D8DE" />
              <Text style={styles.emptyText}>Search for people to message</Text>
              <Text style={styles.emptySubtext}>
                Enter a name or username to find members
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#222D99" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : !users || users.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#D1D8DE" />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1829',
  },
  headerSpacer: {
    width: 36,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0D1829',
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
    color: '#0D1829',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#637083',
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
    color: '#637083',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
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
    backgroundColor: '#222D99',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#0D1829',
  },
  handle: {
    fontSize: 14,
    color: '#637083',
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    color: '#637083',
    marginTop: 4,
  },
});
