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
  TextInput,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useConversations } from '../queries/messages';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface MessagesScreenProps {
  onConversationPress?: (userId: number) => void;
  onSettingsPress?: () => void;
  onNewMessagePress?: () => void;
  onProfilePress?: () => void;
}

export default function MessagesScreen({
  onConversationPress,
  onSettingsPress,
  onNewMessagePress,
  onProfilePress,
}: MessagesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.displayName && !user?.username) return '?';
    const name = user?.displayName || user?.username || '';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const { data: conversations, isLoading, error, refetch } = useConversations();

  // Log error for debugging and check auth status
  useEffect(() => {
    if (error) {
      const status = (error as any)?.response?.status;
      if (status === 401) {
      }
    }
  }, [error, user]);
  // Get conversation display name
  const getConversationName = (conversation: any) => {
    if (conversation.name) return conversation.name;
    if (conversation.isGroup) return 'Group Chat';
    // Get the other user's name for 1-on-1 chats (API returns otherUser, not participants)
    const otherUser = conversation.otherUser || conversation.participants?.[0];
    return otherUser?.displayName || otherUser?.username || 'Unknown';
  };

  // Get conversation avatar
  const getConversationAvatar = (conversation: any) => {
    if (conversation.avatarUrl) return conversation.avatarUrl;
    const name = getConversationName(conversation);
    return name.charAt(0).toUpperCase();
  };

  // Format last message content - detect media URLs and show friendly labels
  const formatLastMessage = (content: string | undefined): string => {
    if (!content) return 'No messages yet';

    const trimmed = content.trim();

    // Check if it's a URL
    if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
      // GIF patterns
      if (
        /\.gif(\?|$)/i.test(trimmed) ||
        /\.gifv(\?|$)/i.test(trimmed) ||
        /media\.tenor\.com\//i.test(trimmed) ||
        /giphy\.com\//i.test(trimmed)
      ) {
        return 'GIF';
      }

      // Image patterns
      if (
        /\.(jpg|jpeg|png|webp|heic)(\?|$)/i.test(trimmed) ||
        /storage\.googleapis\.com\/.*\.(jpg|jpeg|png|webp)/i.test(trimmed)
      ) {
        return 'Photo';
      }

      // Video patterns
      if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(trimmed)) {
        return 'Video';
      }

      // Generic link
      return 'Link';
    }

    return content;
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
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          padding: 12,
          borderRadius: 12,
          marginBottom: 8,
        }}
        onPress={() => onConversationPress?.(otherUserId)}
      >
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ color: colors.primaryForeground, fontSize: 20, fontWeight: '600' }}>{avatar}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: hasUnread ? '700' : '500', color: colors.textPrimary }}>{displayName}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{timeAgo}</Text>
          </View>
          <Text style={{ fontSize: 14, color: hasUnread ? colors.textPrimary : colors.textSecondary, marginTop: 4, fontStyle: formatLastMessage(item.lastMessage?.content) !== item.lastMessage?.content ? 'italic' : 'normal' }} numberOfLines={1}>
            {formatLastMessage(item.lastMessage?.content)}
          </Text>
        </View>
        {hasUnread && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginLeft: 8 }} />}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: colors.textSecondary }}>Loading conversations...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }} edges={['top']}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header with Profile + Centered Logo */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
            paddingHorizontal: 16,
            backgroundColor: colors.header,
            borderBottomWidth: 1,
            borderBottomColor: colors.headerBorder || colors.borderSubtle,
          }}>
            {/* Left: Profile Avatar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
              <Pressable
                onPress={onProfilePress}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: user?.avatarUrl ? 'transparent' : colors.surfaceMuted,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                ) : (
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
                    {getUserInitials()}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Center: Logo */}
            <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 0, pointerEvents: 'none' }}>
              <Image
                source={require('../../assets/tc-logo-hd.png')}
                style={[
                  { width: 700, height: 140 },
                  colorScheme === 'dark' && { tintColor: colors.headerForeground }
                ]}
                resizeMode="contain"
              />
            </View>

            {/* Right: Action Buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 1 }}>
              <TouchableOpacity onPress={onNewMessagePress} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="create-outline" size={22} color={colors.headerForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>Failed to load conversations</Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
              {(error as any)?.response?.status === 401
                ? 'Please log in to view messages'
                : (error as any)?.response?.data?.message ||
                  (error instanceof Error ? error.message : 'Please try again later')}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              }}
              onPress={() => refetch()}
            >
              <Text style={{ color: colors.primaryForeground, fontSize: 16, fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!conversations || conversations.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }} edges={['top']}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header with Profile + Centered Logo */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
            paddingHorizontal: 16,
            backgroundColor: colors.header,
            borderBottomWidth: 1,
            borderBottomColor: colors.headerBorder || colors.borderSubtle,
          }}>
            {/* Left: Profile Avatar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
              <Pressable
                onPress={onProfilePress}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: user?.avatarUrl ? 'transparent' : colors.surfaceMuted,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                ) : (
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
                    {getUserInitials()}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Center: Logo */}
            <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 0, pointerEvents: 'none' }}>
              <Image
                source={require('../../assets/tc-logo-hd.png')}
                style={[
                  { width: 700, height: 140 },
                  colorScheme === 'dark' && { tintColor: colors.headerForeground }
                ]}
                resizeMode="contain"
              />
            </View>

            {/* Right: Action Buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 1 }}>
              <TouchableOpacity onPress={onNewMessagePress} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="create-outline" size={22} color={colors.headerForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            margin: 16,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: colors.textPrimary }}
              placeholder="Search messages"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>No conversations yet</Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>Start chatting with other members!</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header with Profile + Centered Logo */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          paddingHorizontal: 16,
          backgroundColor: colors.header,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder || colors.borderSubtle,
        }}>
          {/* Left: Profile Avatar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
            <Pressable
              onPress={onProfilePress}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: user?.avatarUrl ? 'transparent' : colors.surfaceMuted,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
              ) : (
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                  {getUserInitials()}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Center: Logo */}
          <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 0, pointerEvents: 'none' }}>
            <Image
              source={require('../../assets/tc-logo-hd.png')}
              style={[
                { width: 700, height: 140 },
                colorScheme === 'dark' && { tintColor: colors.headerForeground }
              ]}
              resizeMode="contain"
            />
          </View>

          {/* Right: Action Buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 1 }}>
            <TouchableOpacity onPress={onNewMessagePress} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="create-outline" size={22} color={colors.headerForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          margin: 16,
          paddingHorizontal: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: colors.textPrimary }}
            placeholder="Search messages"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
              <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>No conversations found</Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>Try a different search</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
