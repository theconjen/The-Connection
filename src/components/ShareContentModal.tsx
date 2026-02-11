/**
 * ShareContentModal - Share content to communities or DMs
 *
 * Allows users to share posts, apologetics answers, advice posts, etc.
 * to their communities or send via direct message.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import apiClient, { communitiesAPI } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';

export type ShareableContentType = 'post' | 'apologetics' | 'advice' | 'event' | 'question';

export interface ShareableContent {
  type: ShareableContentType;
  id: number | string;
  title: string;
  preview?: string; // Short preview of content
  url?: string; // Web URL for the content
}

interface ShareContentModalProps {
  visible: boolean;
  onClose: () => void;
  content: ShareableContent | null;
  onShareComplete?: () => void;
}

type ShareTab = 'community' | 'dm';

interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface Community {
  id: number;
  name: string;
  slug: string;
  iconName?: string;
  iconColor?: string;
  isMember?: boolean;
}

export function ShareContentModal({
  visible,
  onClose,
  content,
  onShareComplete,
}: ShareContentModalProps) {
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<ShareTab>('community');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setActiveTab('community');
      setSearchQuery('');
      setSelectedCommunity(null);
      setSelectedUser(null);
      setShareMessage('');
    }
  }, [visible]);

  // Fetch user's communities
  const { data: communities = [], isLoading: loadingCommunities } = useQuery({
    queryKey: ['/api/communities', 'member'],
    queryFn: async () => {
      const all = await communitiesAPI.getAll();
      return all.filter((c: any) => c.isMember);
    },
    enabled: visible && activeTab === 'community',
  });

  // Search users for DM
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await apiClient.get(`/api/users?search=${encodeURIComponent(searchQuery)}`);
      return response.data.users || response.data || [];
    },
    enabled: visible && activeTab === 'dm' && searchQuery.length >= 2,
  });

  // Get content type label
  const getContentTypeLabel = () => {
    if (!content) return 'Content';
    switch (content.type) {
      case 'apologetics': return 'Apologetics Answer';
      case 'advice': return 'Advice Post';
      case 'post': return 'Post';
      case 'event': return 'Event';
      case 'question': return 'Question';
      default: return 'Content';
    }
  };

  // Build the share message with content link
  const buildShareContent = () => {
    if (!content) return '';

    const baseUrl = 'https://theconnection.app';
    let link = '';

    switch (content.type) {
      case 'apologetics':
        link = `${baseUrl}/a/${content.id}`;
        break;
      case 'advice':
        link = `${baseUrl}/advice/${content.id}`;
        break;
      case 'post':
        link = `${baseUrl}/p/${content.id}`;
        break;
      case 'event':
        link = `${baseUrl}/e/${content.id}`;
        break;
      case 'question':
        link = `${baseUrl}/questions/${content.id}`;
        break;
    }

    const message = shareMessage.trim() || `Check this out: ${content.title}`;
    return `${message}\n\n${link}`;
  };

  // Share to community
  const handleShareToCommunity = async () => {
    if (!selectedCommunity || !content) return;

    setIsSharing(true);
    try {
      const shareContent = buildShareContent();

      // Create a post in the community with the shared content
      await apiClient.post('/api/posts', {
        communityId: selectedCommunity.id,
        title: `Shared: ${content.title}`,
        content: shareContent,
      });

      Alert.alert(
        'Shared!',
        `Successfully shared to ${selectedCommunity.name}`,
        [{ text: 'OK', onPress: () => { onClose(); onShareComplete?.(); } }]
      );
    } catch (error: any) {
      console.error('Share to community error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to share to community');
    } finally {
      setIsSharing(false);
    }
  };

  // Share via DM
  const handleShareViaDM = async () => {
    if (!selectedUser || !content) return;

    setIsSharing(true);
    try {
      const shareContent = buildShareContent();

      // Send DM with shared content
      await apiClient.post('/api/dm/send', {
        receiverId: selectedUser.id,
        content: shareContent,
      });

      Alert.alert(
        'Sent!',
        `Message sent to ${selectedUser.displayName || selectedUser.username}`,
        [{ text: 'OK', onPress: () => { onClose(); onShareComplete?.(); } }]
      );
    } catch (error: any) {
      console.error('Share via DM error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSharing(false);
    }
  };

  const handleShare = () => {
    if (activeTab === 'community') {
      handleShareToCommunity();
    } else {
      handleShareViaDM();
    }
  };

  const canShare = activeTab === 'community' ? !!selectedCommunity : !!selectedUser;

  if (!content) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Share {getContentTypeLabel()}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content Preview */}
        <View style={[styles.contentPreview, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={[styles.contentIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons
              name={
                content.type === 'apologetics' ? 'library' :
                content.type === 'advice' ? 'chatbubbles' :
                content.type === 'event' ? 'calendar' :
                content.type === 'question' ? 'help-circle' :
                'document-text'
              }
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.contentInfo}>
            <Text style={[styles.contentTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {content.title}
            </Text>
            {content.preview && (
              <Text style={[styles.contentPreviewText, { color: colors.textMuted }]} numberOfLines={1}>
                {content.preview}
              </Text>
            )}
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceMuted }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'community' && { backgroundColor: colors.background },
            ]}
            onPress={() => setActiveTab('community')}
          >
            <Ionicons
              name="people"
              size={18}
              color={activeTab === 'community' ? colors.primary : colors.textMuted}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'community' ? colors.primary : colors.textMuted }
            ]}>
              Community
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'dm' && { backgroundColor: colors.background },
            ]}
            onPress={() => setActiveTab('dm')}
          >
            <Ionicons
              name="chatbubble"
              size={18}
              color={activeTab === 'dm' ? colors.primary : colors.textMuted}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'dm' ? colors.primary : colors.textMuted }
            ]}>
              Direct Message
            </Text>
          </Pressable>
        </View>

        {/* Message Input */}
        <View style={styles.messageContainer}>
          <TextInput
            style={[styles.messageInput, {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: colors.borderSubtle,
            }]}
            placeholder="Add a message (optional)..."
            placeholderTextColor={colors.textMuted}
            value={shareMessage}
            onChangeText={setShareMessage}
            multiline
            maxLength={500}
          />
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {activeTab === 'community' ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Your Communities
              </Text>
              {loadingCommunities ? (
                <ActivityIndicator style={styles.loader} color={colors.primary} />
              ) : communities.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  You haven't joined any communities yet
                </Text>
              ) : (
                <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                  {communities.map((community: Community) => (
                    <Pressable
                      key={community.id}
                      style={[
                        styles.listItem,
                        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                        selectedCommunity?.id === community.id && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primary + '10',
                        },
                      ]}
                      onPress={() => setSelectedCommunity(community)}
                    >
                      <View style={[styles.itemIcon, { backgroundColor: (community.iconColor || colors.primary) + '20' }]}>
                        <Ionicons
                          name={(community.iconName as any) || 'people'}
                          size={18}
                          color={community.iconColor || colors.primary}
                        />
                      </View>
                      <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {community.name}
                      </Text>
                      {selectedCommunity?.id === community.id && (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <>
              <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Ionicons name="search" size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Search users..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>

              {loadingUsers ? (
                <ActivityIndicator style={styles.loader} color={colors.primary} />
              ) : searchQuery.length < 2 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Search for a user to send a message
                </Text>
              ) : users.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No users found
                </Text>
              ) : (
                <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                  {users.map((u: User) => (
                    <Pressable
                      key={u.id}
                      style={[
                        styles.listItem,
                        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                        selectedUser?.id === u.id && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primary + '10',
                        },
                      ]}
                      onPress={() => setSelectedUser(u)}
                    >
                      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                          {(u.displayName || u.username).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {u.displayName || u.username}
                        </Text>
                        {u.displayName && (
                          <Text style={[styles.username, { color: colors.textMuted }]}>
                            @{u.username}
                          </Text>
                        )}
                      </View>
                      {selectedUser?.id === u.id && (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </View>

        {/* Share Button */}
        <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
          <Pressable
            style={[
              styles.shareButton,
              { backgroundColor: canShare ? colors.primary : colors.surfaceMuted },
            ]}
            onPress={handleShare}
            disabled={!canShare || isSharing}
          >
            {isSharing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={activeTab === 'community' ? 'share-social' : 'send'}
                  size={20}
                  color={canShare ? '#fff' : colors.textMuted}
                />
                <Text style={[
                  styles.shareButtonText,
                  { color: canShare ? '#fff' : colors.textMuted }
                ]}>
                  {activeTab === 'community' ? 'Share to Community' : 'Send Message'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  contentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  contentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  contentPreviewText: {
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messageContainer: {
    padding: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 60,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 13,
    marginTop: 1,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShareContentModal;
