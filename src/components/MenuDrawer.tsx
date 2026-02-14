import React, { useState, useEffect } from 'react';
import { Modal, View, Pressable, StyleSheet, TextInput, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../lib/apiClient';
import { useTheme } from '../contexts/ThemeContext';
import { useNotificationCount } from '../queries/notifications';

type ThemePreference = 'light' | 'dark' | 'system';

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSettings: () => void;
  onNotifications: () => void;
  onBookmarks: () => void;
  onChurches?: () => void;
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

export function MenuDrawer({ visible, onClose, onSettings, onNotifications, onBookmarks, onChurches, onInbox, hasInboxAccess, onSearch, onUserPress }: MenuDrawerProps) {
  const { colors, theme, setTheme } = useTheme();
  const styles = getStyles(colors, theme);

  // Get unread notification count for badge
  const { data: notificationCountData } = useNotificationCount();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
    }
  }, [visible]);

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const response = await apiClient.get(`/api/search?q=${encodeURIComponent(searchQuery)}&filter=accounts`);
          setSearchResults(response.data);
        } catch (error) {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleUserPress = (user: SearchResult) => {
    onClose();
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
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for people..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Search Results or Menu Items */}
            <ScrollView style={styles.content}>
              {showResults ? (
                <View style={styles.searchResults}>
                  {isSearching ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.primary} />
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
                            cachePolicy="memory-disk"
                          />
                          <View style={styles.userInfo}>
                            <Text style={styles.userDisplayName}>{user.displayName || user.username}</Text>
                            <Text style={styles.userUsername}>@{user.username}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </Pressable>
                      ))}
                    </>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="search-outline" size={48} color={colors.textMuted} />
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
                    <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
                    <Text style={styles.menuItemText}>Settings</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </Pressable>

                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      onClose();
                      onNotifications();
                    }}
                  >
                    <View style={{ position: 'relative' }}>
                      <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
                      {(notificationCountData?.count ?? 0) > 0 && (
                        <View style={{
                          position: 'absolute',
                          top: -4,
                          right: -6,
                          backgroundColor: '#EF4444',
                          borderRadius: 10,
                          minWidth: 18,
                          height: 18,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 4,
                        }}>
                          <Text style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: '#FFFFFF',
                          }}>
                            {notificationCountData.count > 99 ? '99+' : notificationCountData.count}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.menuItemText}>Notification Center</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </Pressable>

                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      onClose();
                      onBookmarks();
                    }}
                  >
                    <Ionicons name="bookmark-outline" size={24} color={colors.textPrimary} />
                    <Text style={styles.menuItemText}>Bookmarks</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </Pressable>

                  {/* Churches Directory */}
                  {onChurches && (
                    <Pressable
                      style={styles.menuItem}
                      onPress={() => {
                        onClose();
                        onChurches();
                      }}
                    >
                      <Image
                        source={require('../../assets/church-icon.png')}
                        style={{ width: 24, height: 24, tintColor: colors.textPrimary }}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                      />
                      <Text style={styles.menuItemText}>Churches</Text>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </Pressable>
                  )}

                  {/* Q&A Inbox - Only show if user has inbox_access permission */}
                  {hasInboxAccess && onInbox && (
                    <Pressable
                      style={styles.menuItem}
                      onPress={() => {
                        onClose();
                        onInbox();
                      }}
                    >
                      <Ionicons name="mail-outline" size={24} color={colors.accent} />
                      <Text style={styles.menuItemText}>Q&A Inbox</Text>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </Pressable>
                  )}

                  {/* Theme Toggle */}
                  <View style={styles.themeSectionContainer}>
                    <View style={styles.themeSectionHeader}>
                      <Ionicons name="contrast-outline" size={24} color={colors.textPrimary} />
                      <Text style={styles.menuItemText}>Appearance</Text>
                    </View>
                    <View style={styles.themeToggleContainer}>
                      {(['light', 'dark', 'system'] as ThemePreference[]).map((option) => (
                        <Pressable
                          key={option}
                          style={[
                            styles.themeOption,
                            theme === option && styles.themeOptionActive,
                          ]}
                          onPress={() => setTheme(option)}
                        >
                          <Ionicons
                            name={
                              option === 'light' ? 'sunny-outline' :
                              option === 'dark' ? 'moon-outline' : 'phone-portrait-outline'
                            }
                            size={18}
                            color={theme === option ? colors.primary : colors.textSecondary}
                          />
                          <Text style={[
                            styles.themeOptionText,
                            theme === option && styles.themeOptionTextActive,
                          ]}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
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
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
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
    borderColor: colors.borderSubtle,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
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
    backgroundColor: colors.surfaceMuted,
  },
  userInfo: {
    flex: 1,
  },
  userDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
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
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  themeSectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: 8,
  },
  themeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 4,
    alignSelf: 'center',
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  themeOptionActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  themeOptionTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
