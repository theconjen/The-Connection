/**
 * Community Detail Screen
 * Shows community feed, events, chat, members, and prayer requests
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
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
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesAPI, chatAPI } from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Text } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import socketService, { ChatMessage } from '../../src/lib/socket';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Video, ResizeMode } from 'expo-av';

interface WallPost {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
  imageUrl?: string;
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
  iconColor?: string; // Community brand color
}

type TabType = 'feed' | 'events' | 'chat' | 'members' | 'prayers';

export default function CommunityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [showModeratorModal, setShowModeratorModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [newPrayerRequest, setNewPrayerRequest] = useState('');
  const [isPrayerInputVisible, setIsPrayerInputVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<any>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const [showAnsweredModal, setShowAnsweredModal] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<any>(null);
  const [answeredDescription, setAnsweredDescription] = useState('');

  const communityId = parseInt(id || '0');

  // Use community's brand color for accents, fallback to app primary
  const communityColor = community?.iconColor || colors.primary;
  const styles = getStyles(colors, colorScheme, communityColor);

  // Fetch community details
  const { data: community, isLoading: communityLoading, refetch: refetchCommunity } = useQuery<Community>({
    queryKey: ['community', communityId],
    queryFn: async () => {
      console.log(`[FRONTEND] Fetching community ${communityId}`);
      const result = await communitiesAPI.getById(communityId);
      console.log(`[FRONTEND] Community data:`, {
        id: result.id,
        name: result.name,
        isMember: result.isMember,
        role: result.role,
        isAdmin: result.isAdmin
      });
      return result;
    },
    enabled: !!communityId,
    staleTime: 0, // Always fetch fresh data to ensure membership status is current
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
  });

  // Refetch community data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (communityId) {
        refetchCommunity();
      }
    }, [communityId, refetchCommunity])
  );

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

  // Fetch prayer requests
  const { data: prayerRequests = [], isLoading: prayersLoading, refetch: refetchPrayers } = useQuery({
    queryKey: ['prayer-requests', communityId],
    queryFn: () => communitiesAPI.getPrayerRequests(communityId),
    enabled: !!communityId && activeTab === 'prayers' && !!community?.isMember,
  });

  // Fetch join requests (for private community admins)
  const isPrivateCommunity = community?.privacySetting === 'private' || community?.isPrivate;
  const canManageRequests = (community?.isAdmin || community?.isModerator) && isPrivateCommunity;
  const { data: joinRequests = [], isLoading: joinRequestsLoading, refetch: refetchJoinRequests } = useQuery({
    queryKey: ['join-requests', communityId],
    queryFn: async () => {
      try {
        return await communitiesAPI.getJoinRequests(communityId);
      } catch (error: any) {
        // Silently handle 403 - user is not admin/moderator
        if (error?.response?.status === 403) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!communityId && canManageRequests && activeTab === 'members',
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
    mutationFn: async () => {
      console.log(`[FRONTEND] Attempting to join community ${communityId}`);
      const result = await communitiesAPI.join(communityId);
      console.log(`[FRONTEND] Join response:`, result);
      return result;
    },
    onSuccess: async (data) => {
      console.log(`[FRONTEND] Join successful, data:`, data);
      // Invalidate and refetch to get the correct role from backend (owner if first member)
      await queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      await queryClient.invalidateQueries({ queryKey: ['communities'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/communities'] });

      // Refetch the community to get updated data with correct role
      const refetchResult = await queryClient.refetchQueries({ queryKey: ['community', communityId] });
      console.log(`[FRONTEND] Refetch result:`, refetchResult);

      Alert.alert('Success', 'You have joined the community!');
    },
    onError: async (error: any) => {
      console.log(`[FRONTEND] Join error:`, error.response?.data);
      // If already a member, refetch to get correct role
      if (error.response?.data?.message?.includes('Already a member')) {
        console.log(`[FRONTEND] Already a member, refetching community data`);
        // Refetch the community to get updated data with correct role
        await queryClient.invalidateQueries({ queryKey: ['community', communityId] });
        await queryClient.invalidateQueries({ queryKey: ['communities'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
        await queryClient.refetchQueries({ queryKey: ['community', communityId] });

        Alert.alert('Already joined', 'You are already a member!');
      } else {
        console.error(`[FRONTEND] Join failed:`, error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to join community');
      }
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => communitiesAPI.leave(communityId),
    onSuccess: () => {
      // Optimistically update the community cache immediately
      queryClient.setQueryData(['community', communityId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isMember: false,
          memberCount: Math.max((oldData.memberCount || 1) - 1, 0),
          role: null,
          isAdmin: false,
          isModerator: false,
        };
      });

      // Invalidate queries immediately (no delay)
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });

      Alert.alert('Success', 'You have left the community', [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)/communities'),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to leave community');
    },
  });

  // Create wall post mutation
  const createPostMutation = useMutation({
    mutationFn: ({ content, imageUrl }: { content: string; imageUrl?: string }) =>
      communitiesAPI.createWallPost(communityId, content, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-wall', communityId] });
      setSelectedMedia(null);
      setNewPostContent('');
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

  // Create prayer request mutation
  const createPrayerMutation = useMutation({
    mutationFn: (data: { title: string; content: string; isAnonymous?: boolean }) =>
      communitiesAPI.createPrayerRequest(communityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-requests', communityId] });
      setNewPrayerRequest('');
      setIsPrayerInputVisible(false);
      Alert.alert('Success', 'Prayer request shared!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create prayer request');
    },
  });

  // Mark prayer as answered mutation
  const markPrayerAnsweredMutation = useMutation({
    mutationFn: ({ prayerId, description }: { prayerId: number; description?: string }) =>
      communitiesAPI.markPrayerAnswered(communityId, prayerId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-requests', communityId] });
      setShowAnsweredModal(false);
      setSelectedPrayer(null);
      setAnsweredDescription('');
      Alert.alert('Success', 'Prayer marked as answered!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark prayer as answered');
    },
  });

  // Approve join request mutation
  const approveJoinRequestMutation = useMutation({
    mutationFn: (requestId: number) => communitiesAPI.approveJoinRequest(communityId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      Alert.alert('Success', 'Member approved!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to approve request');
    },
  });

  // Deny join request mutation
  const denyJoinRequestMutation = useMutation({
    mutationFn: (requestId: number) => communitiesAPI.denyJoinRequest(communityId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', communityId] });
      Alert.alert('Denied', 'Request has been denied');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to deny request');
    },
  });

  // Request to join mutation (for users wanting to join private communities)
  const requestToJoinMutation = useMutation({
    mutationFn: () => communitiesAPI.requestToJoin(communityId),
    onSuccess: () => {
      Alert.alert('Request Sent', 'Your request to join has been sent to the community admins.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send join request');
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
    } else if (isPrivateCommunity) {
      // For private communities, send a join request
      requestToJoinMutation.mutate();
    } else {
      // For public communities, join directly
      joinMutation.mutate();
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }

    if (newPostContent.trim().length < 5) {
      Alert.alert('Error', 'Post must be at least 5 characters long');
      return;
    }

    let imageUrl: string | undefined;

    // Convert selected media to base64 if present
    if (selectedMedia) {
      try {
        const base64 = await FileSystem.readAsStringAsync(selectedMedia.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const extension = selectedMedia.uri.split('.').pop()?.toLowerCase();
        let mimeType: string;
        if (selectedMedia.type === 'video') {
          mimeType = extension === 'mov' ? 'video/quicktime' : 'video/mp4';
        } else {
          mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
        }
        imageUrl = `data:${mimeType};base64,${base64}`;
      } catch (error) {
        console.error('Error reading media:', error);
        Alert.alert('Error', 'Failed to process media');
        return;
      }
    }

    createPostMutation.mutate({ content: newPostContent.trim(), imageUrl });
  };

  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60, // 60 second max for videos
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        setSelectedMedia({ uri: asset.uri, type: isVideo ? 'video' : 'image' });
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia({ uri: result.assets[0].uri, type: 'image' });
      }
    } catch (error: any) {
      // Camera not available on simulator
      if (error?.message?.includes('Camera not available')) {
        Alert.alert('Camera Unavailable', 'Camera is not available on the simulator. Use a physical device or pick from library.');
      } else {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'Failed to take photo');
      }
    }
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/communities')}>
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
        <TouchableOpacity style={styles.backIcon} onPress={() => router.push('/(tabs)/communities')}>
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
              onPress={() => router.push(`/communities/settings/${community.id}`)}
            >
              <Ionicons name="settings-outline" size={20} color={communityColor} />
            </TouchableOpacity>
          )}
          {!community.isAdmin && (
            <TouchableOpacity
              style={[
                styles.joinButton,
                community.isMember && styles.joinedButton,
                isPrivate && !community.isMember && styles.requestButton,
              ]}
              onPress={handleJoinLeave}
              disabled={joinMutation.isPending || leaveMutation.isPending || requestToJoinMutation.isPending}
            >
              {joinMutation.isPending || leaveMutation.isPending || requestToJoinMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={community.isMember ? "checkmark" : isPrivate ? "lock-closed" : "person-add"}
                    size={18}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.joinButtonText}>
                    {community.isMember ? 'Joined' : isPrivate ? 'Request' : 'Join'}
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
          accentColor={communityColor}
        />
        <TabButton
          icon="calendar"
          label="Events"
          active={activeTab === 'events'}
          onPress={() => setActiveTab('events')}
          colors={colors}
          accentColor={communityColor}
        />
        <TabButton
          icon="chatbubbles"
          label="Chat"
          active={activeTab === 'chat'}
          onPress={() => setActiveTab('chat')}
          colors={colors}
          accentColor={communityColor}
        />
        <TabButton
          icon="people"
          label="Members"
          active={activeTab === 'members'}
          onPress={() => setActiveTab('members')}
          colors={colors}
          accentColor={communityColor}
        />
        <TabButton
          icon="heart"
          label="Prayers"
          active={activeTab === 'prayers'}
          onPress={() => setActiveTab('prayers')}
          colors={colors}
          accentColor={communityColor}
        />
      </View>

      {/* Content */}
      {activeTab !== 'chat' ? (
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
                {/* Twitter-Style Post Composer */}
                {community.isMember && (
                  <View style={styles.twitterComposer}>
                    <View style={styles.composerRow}>
                      <View style={styles.composerAvatar}>
                        {(user?.profileImageUrl || user?.avatarUrl) ? (
                          <Image
                            source={{ uri: user.profileImageUrl || user.avatarUrl }}
                            style={styles.composerAvatarImage}
                          />
                        ) : (
                          <Text style={styles.composerAvatarText}>
                            {user?.displayName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                          </Text>
                        )}
                      </View>
                      <View style={styles.composerInputContainer}>
                        <TextInput
                          style={styles.composerInput}
                          value={newPostContent}
                          onChangeText={setNewPostContent}
                          placeholder="Share with the community..."
                          placeholderTextColor={colors.mutedForeground}
                          multiline
                          maxLength={280}
                          textAlignVertical="top"
                        />
                      </View>
                    </View>

                    {/* Media Preview */}
                    {selectedMedia && (
                      <View style={styles.imagePreviewContainer}>
                        {selectedMedia.type === 'video' ? (
                          <Video
                            source={{ uri: selectedMedia.uri }}
                            style={styles.imagePreview}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                            isLooping={false}
                            useNativeControls
                          />
                        ) : (
                          <Image source={{ uri: selectedMedia.uri }} style={styles.imagePreview} />
                        )}
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => setSelectedMedia(null)}
                        >
                          <Ionicons name="close-circle" size={24} color="#fff" />
                        </TouchableOpacity>
                        {selectedMedia.type === 'video' && (
                          <View style={styles.videoIndicator}>
                            <Ionicons name="videocam" size={16} color="#fff" />
                          </View>
                        )}
                      </View>
                    )}

                    <View style={styles.composerFooter}>
                      {/* Media Buttons */}
                      <View style={styles.mediaButtons}>
                        <TouchableOpacity
                          style={styles.mediaButton}
                          onPress={handlePickMedia}
                          disabled={createPostMutation.isPending}
                        >
                          <Ionicons name="images-outline" size={22} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.mediaButton}
                          onPress={handleTakePhoto}
                          disabled={createPostMutation.isPending}
                        >
                          <Ionicons name="camera-outline" size={22} color={colors.primary} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.charCountContainer}>
                        <Text style={[
                          styles.charCount,
                          newPostContent.length > 260 && styles.charCountWarning,
                          newPostContent.length === 280 && styles.charCountError
                        ]}>
                          {newPostContent.length}/280
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.composerButton,
                          (!newPostContent.trim() || createPostMutation.isPending) && styles.composerButtonDisabled
                        ]}
                        onPress={handleCreatePost}
                        disabled={!newPostContent.trim() || createPostMutation.isPending}
                      >
                        {createPostMutation.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.composerButtonText}>Post</Text>
                        )}
                      </TouchableOpacity>
                    </View>
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
                              {post.authorAvatar ? (
                                <Image
                                  source={{ uri: post.authorAvatar }}
                                  style={styles.avatarImage}
                                />
                              ) : (
                                <Text style={styles.avatarText}>
                                  {post.authorName?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                              )}
                            </View>
                            <View style={{ flex: 1 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  if (post.authorId) {
                                    router.push(`/(tabs)/profile?userId=${post.authorId}`);
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
                        {post.imageUrl && (
                          post.imageUrl.includes('video') ? (
                            <Video
                              source={{ uri: post.imageUrl }}
                              style={styles.postImage}
                              resizeMode={ResizeMode.COVER}
                              shouldPlay={false}
                              isLooping={false}
                              useNativeControls
                            />
                          ) : (
                            <Image
                              source={{ uri: post.imageUrl }}
                              style={styles.postImage}
                              resizeMode="cover"
                            />
                          )
                        )}
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
                {/* Create Event Button (Admins Only) */}
                {community.isAdmin && (
                  <TouchableOpacity
                    style={styles.createEventButton}
                    onPress={() => router.push(`/events/create?communityId=${communityId}`)}
                  >
                    <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.createEventButtonText}>Create Event</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={64} color={colors.mutedForeground} />
                  <Text style={styles.emptyStateText}>No events scheduled</Text>
                  <Text style={styles.emptyStateSubtext}>
                    {community.isMember ? 'Create your first event' : 'Check back later for upcoming events'}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <View style={styles.tabContent}>
            {/* Pending Join Requests Section (for private community admins) */}
            {canManageRequests && (
              <View style={styles.joinRequestsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person-add-outline" size={20} color={communityColor} />
                  <Text style={styles.sectionTitle}>Pending Requests</Text>
                  {joinRequests.length > 0 && (
                    <View style={styles.requestCountBadge}>
                      <Text style={styles.requestCountText}>{joinRequests.length}</Text>
                    </View>
                  )}
                </View>

                {joinRequestsLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                ) : joinRequests.length === 0 ? (
                  <View style={styles.noRequestsContainer}>
                    <Ionicons name="checkmark-circle-outline" size={24} color={colors.mutedForeground} />
                    <Text style={styles.noRequestsText}>No pending requests</Text>
                  </View>
                ) : (
                  joinRequests.map((request: any) => {
                    const userData = request.user || request;
                    return (
                      <View key={request.id} style={styles.joinRequestCard}>
                        <View style={styles.avatar}>
                          {(userData.profileImageUrl || userData.avatarUrl) ? (
                            <Image
                              source={{ uri: userData.profileImageUrl || userData.avatarUrl }}
                              style={styles.avatarImage}
                            />
                          ) : (
                            <Text style={styles.avatarText}>
                              {(userData.displayName || userData.username || 'U').charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={styles.requestInfo}>
                          <Text style={styles.memberName}>
                            {userData.displayName || userData.username}
                          </Text>
                          <Text style={styles.requestTime}>
                            Requested {formatDate(request.createdAt || request.requestedAt)}
                          </Text>
                        </View>
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={styles.approveButton}
                            onPress={() => approveJoinRequestMutation.mutate(request.id)}
                            disabled={approveJoinRequestMutation.isPending || denyJoinRequestMutation.isPending}
                          >
                            <Ionicons name="checkmark" size={20} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.denyButton}
                            onPress={() => {
                              Alert.alert(
                                'Deny Request',
                                `Are you sure you want to deny ${userData.displayName || userData.username}'s request?`,
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Deny',
                                    style: 'destructive',
                                    onPress: () => denyJoinRequestMutation.mutate(request.id),
                                  },
                                ]
                              );
                            }}
                            disabled={approveJoinRequestMutation.isPending || denyJoinRequestMutation.isPending}
                          >
                            <Ionicons name="close" size={20} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

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
                    <Ionicons name="information-circle" size={20} color={communityColor} />
                    <Text style={styles.adminNoticeText}>
                      Tap a member to manage their role
                    </Text>
                  </View>
                )}

                {/* Leave Community Button for non-admin members */}
                {!community.isAdmin && community.isMember && (
                  <TouchableOpacity
                    style={styles.leaveCommunityButton}
                    onPress={() => {
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
                    }}
                    disabled={leaveMutation.isPending}
                  >
                    {leaveMutation.isPending ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <>
                        <Ionicons name="exit-outline" size={20} color="#EF4444" />
                        <Text style={styles.leaveCommunityButtonText}>Leave Community</Text>
                      </>
                    )}
                  </TouchableOpacity>
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
                        {(memberData.profileImageUrl || memberData.avatarUrl) ? (
                          <Image
                            source={{ uri: memberData.profileImageUrl || memberData.avatarUrl }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={styles.avatarText}>
                            {memberData.displayName?.charAt(0).toUpperCase() ||
                             memberData.username?.charAt(0).toUpperCase() || 'U'}
                          </Text>
                        )}
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
                            {isOwner ? 'Creator' : member.role || 'member'}
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
                        <Ionicons name="heart" size={20} color={communityColor} style={{ marginRight: 8 }} />
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
                              if (newPrayerRequest.trim().length < 10) {
                                Alert.alert('Error', 'Prayer request must be at least 10 characters');
                                return;
                              }
                              createPrayerMutation.mutate({
                                title: 'Prayer Request',
                                content: newPrayerRequest.trim(),
                              });
                            }}
                            disabled={createPrayerMutation.isPending}
                          >
                            {createPrayerMutation.isPending ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.submitPostButtonText}>Share</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Prayer Requests List */}
                {prayersLoading ? (
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : prayerRequests.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={64} color={colors.mutedForeground} />
                    <Text style={styles.emptyStateText}>No prayer requests yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                      {community.isMember ? 'Be the first to share a prayer request' : 'Join to see prayer requests'}
                    </Text>
                  </View>
                ) : (
                  prayerRequests.map((prayer: any) => {
                    const isAuthor = prayer.authorId === user?.id;
                    return (
                      <View key={prayer.id} style={styles.prayerCard}>
                        <View style={styles.prayerHeader}>
                          <View style={styles.authorInfo}>
                            <View style={styles.avatar}>
                              {!prayer.isAnonymous && prayer.authorAvatar ? (
                                <Image
                                  source={{ uri: prayer.authorAvatar }}
                                  style={styles.avatarImage}
                                />
                              ) : (
                                <Text style={styles.avatarText}>
                                  {prayer.isAnonymous ? '?' : (prayer.authorName?.charAt(0).toUpperCase() || 'U')}
                                </Text>
                              )}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.authorName}>
                                {prayer.isAnonymous ? 'Anonymous' : `@${prayer.authorName}`}
                              </Text>
                              <Text style={styles.postTime}>{formatDate(prayer.createdAt)}</Text>
                            </View>
                          </View>
                          {prayer.isAnswered && (
                            <View style={styles.answeredBadge}>
                              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                              <Text style={styles.answeredBadgeText}>Answered</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.prayerContent}>{prayer.content}</Text>

                        {prayer.isAnswered && prayer.answeredDescription && (
                          <View style={styles.answeredSection}>
                            <Ionicons name="sparkles" size={16} color="#10B981" style={{ marginRight: 6 }} />
                            <Text style={styles.answeredDescription}>{prayer.answeredDescription}</Text>
                          </View>
                        )}

                        {/* Answered Button - Only for author and unanswered prayers */}
                        {isAuthor && !prayer.isAnswered && (
                          <TouchableOpacity
                            style={styles.answeredButton}
                            onPress={() => {
                              setSelectedPrayer(prayer);
                              setShowAnsweredModal(true);
                            }}
                          >
                            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                            <Text style={styles.answeredButtonText}>Mark as Answered</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
      ) : (
        /* Chat Tab - Outside ScrollView for proper keyboard handling */
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
                                router.push(`/(tabs)/profile?userId=${message.sender.id}`);
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
              <View style={[styles.chatInputContainer, { paddingBottom: 12 + insets.bottom }]}>
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
                {(selectedMember.user?.profileImageUrl || selectedMember.user?.avatarUrl) ? (
                  <Image
                    source={{ uri: selectedMember.user.profileImageUrl || selectedMember.user.avatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {(selectedMember.user?.displayName || selectedMember.user?.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
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

      {/* Answered Prayer Modal */}
      {showAnsweredModal && selectedPrayer && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Prayer as Answered</Text>
              <TouchableOpacity onPress={() => {
                setShowAnsweredModal(false);
                setSelectedPrayer(null);
                setAnsweredDescription('');
              }}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Share how God answered this prayer (optional):
            </Text>

            <TextInput
              style={styles.answeredInput}
              value={answeredDescription}
              onChangeText={setAnsweredDescription}
              placeholder="E.g., 'God provided a new job!' or 'Healing was granted!'"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAnsweredModal(false);
                  setSelectedPrayer(null);
                  setAnsweredDescription('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => {
                  markPrayerAnsweredMutation.mutate({
                    prayerId: selectedPrayer.id,
                    description: answeredDescription.trim() || undefined,
                  });
                }}
                disabled={markPrayerAnsweredMutation.isPending}
              >
                {markPrayerAnsweredMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.modalConfirmButtonText}>Mark Answered</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  accentColor: string; // Community brand color
}

function TabButton({ icon, label, active, onPress, colors, accentColor }: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: active ? colors.surface : 'transparent',
        borderBottomWidth: 2,
        borderBottomColor: active ? accentColor : 'transparent',
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? accentColor : colors.mutedForeground}
      />
      <Text
        style={{
          fontSize: 11,
          marginTop: 4,
          color: active ? accentColor : colors.mutedForeground,
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
        backgroundColor: colors.surfaceMuted,
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
const getStyles = (colors: any, colorScheme: 'light' | 'dark', communityColor: string = colors.primary) => StyleSheet.create({
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    backgroundColor: communityColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinedButton: {
    backgroundColor: '#10b981',
  },
  requestButton: {
    backgroundColor: '#F59E0B',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  // Twitter-Style Composer
  twitterComposer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
    marginBottom: 16,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  composerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: communityColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  composerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  composerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  composerInputContainer: {
    flex: 1,
  },
  composerInput: {
    fontSize: 15,
    color: colors.foreground,
    minHeight: 60,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 52, // Align with input text (40px avatar + 12px gap)
    gap: 12,
  },
  charCountContainer: {
    flex: 1,
  },
  charCount: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  charCountWarning: {
    color: '#F59E0B',
  },
  charCountError: {
    color: '#EF4444',
    fontWeight: '600',
  },
  composerButton: {
    backgroundColor: '#1D9BF0',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  composerButtonDisabled: {
    backgroundColor: '#8ED0F9',
    opacity: 0.5,
  },
  composerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  mediaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaButton: {
    padding: 8,
    borderRadius: 20,
  },
  imagePreviewContainer: {
    marginLeft: 52,
    marginBottom: 12,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: colors.surfaceMuted,
  },
  postCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    backgroundColor: communityColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  adminNoticeText: {
    fontSize: 13,
    color: colors.mutedForeground,
    flex: 1,
  },
  leaveCommunityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  leaveCommunityButtonText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '600',
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
    backgroundColor: colors.surface,
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
    borderColor: colors.borderSubtle,
  },
  roleOptionActive: {
    borderColor: communityColor,
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
    backgroundColor: communityColor,
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
    backgroundColor: communityColor,
    borderBottomRightRadius: 4,
  },
  chatBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  chatSenderName: {
    fontSize: 13,
    fontWeight: '600',
    color: communityColor,
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
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
    borderColor: colors.borderSubtle,
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: communityColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendButtonDisabled: {
    opacity: 0.5,
  },
  // Prayer Request Styles
  prayerCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  prayerContent: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 22,
    marginBottom: 12,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  answeredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  answeredSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  answeredDescription: {
    fontSize: 14,
    color: '#166534',
    fontStyle: 'italic',
    lineHeight: 20,
    flex: 1,
  },
  answeredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  answeredButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  // Modal Styles
  modalDescription: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 16,
    lineHeight: 20,
  },
  answeredInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.foreground,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  modalConfirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Create post section styles
  createPostSection: {
    marginBottom: 16,
  },
  createPostPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  createPostPromptText: {
    fontSize: 15,
    color: colors.mutedForeground,
  },
  createPostForm: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  postInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.foreground,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelPostButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  cancelPostButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  submitPostButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: communityColor,
    minWidth: 80,
    alignItems: 'center',
  },
  submitPostButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Join Requests Section Styles
  joinRequestsSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: communityColor + '40',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  requestCountBadge: {
    backgroundColor: communityColor,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  requestCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  noRequestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  noRequestsText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  joinRequestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestTime: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  denyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
