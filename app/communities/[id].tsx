/**
 * Community Detail Screen
 * Shows community feed, events, chat, members, and prayer requests
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesAPI, chatAPI } from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import socketService, { ChatMessage } from '../../src/lib/socket';

interface WallPost {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
}

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  isPrivate?: boolean;
  isMember?: boolean;
  isAdmin?: boolean;
  isModerator?: boolean;
  role?: 'owner' | 'moderator' | 'member' | null;
  privacySetting?: 'public' | 'private';
}

type TabType = 'feed' | 'events' | 'chat' | 'members' | 'prayers';

export default function CommunityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [newPostContent, setNewPostContent] = useState('');
  const [isPostInputVisible, setIsPostInputVisible] = useState(false);
  const [showModeratorModal, setShowModeratorModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [newPrayerRequest, setNewPrayerRequest] = useState('');
  const [isPrayerInputVisible, setIsPrayerInputVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<any>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  const communityId = parseInt(id || '0');
  const styles = getStyles(colors, colorScheme);

  // Fetch community details
  const { data: community, isLoading: communityLoading, refetch: refetchCommunity } = useQuery<Community>({
    queryKey: ['community', communityId],
    queryFn: () => communitiesAPI.getById(communityId),
    enabled: !!communityId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch when app comes to foreground
  });

  // Fetch wall posts
  const { data: wallPosts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery<WallPost[]>({
    queryKey: ['community-wall', communityId],
    queryFn: () => communitiesAPI.getWallPosts(communityId),
    enabled: !!communityId && activeTab === 'feed' && !!community?.isMember,
  });

  // Fetch members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => communitiesAPI.getMembers(communityId),
    enabled: !!communityId && activeTab === 'members',
  });

  // Fetch chat room
  const { data: chatRoomData, isLoading: chatRoomLoading } = useQuery({
    queryKey: ['chat-room', communityId],
    queryFn: () => chatAPI.getChatRoom(communityId),
    enabled: !!communityId && activeTab === 'chat' && !!community?.isMember,
    onSuccess: (data) => {
      setChatRoom(data);
    },
  });

  // Fetch chat messages
  const { data: chatMessagesData, isLoading: chatMessagesLoading, refetch: refetchChatMessages } = useQuery({
    queryKey: ['chat-messages', communityId],
    queryFn: () => chatAPI.getChatMessages(communityId),
    enabled: !!communityId && activeTab === 'chat' && !!chatRoom && !!community?.isMember,
    onSuccess: (data) => {
      setChatMessages(data || []);
    },
  });

  // Socket.IO connection for real-time chat
  useEffect(() => {
    if (!user?.id || !community?.isMember || activeTab !== 'chat' || !chatRoom) {
      return;
    }

    // Connect socket
    socketService.connect(user.id);

    // Join chat room
    if (chatRoom?.id) {
      socketService.joinChatRoom(chatRoom.id);
    }

    // Listen for new messages
    socketService.onChatMessage((message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
      // Scroll to bottom
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      // Leave room and cleanup
      if (chatRoom?.id) {
        socketService.leaveChatRoom(chatRoom.id);
      }
      socketService.offChatMessage();
    };
  }, [user?.id, community?.isMember, activeTab, chatRoom]);

  // Join/Leave mutations
  const joinMutation = useMutation({
    mutationFn: () => communitiesAPI.join(communityId),
    onSuccess: () => {
      // Optimistically update the community cache
      queryClient.setQueryData(['community', communityId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isMember: true,
          isAdmin: false,
          isModerator: false,
          role: 'member'
        };
      });

      // Refetch after a short delay to let the server update
      setTimeout(() => {
        refetchCommunity();
        queryClient.invalidateQueries({ queryKey: ['communities'] });
      }, 1000);

      Alert.alert('Success', 'You have joined the community!');
    },
    onError: (error: any) => {
      // If already a member, just update the cache
      if (error.response?.data?.message?.includes('Already a member')) {
        queryClient.setQueryData(['community', communityId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            isMember: true,
            isAdmin: false,
            isModerator: false,
            role: 'member'
          };
        });

        // Refetch after a delay
        setTimeout(() => {
          refetchCommunity();
          queryClient.invalidateQueries({ queryKey: ['communities'] });
        }, 1000);

        Alert.alert('Success', 'You are already a member!');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to join community');
      }
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => communitiesAPI.leave(communityId),
    onSuccess: () => {
      // Optimistically update the community cache
      queryClient.setQueryData(['community', communityId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isMember: false,
          isAdmin: false,
          isModerator: false,
          role: null
        };
      });

      // Refetch after a short delay
      setTimeout(() => {
        refetchCommunity();
        queryClient.invalidateQueries({ queryKey: ['communities'] });
      }, 1000);

      Alert.alert('Success', 'You have left the community');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to leave community');
    },
  });

  // Create wall post mutation
  const createPostMutation = useMutation({
    mutationFn: (content: string) => communitiesAPI.createWallPost(communityId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-wall', communityId] });
      setNewPostContent('');
      setIsPostInputVisible(false);
      Alert.alert('Success', 'Your post has been shared!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create post');
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'member' | 'moderator' }) =>
      communitiesAPI.updateMemberRole(communityId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      setShowModeratorModal(false);
      setSelectedMember(null);
      Alert.alert('Success', 'Member role updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update member role');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => communitiesAPI.removeMember(communityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      setShowModeratorModal(false);
      setSelectedMember(null);
      Alert.alert('Success', 'Member removed from community');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove member');
    },
  });

  // Delete wall post mutation
  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => communitiesAPI.deleteWallPost(communityId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-wall', communityId] });
      Alert.alert('Success', 'Post deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete post');
    },
  });

  const handleJoinLeave = () => {
    if (community?.isMember) {
      Alert.alert(
        'Leave Community',
        `Are you sure you want to leave ${community.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => leaveMutation.mutate(),
          },
        ]
      );
    } else {
      joinMutation.mutate();
    }
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }

    if (newPostContent.trim().length < 5) {
      Alert.alert('Error', 'Post must be at least 5 characters long');
      return;
    }

    createPostMutation.mutate(newPostContent.trim());
  };

  const handleSendChatMessage = () => {
    if (!newChatMessage.trim()) {
      return;
    }

    if (!chatRoom || !user?.id) {
      Alert.alert('Error', 'Unable to send message');
      return;
    }

    // Send via Socket.IO for real-time delivery
    socketService.sendChatMessage(chatRoom.id, newChatMessage.trim(), user.id);
    setNewChatMessage('');

    // Scroll to bottom
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (communityLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Community not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPrivate = community.privacySetting === 'private' || community.isPrivate;
  const canViewContent = !isPrivate || community.isMember;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.communityName}>{community.name}</Text>
          <Text style={styles.description}>{community.description}</Text>
        </View>
      </View>

      {/* Community Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.communityMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="people" size={16} color={colors.mutedForeground} />
            <Text style={styles.metaText}>{community.memberCount} members</Text>
          </View>
          {isPrivate && (
            <View style={styles.metaItem}>
              <Ionicons name="lock-closed" size={16} color="#F59E0B" />
              <Text style={styles.privateLabel}>Private Wall</Text>
            </View>
          )}
          {community.isAdmin && (
            <View style={styles.metaItem}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.adminLabel}>Admin</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {community.isAdmin && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setActiveTab('members')}
            >
              <Ionicons name="settings-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          {!community.isAdmin && (
            <TouchableOpacity
              style={[
                styles.joinButton,
                community.isMember && styles.joinedButton,
              ]}
              onPress={handleJoinLeave}
              disabled={joinMutation.isPending || leaveMutation.isPending}
            >
              {joinMutation.isPending || leaveMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={community.isMember ? "checkmark" : "person-add"}
                    size={18}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.joinButtonText}>
                    {community.isMember ? 'Joined' : 'Join'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TabButton
          icon="list"
          label="Feed"
          active={activeTab === 'feed'}
          onPress={() => setActiveTab('feed')}
          colors={colors}
        />
        <TabButton
          icon="calendar"
          label="Events"
          active={activeTab === 'events'}
          onPress={() => setActiveTab('events')}
          colors={colors}
        />
        <TabButton
          icon="chatbubbles"
          label="Chat"
          active={activeTab === 'chat'}
          onPress={() => setActiveTab('chat')}
          colors={colors}
        />
        <TabButton
          icon="people"
          label="Members"
          active={activeTab === 'members'}
          onPress={() => setActiveTab('members')}
          colors={colors}
        />
        <TabButton
          icon="heart"
          label="Prayers"
          active={activeTab === 'prayers'}
          onPress={() => setActiveTab('prayers')}
          colors={colors}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={postsLoading || membersLoading}
            onRefresh={refetchPosts}
          />
        }
      >
        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <View style={styles.tabContent}>
            {!canViewContent ? (
              <PrivateContentPlaceholder
                title="Private Feed"
                message="This community has a private wall. Join the community to see posts and participate in discussions."
                colors={colors}
              />
            ) : (
              <>
                {/* Create Post Section */}
                {community.isMember && (
                  <View style={styles.createPostSection}>
                    {!isPostInputVisible ? (
                      <TouchableOpacity
                        style={styles.createPostPrompt}
                        onPress={() => setIsPostInputVisible(true)}
                      >
                        <Text style={styles.createPostPromptText}>
                          Share something with the community...
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.createPostForm}>
                        <TextInput
                          style={styles.postInput}
                          value={newPostContent}
                          onChangeText={setNewPostContent}
                          placeholder="What's on your mind?"
                          placeholderTextColor={colors.mutedForeground}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          autoFocus
                        />
                        <View style={styles.postActions}>
                          <TouchableOpacity
                            style={styles.cancelPostButton}
                            onPress={() => {
                              setIsPostInputVisible(false);
                              setNewPostContent('');
                            }}
                            disabled={createPostMutation.isPending}
                          >
                            <Text style={styles.cancelPostButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.submitPostButton,
                              createPostMutation.isPending && styles.submitPostButtonDisabled,
                            ]}
                            onPress={handleCreatePost}
                            disabled={createPostMutation.isPending}
                          >
                            {createPostMutation.isPending ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.submitPostButtonText}>Post</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Wall Posts */}
                {postsLoading ? (
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : wallPosts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={64} color={colors.mutedForeground} />
                    <Text style={styles.emptyStateText}>No posts yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Be the first to share something!
                    </Text>
                  </View>
                ) : (
                  wallPosts.map((post) => {
                    const canDelete = community.isAdmin || community.isModerator;
                    return (
                      <View key={post.id} style={styles.postCard}>
                        <View style={styles.postHeader}>
                          <View style={styles.authorInfo}>
                            <View style={styles.avatar}>
                              <Text style={styles.avatarText}>
                                {post.authorName?.charAt(0).toUpperCase() || 'U'}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  if (post.authorId) {
                                    router.push(`/profile?userId=${post.authorId}`);
                                  }
                                }}
                              >
                                <Text style={[styles.authorName, { textDecorationLine: 'underline' }]}>
                                  @{post.authorName}
                                </Text>
                              </TouchableOpacity>
                              <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
                            </View>
                          </View>
                          {canDelete && (
                            <TouchableOpacity
                              onPress={() => {
                                Alert.alert(
                                  'Delete Post',
                                  'Are you sure you want to delete this post?',
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Delete',
                                      style: 'destructive',
                                      onPress: () => deletePostMutation.mutate(post.id),
                                    },
                                  ]
                                );
                              }}
                              style={styles.deleteButton}
                              disabled={deletePostMutation.isPending}
                            >
                              <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.postContent}>{post.content}</Text>
                      </View>
                    );
                  })
                )}
              </>
            )}
          </View>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <View style={styles.tabContent}>
            {!canViewContent ? (
              <PrivateContentPlaceholder
                title="Private Events"
                message="Join the community to see and RSVP to events."
                colors={colors}
              />
            ) : (
              <>
                {/* Create Event Button (Admin Only) */}
                {community.isAdmin && (
                  <TouchableOpacity
                    style={styles.createEventButton}
                    onPress={() => Alert.alert('Create Event', 'Event creation coming soon!')}
                  >
                    <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.createEventButtonText}>Create Event</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={64} color={colors.mutedForeground} />
                  <Text style={styles.emptyStateText}>No events scheduled</Text>
                  <Text style={styles.emptyStateSubtext}>
                    {community.isAdmin ? 'Create your first event' : 'Check back later for upcoming events'}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={100}
          >
            {!canViewContent ? (
              <View style={styles.tabContent}>
                <PrivateContentPlaceholder
                  title="Private Chat"
                  message="Join the community to participate in chat discussions."
                  colors={colors}
                />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Messages List */}
                <ScrollView
                  ref={chatScrollRef}
                  style={styles.chatMessages}
                  contentContainerStyle={styles.chatMessagesContent}
                  onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: false })}
                >
                  {chatMessagesLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                  ) : chatMessages.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="chatbubbles-outline" size={64} color={colors.mutedForeground} />
                      <Text style={styles.emptyStateText}>No messages yet</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Be the first to say something!
                      </Text>
                    </View>
                  ) : (
                    chatMessages.map((message) => {
                      const isOwnMessage = message.senderId === user?.id;
                      return (
                        <View
                          key={message.id}
                          style={[
                            styles.chatBubble,
                            isOwnMessage ? styles.chatBubbleOwn : styles.chatBubbleOther,
                          ]}
                        >
                          {!isOwnMessage && (
                            <TouchableOpacity
                              onPress={() => {
                                if (message.sender?.id) {
                                  router.push(`/profile?userId=${message.sender.id}`);
                                }
                              }}
                            >
                              <Text style={[styles.chatSenderName, { textDecorationLine: 'underline' }]}>
                                @{message.sender?.username || message.sender?.displayName}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <Text style={[
                            styles.chatMessageText,
                            isOwnMessage && styles.chatMessageTextOwn,
                          ]}>
                            {message.content}
                          </Text>
                          <Text style={[
                            styles.chatMessageTime,
                            isOwnMessage && styles.chatMessageTimeOwn,
                          ]}>
                            {formatDate(message.createdAt)}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {/* Message Input */}
                <View style={styles.chatInputContainer}>
                  <TextInput
                    style={styles.chatInput}
                    value={newChatMessage}
                    onChangeText={setNewChatMessage}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[
                      styles.chatSendButton,
                      !newChatMessage.trim() && styles.chatSendButtonDisabled,
                    ]}
                    onPress={handleSendChatMessage}
                    disabled={!newChatMessage.trim()}
                  >
                    <Ionicons name="send" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <View style={styles.tabContent}>
            {membersLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : members.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={colors.mutedForeground} />
                <Text style={styles.emptyStateText}>No members yet</Text>
              </View>
            ) : (
              <>
                {community.isAdmin && (
                  <View style={styles.adminNotice}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <Text style={styles.adminNoticeText}>
                      Tap a member to manage their role
                    </Text>
                  </View>
                )}
                {members.map((member: any) => {
                  const memberData = member.user || member;
                  const isOwner = member.role === 'owner';
                  const canManage = community.isAdmin && !isOwner;

                  return (
                    <TouchableOpacity
                      key={member.id || memberData.id}
                      style={styles.memberCard}
                      onPress={() => {
                        if (canManage) {
                          setSelectedMember(member);
                          setShowModeratorModal(true);
                        }
                      }}
                      disabled={!canManage}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {memberData.displayName?.charAt(0).toUpperCase() ||
                           memberData.username?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          {memberData.displayName || memberData.username}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[
                            styles.memberRole,
                            isOwner && { color: '#10B981', fontWeight: '600' },
                            member.role === 'moderator' && { color: '#3B82F6', fontWeight: '600' },
                          ]}>
                            {member.role || 'member'}
                          </Text>
                          {isOwner && (
                            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                          )}
                        </View>
                      </View>
                      {canManage && (
                        <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* Prayer Requests Tab */}
        {activeTab === 'prayers' && (
          <View style={styles.tabContent}>
            {!canViewContent ? (
              <PrivateContentPlaceholder
                title="Private Prayer Requests"
                message="Join the community to share and pray for others."
                colors={colors}
              />
            ) : (
              <>
                {/* Create Prayer Request Section */}
                {community.isMember && (
                  <View style={styles.createPostSection}>
                    {!isPrayerInputVisible ? (
                      <TouchableOpacity
                        style={styles.createPostPrompt}
                        onPress={() => setIsPrayerInputVisible(true)}
                      >
                        <Ionicons name="heart" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.createPostPromptText}>
                          Share a prayer request...
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.createPostForm}>
                        <TextInput
                          style={styles.postInput}
                          value={newPrayerRequest}
                          onChangeText={setNewPrayerRequest}
                          placeholder="What can we pray for?"
                          placeholderTextColor={colors.mutedForeground}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          autoFocus
                        />
                        <View style={styles.postActions}>
                          <TouchableOpacity
                            style={styles.cancelPostButton}
                            onPress={() => {
                              setIsPrayerInputVisible(false);
                              setNewPrayerRequest('');
                            }}
                          >
                            <Text style={styles.cancelPostButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.submitPostButton}
                            onPress={() => {
                              if (newPrayerRequest.trim().length >= 10) {
                                // For now, just show success
                                Alert.alert('Success', 'Prayer request shared!');
                                setNewPrayerRequest('');
                                setIsPrayerInputVisible(false);
                              } else {
                                Alert.alert('Error', 'Prayer request must be at least 10 characters');
                              }
                            }}
                          >
                            <Text style={styles.submitPostButtonText}>Share</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.emptyState}>
                  <Ionicons name="heart-outline" size={64} color={colors.mutedForeground} />
                  <Text style={styles.emptyStateText}>No prayer requests yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    {community.isMember ? 'Be the first to share a prayer request' : 'Join to see prayer requests'}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Moderator Management Modal */}
      {showModeratorModal && selectedMember && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Member Role</Text>
              <TouchableOpacity onPress={() => {
                setShowModeratorModal(false);
                setSelectedMember(null);
              }}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.memberPreview}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(selectedMember.user?.displayName || selectedMember.user?.username || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.memberName}>
                  {selectedMember.user?.displayName || selectedMember.user?.username}
                </Text>
                <Text style={styles.memberRole}>
                  Current: {selectedMember.role || 'member'}
                </Text>
              </View>
            </View>

            <Text style={styles.modalSectionTitle}>Change Role</Text>

            <TouchableOpacity
              style={[
                styles.roleOption,
                selectedMember.role === 'moderator' && styles.roleOptionActive,
              ]}
              onPress={() => {
                Alert.alert(
                  'Promote to Moderator',
                  'This will give the user moderator permissions in the community.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Confirm',
                      onPress: () => updateRoleMutation.mutate({
                        userId: selectedMember.userId,
                        role: 'moderator'
                      }),
                    },
                  ]
                );
              }}
              disabled={selectedMember.role === 'moderator' || updateRoleMutation.isPending}
            >
              <Ionicons
                name="shield"
                size={24}
                color={selectedMember.role === 'moderator' ? '#3B82F6' : colors.mutedForeground}
              />
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.roleOptionTitle,
                  selectedMember.role === 'moderator' && { color: '#3B82F6', fontWeight: '600' },
                ]}>
                  Moderator
                </Text>
                <Text style={styles.roleOptionDescription}>
                  Can moderate content and manage members
                </Text>
              </View>
              {selectedMember.role === 'moderator' && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                selectedMember.role === 'member' && styles.roleOptionActive,
              ]}
              onPress={() => {
                if (selectedMember.role === 'moderator') {
                  Alert.alert(
                    'Remove Moderator',
                    'This will remove moderator permissions from the user.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm',
                        onPress: () => updateRoleMutation.mutate({
                          userId: selectedMember.userId,
                          role: 'member'
                        }),
                      },
                    ]
                  );
                }
              }}
              disabled={selectedMember.role === 'member' || updateRoleMutation.isPending}
            >
              <Ionicons
                name="person"
                size={24}
                color={selectedMember.role === 'member' ? colors.primary : colors.mutedForeground}
              />
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.roleOptionTitle,
                  selectedMember.role === 'member' && { color: colors.primary, fontWeight: '600' },
                ]}>
                  Member
                </Text>
                <Text style={styles.roleOptionDescription}>
                  Regular community member
                </Text>
              </View>
              {selectedMember.role === 'member' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            {updateRoleMutation.isPending && (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
            )}

            {/* Remove Member Button */}
            <TouchableOpacity
              style={styles.removeMemberButton}
              onPress={() => {
                Alert.alert(
                  'Remove Member',
                  `Are you sure you want to remove ${selectedMember.user?.displayName || selectedMember.user?.username} from the community?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => removeMemberMutation.mutate(selectedMember.userId),
                    },
                  ]
                );
              }}
              disabled={removeMemberMutation.isPending || updateRoleMutation.isPending}
            >
              <Ionicons name="person-remove" size={20} color="#EF4444" />
              <Text style={styles.removeMemberButtonText}>Remove Member</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// Tab Button Component
interface TabButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}

function TabButton({ icon, label, active, onPress, colors }: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: active ? colors.surface : 'transparent',
        borderBottomWidth: 2,
        borderBottomColor: active ? colors.primary : 'transparent',
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? colors.primary : colors.mutedForeground}
      />
      <Text
        style={{
          fontSize: 11,
          marginTop: 4,
          color: active ? colors.primary : colors.mutedForeground,
          fontWeight: active ? '600' : '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Private Content Placeholder Component
interface PrivateContentPlaceholderProps {
  title: string;
  message: string;
  colors: any;
}

function PrivateContentPlaceholder({ title, message, colors }: PrivateContentPlaceholderProps) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 32,
    }}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
      }}>
        <Ionicons name="lock-closed" size={40} color="#F59E0B" />
      </View>
      <Text style={{
        fontSize: 20,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 12,
        textAlign: 'center',
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: 15,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 22,
      }}>
        {message}
      </Text>
    </View>
  );
}

// Dynamic Styles
const getStyles = (colors: any, colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backIcon: {
    padding: 8,
    marginRight: 12,
    marginTop: -4,
  },
  headerContent: {
    flex: 1,
  },
  communityName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.mutedForeground,
    lineHeight: 21,
  },
  infoBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  privateLabel: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  adminLabel: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinedButton: {
    backgroundColor: '#10b981',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  createPostSection: {
    marginBottom: 16,
  },
  createPostPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createPostPromptText: {
    fontSize: 15,
    color: colors.mutedForeground,
  },
  createPostForm: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.foreground,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelPostButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelPostButtonText: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  submitPostButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitPostButtonDisabled: {
    opacity: 0.6,
  },
  submitPostButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postHeader: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  postTime: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 22,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  memberRole: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 21,
  },
  errorText: {
    fontSize: 18,
    color: colors.destructive,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  adminNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.muted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  adminNoticeText: {
    fontSize: 13,
    color: colors.mutedForeground,
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  memberPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleOptionActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  roleOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  roleOptionDescription: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  deleteButton: {
    padding: 8,
  },
  removeMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  removeMemberButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  createEventButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  chatMessages: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatMessagesContent: {
    padding: 16,
  },
  chatBubble: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  chatBubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  chatBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  chatSenderName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  chatMessageText: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 20,
  },
  chatMessageTextOwn: {
    color: '#fff',
  },
  chatMessageTime: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  chatMessageTimeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.foreground,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendButtonDisabled: {
    opacity: 0.5,
  },
});
