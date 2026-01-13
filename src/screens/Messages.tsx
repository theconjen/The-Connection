/**
 * MESSAGES SCREEN - The Connection Mobile App
 * Native React Native implementation with real API
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConversations } from '../queries/messages';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface MessagesScreenProps {
  onConversationPress?: (userId: number) => void;
  onSettingsPress?: () => void;
  onNewMessagePress?: () => void;
}

export default function MessagesScreen({
  onConversationPress,
  onSettingsPress,
  onNewMessagePress
}: MessagesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { data: conversations, isLoading, error, refetch } = useConversations();

  // Log error for debugging and check auth status
  useEffect(() => {
    if (error) {
      console.error('[Messages] Failed to load conversations:', error);
      console.error('[Messages] User auth status:', { userId: user?.id, username: user?.username });
      const status = (error as any)?.response?.status;
      if (status === 401) {
        console.error('[Messages] Authentication error - user may need to log in');
      }
    }
  }, [error, user]);
  // Get conversation display name
  const getConversationName = (conversation: any) => {
    if (conversation.name) return conversation.name;
    if (conversation.isGroup) return 'Group Chat';
    // Get the other participant's name for 1-on-1 chats
    const otherParticipant = conversation.participants?.[0];
    return otherParticipant?.displayName || otherParticipant?.username || 'Unknown';
  };

  // Get conversation avatar
  const getConversationAvatar = (conversation: any) => {
    if (conversation.avatarUrl) return conversation.avatarUrl;
    const name = getConversationName(conversation);
    return name.charAt(0).toUpperCase();
  };

  // Filter conversations based on search
  const filteredConversations = conversations?.filter((conv: any) => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  }) || [];

  const renderConversation = ({ item }: { item: any }) => {
    const hasUnread = item.unreadCount > 0;
    const displayName = getConversationName(item);
    const avatar = getConversationAvatar(item);
    const timeAgo = item.lastMessage?.createdAt
      ? formatDistanceToNow(new Date(item.lastMessage.createdAt), { addSuffix: true })
      : '';

    // Get the other user's ID for navigation
    const otherUserId = item.otherUser?.id || item.participants?.[0]?.id;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => onConversationPress?.(otherUserId)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.name, hasUnread && styles.unreadName]}>{displayName}</Text>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
          <Text style={[styles.lastMessage, hasUnread && styles.unreadMessage]} numberOfLines={1}>
            {item.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
        {hasUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#222D99" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Messages</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={onNewMessagePress}
                style={styles.headerButton}
              >
                <Ionicons name="create-outline" size={24} color="#0D1829" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSettingsPress}
                style={styles.headerButton}
              >
                <Ionicons name="settings-outline" size={24} color="#0D1829" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.centerContent}>
            <Ionicons name="alert-circle-outline" size={48} color="#637083" />
            <Text style={styles.errorText}>Failed to load conversations</Text>
            <Text style={styles.errorSubtext}>
              {(error as any)?.response?.status === 401
                ? 'Please log in to view messages'
                : (error as any)?.response?.data?.message ||
                  (error instanceof Error ? error.message : 'Please try again later')}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!conversations || conversations.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Messages</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={onNewMessagePress}
                style={styles.headerButton}
              >
                <Ionicons name="create-outline" size={24} color="#0D1829" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSettingsPress}
                style={styles.headerButton}
              >
                <Ionicons name="settings-outline" size={24} color="#0D1829" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#637083" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages"
              placeholderTextColor="#637083"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.centerContent}>
            <Ionicons name="chatbubbles-outline" size={64} color="#637083" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Start chatting with other members!</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={onNewMessagePress}
              style={styles.headerButton}
            >
              <Ionicons name="create-outline" size={24} color="#0D1829" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSettingsPress}
              style={styles.headerButton}
            >
              <Ionicons name="settings-outline" size={24} color="#0D1829" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#637083" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          placeholderTextColor="#637083"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.centerContent}>
            <Ionicons name="search-outline" size={48} color="#637083" />
            <Text style={styles.emptyText}>No conversations found</Text>
            <Text style={styles.emptySubtext}>Try a different search</Text>
          </View>
        }
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F5F8FA' },
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D1829',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#0D1829' },
  listContainer: { paddingHorizontal: 16 },
  conversationItem: {
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
    backgroundColor: '#222D99',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  conversationContent: { flex: 1, marginLeft: 12 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '500', color: '#0D1829' },
  unreadName: { fontWeight: '700' },
  time: { fontSize: 12, color: '#637083' },
  lastMessage: { fontSize: 14, color: '#637083', marginTop: 4 },
  unreadMessage: { color: '#0D1829' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#222D99', marginLeft: 8 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#637083' },
  errorText: { marginTop: 16, fontSize: 18, fontWeight: '600', color: '#0D1829' },
  errorSubtext: { marginTop: 8, fontSize: 14, color: '#637083', textAlign: 'center' },
  emptyText: { marginTop: 16, fontSize: 18, fontWeight: '600', color: '#0D1829' },
  emptySubtext: { marginTop: 8, fontSize: 14, color: '#637083', textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#222D99',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
