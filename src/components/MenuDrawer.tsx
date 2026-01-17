import React, { useState, useEffect } from 'react';
import { Modal, View, Pressable, StyleSheet, TextInput, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { Text } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../lib/apiClient';
import { useTheme } from '../contexts/ThemeContext';

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSettings: () => void;
  onNotifications: () => void;
  onBookmarks: () => void;
  onInbox?: () => void;
  hasInboxAccess?: boolean;
  onSearch?: () => void;
  onUserPress?: (userId: number) => void;
}

interface SearchResult {
  type: 'user';
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isPrivate: boolean;
  canMessage: boolean;
  dmPrivacyReason?: string;
}

interface FriendSuggestion {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  state?: string;
  denomination?: string;
  suggestionScore: {
    total: number;
    mutualFollows: number;
    mutualCommunities: number;
    location: number;
  };
}

export function MenuDrawer({ visible, onClose, onSettings, onNotifications, onBookmarks, onInbox, hasInboxAccess, onSearch, onUserPress }: MenuDrawerProps) {
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [friendSuggestions, setFriendSuggestions] = useState<FriendSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
    } else {
      // Fetch friend suggestions when menu opens
      fetchFriendSuggestions();
    }
  }, [visible]);

  const fetchFriendSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await apiClient.get('/api/user/suggestions/friends?limit=5');
      // Ensure we always have an array
      setFriendSuggestions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      // Silently fail - friend suggestions are optional
      setFriendSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const response = await apiClient.get(`/api/search?q=${encodeURIComponent(searchQuery)}&filter=accounts`);
          setSearchResults(response.data);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleUserPress = (user: SearchResult) => {
    onClose();
    // Navigate to user profile
    if (onUserPress) {
      onUserPress(user.id);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.drawer} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['top', 'right', 'bottom']} style={styles.drawerContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Menu</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#0F1419" />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#536471" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for people..."
                placeholderTextColor="#536471"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#536471" />
                </Pressable>
              )}
            </View>

            {/* Search Results or Menu Items */}
            <ScrollView style={styles.content}>
            {showResults ? (
              <View style={styles.searchResults}>
                {isSearching ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1D9BF0" />
                    <Text style={styles.loadingText}>Searching...</Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <>
                    <Text style={styles.resultsHeader}>People</Text>
                    {searchResults.map((user) => (
                      <Pressable
                        key={user.id}
                        style={styles.userResult}
                        onPress={() => handleUserPress(user)}
                      >
                        <Image
                          source={{ uri: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username)}&background=random` }}
                          style={styles.userAvatar}
                        />
                        <View style={styles.userInfo}>
                          <Text style={styles.userDisplayName}>{user.displayName || user.username}</Text>
                          <Text style={styles.userUsername}>@{user.username}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#536471" />
                      </Pressable>
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color="#536471" />
                    <Text style={styles.emptyText}>No people found</Text>
                    <Text style={styles.emptySubtext}>Try a different search term</Text>
                  </View>
                )}
              </View>
            ) : (
            <View style={styles.menuItems}>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onSettings();
                }}
              >
                <Ionicons name="settings-outline" size={24} color="#0F1419" />
                <Text style={styles.menuItemText}>Settings</Text>
                <Ionicons name="chevron-forward" size={20} color="#536471" />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onNotifications();
                }}
              >
                <Ionicons name="notifications-outline" size={24} color="#0F1419" />
                <Text style={styles.menuItemText}>Notification Center</Text>
                <Ionicons name="chevron-forward" size={20} color="#536471" />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onBookmarks();
                }}
              >
                <Ionicons name="bookmark-outline" size={24} color="#0F1419" />
                <Text style={styles.menuItemText}>Bookmarks</Text>
                <Ionicons name="chevron-forward" size={20} color="#536471" />
              </Pressable>

              {/* Q&A Inbox - Only show if user has inbox_access permission */}
              {hasInboxAccess && onInbox && (
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    onInbox();
                  }}
                >
                  <Ionicons name="mail-outline" size={24} color="#E74C3C" />
                  <Text style={styles.menuItemText}>Q&A Inbox</Text>
                  <Ionicons name="chevron-forward" size={20} color="#536471" />
                </Pressable>
              )}

              {/* Suggested Friends Section */}
              {friendSuggestions.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <Text style={styles.suggestionsHeader}>Suggested Friends</Text>
                  {friendSuggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion.id}
                      style={styles.suggestionCard}
                      onPress={() => handleUserPress(suggestion as any)}
                    >
                      <Image
                        source={{
                          uri: suggestion.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.displayName || suggestion.username)}&background=random`
                        }}
                        style={styles.suggestionAvatar}
                      />
                      <View style={styles.suggestionInfo}>
                        <Text style={styles.suggestionDisplayName} numberOfLines={1}>
                          {suggestion.displayName || suggestion.username}
                        </Text>
                        <Text style={styles.suggestionUsername} numberOfLines={1}>
                          @{suggestion.username}
                        </Text>
                        {suggestion.suggestionScore.mutualCommunities > 0 && (
                          <Text style={styles.suggestionReason} numberOfLines={1}>
                            <Ionicons name="people-outline" size={12} color="#536471" />{' '}
                            {suggestion.suggestionScore.mutualCommunities} mutual {suggestion.suggestionScore.mutualCommunities === 1 ? 'community' : 'communities'}
                          </Text>
                        )}
                        {suggestion.suggestionScore.mutualFollows > 0 && (
                          <Text style={styles.suggestionReason} numberOfLines={1}>
                            <Ionicons name="person-outline" size={12} color="#536471" />{' '}
                            {suggestion.suggestionScore.mutualFollows} mutual {suggestion.suggestionScore.mutualFollows === 1 ? 'friend' : 'friends'}
                          </Text>
                        )}
                        {suggestion.suggestionScore.location > 0 && suggestion.city && (
                          <Text style={styles.suggestionReason} numberOfLines={1}>
                            <Ionicons name="location-outline" size={12} color="#536471" />{' '}
                            {suggestion.city}, {suggestion.state}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#536471" />
                    </Pressable>
                  ))}
                </View>
              )}

              {isLoadingSuggestions && friendSuggestions.length === 0 && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1D9BF0" />
                  <Text style={styles.loadingText}>Loading suggestions...</Text>
                </View>
              )}
            </View>
            )}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 0,
  },
  drawer: {
    width: 360,
    flex: 1,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderTopLeftRadius: 12,
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  clearButton: {
    padding: 4,
  },
  menuItems: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingLeft: 20,
    paddingRight: 20,
    gap: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
  },
  comingSoonBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  searchResults: {
    paddingTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
  },
  resultsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.muted,
  },
  userInfo: {
    flex: 1,
  },
  userDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  suggestionsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestionsHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: colors.surface,
  },
  suggestionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.muted,
  },
  suggestionInfo: {
    flex: 1,
    gap: 2,
  },
  suggestionDisplayName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  suggestionUsername: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  suggestionReason: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
