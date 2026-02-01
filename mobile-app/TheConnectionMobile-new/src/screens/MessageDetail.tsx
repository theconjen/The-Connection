import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Pressable,
  Image,
  TextInput,
  Alert,
  ActionSheetIOS,
  Modal,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Avatar } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { useConversationMessages, useSendMessage, useMarkAsRead } from '../queries/messages';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import apiClient, { communitiesAPI, eventsAPI } from '../lib/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

// ============================================================================
// INVITATION MESSAGE TYPES
// ============================================================================

interface CommunityInviteData {
  type: 'community_invite';
  communityId: number;
  communityName: string;
  inviterName: string;
  invitationId: number;
}

interface EventInviteData {
  type: 'event_invite';
  eventId: number;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  inviterName: string;
  invitationId: number;
}

type InviteData = CommunityInviteData | EventInviteData;

function parseInvitationMessage(content: string): InviteData | null {
  if (!content.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === 'community_invite' || parsed.type === 'event_invite') {
      return parsed as InviteData;
    }
  } catch {
    // Not valid JSON
  }
  return null;
}

// ============================================================================
// TYPES
// ============================================================================

interface MessageDetailProps {
  onBack: () => void;
  conversationId: number;
  otherUser?: {
    id: number;
    name: string;
    username?: string;
    avatar?: string;
  };
  onNavigateToProfile?: (userId: number) => void;
}

interface MessageItem {
  id: number | string;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  type?: 'text' | 'gif' | 'image';
  gifUrl?: string;
  imageUrl?: string;
  sender?: {
    id: number;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
  };
  receiver?: {
    id: number;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
  };
}

// ============================================================================
// CHAT HEADER COMPONENT
// ============================================================================

interface ChatHeaderProps {
  otherUser: {
    id: number;
    name: string;
    username?: string;
    avatar?: string;
  } | null;
  onBack: () => void;
  onProfilePress: () => void;
  onMenuPress: () => void;
  colors: any;
}

function ChatHeader({ otherUser, onBack, onProfilePress, onMenuPress, colors }: ChatHeaderProps) {
  const displayName = otherUser?.name || 'Chat';
  const username = otherUser?.username;
  const avatarUrl = otherUser?.avatar;

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderSubtle }]}>
      {/* Back Button */}
      <Pressable
        onPress={onBack}
        style={styles.headerBackButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={28} color={colors.primary} />
      </Pressable>

      {/* Center: Avatar + Name (Pressable to open profile) */}
      <Pressable
        style={styles.headerCenter}
        onPress={onProfilePress}
        disabled={!otherUser}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatarFallback, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.headerAvatarInitial, { color: colors.textPrimary }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerName, { color: colors.textPrimary }]} numberOfLines={1}>
            {displayName}
          </Text>
          {username && (
            <Text style={[styles.headerUsername, { color: colors.textMuted }]} numberOfLines={1}>
              @{username}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Right: Menu Button */}
      <Pressable
        onPress={onMenuPress}
        style={styles.headerMenuButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

// ============================================================================
// INVITATION MESSAGE CARD COMPONENT
// ============================================================================

interface InvitationCardProps {
  inviteData: InviteData;
  isMe: boolean;
  colors: any;
  messageTime: string;
}

function InvitationMessageCard({ inviteData, isMe, colors, messageTime }: InvitationCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');

  const acceptCommunityMutation = useMutation({
    mutationFn: (invitationId: number) => communitiesAPI.acceptInvitation(invitationId),
    onSuccess: () => {
      setStatus('accepted');
      queryClient.invalidateQueries({ queryKey: ['community-invitations-pending'] });
      queryClient.invalidateQueries({ queryKey: ['user-communities'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    },
  });

  const declineCommunityMutation = useMutation({
    mutationFn: (invitationId: number) => communitiesAPI.declineInvitation(invitationId),
    onSuccess: () => {
      setStatus('declined');
      queryClient.invalidateQueries({ queryKey: ['community-invitations-pending'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to decline invitation');
    },
  });

  const acceptEventMutation = useMutation({
    mutationFn: (invitationId: number) => eventsAPI.acceptInvitation(invitationId),
    onSuccess: () => {
      setStatus('accepted');
      queryClient.invalidateQueries({ queryKey: ['event-invitations-pending'] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    },
  });

  const declineEventMutation = useMutation({
    mutationFn: (invitationId: number) => eventsAPI.declineInvitation(invitationId),
    onSuccess: () => {
      setStatus('declined');
      queryClient.invalidateQueries({ queryKey: ['event-invitations-pending'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to decline invitation');
    },
  });

  const isCommunityInvite = inviteData.type === 'community_invite';
  const isProcessing = acceptCommunityMutation.isPending || declineCommunityMutation.isPending ||
                       acceptEventMutation.isPending || declineEventMutation.isPending;

  const handleAccept = () => {
    if (isCommunityInvite) {
      acceptCommunityMutation.mutate((inviteData as CommunityInviteData).invitationId);
    } else {
      acceptEventMutation.mutate((inviteData as EventInviteData).invitationId);
    }
  };

  const handleDecline = () => {
    if (isCommunityInvite) {
      declineCommunityMutation.mutate((inviteData as CommunityInviteData).invitationId);
    } else {
      declineEventMutation.mutate((inviteData as EventInviteData).invitationId);
    }
  };

  const handleCardPress = () => {
    if (isCommunityInvite) {
      router.push(`/communities/${(inviteData as CommunityInviteData).communityId}`);
    } else {
      router.push(`/events/${(inviteData as EventInviteData).eventId}`);
    }
  };

  return (
    <View style={[
      styles.messageRow,
      isMe ? styles.messageRowRight : styles.messageRowLeft
    ]}>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        maxWidth: '85%',
        minWidth: 220,
      }}>
        <Pressable onPress={handleCardPress}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isCommunityInvite ? colors.primary : colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons
                name={isCommunityInvite ? 'people' : 'calendar'}
                size={18}
                color="#fff"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', fontWeight: '600' }}>
                {isCommunityInvite ? 'Community Invitation' : 'Event Invitation'}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={2}>
                {isCommunityInvite
                  ? (inviteData as CommunityInviteData).communityName
                  : (inviteData as EventInviteData).eventName
                }
              </Text>
            </View>
          </View>

          {/* Event Details */}
          {!isCommunityInvite && (
            <View style={{ marginBottom: 8 }}>
              {(inviteData as EventInviteData).eventDate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4 }}>
                    {new Date((inviteData as EventInviteData).eventDate).toLocaleDateString()}
                    {(inviteData as EventInviteData).eventTime && ` at ${(inviteData as EventInviteData).eventTime}`}
                  </Text>
                </View>
              )}
              {(inviteData as EventInviteData).location && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4 }} numberOfLines={1}>
                    {(inviteData as EventInviteData).location}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Pressable>

        {/* Action Buttons - Only show if not sender and pending */}
        {!isMe && status === 'pending' && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={handleAccept}
              disabled={isProcessing}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                paddingVertical: 8,
                borderRadius: 8,
                opacity: isProcessing ? 0.6 : 1,
              }}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 4, fontSize: 13 }}>
                    {isCommunityInvite ? 'Join' : 'Accept'}
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={handleDecline}
              disabled={isProcessing}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.textMuted,
                paddingVertical: 8,
                borderRadius: 8,
                opacity: isProcessing ? 0.6 : 1,
              }}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontWeight: '600', marginLeft: 4, fontSize: 13 }}>
                Decline
              </Text>
            </Pressable>
          </View>
        )}

        {/* Status indicator */}
        {status !== 'pending' && (
          <View style={{
            marginTop: 8,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: status === 'accepted' ? colors.successMuted : colors.errorMuted,
            alignItems: 'center',
          }}>
            <Text style={{
              color: status === 'accepted' ? colors.success : colors.error,
              fontWeight: '600',
              fontSize: 13,
            }}>
              {status === 'accepted' ? 'Accepted' : 'Declined'}
            </Text>
          </View>
        )}

        {/* Time */}
        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6, alignSelf: 'flex-end' }}>
          {messageTime}
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

interface MessageBubbleProps {
  message: MessageItem;
  isMe: boolean;
  otherUserAvatar?: string;
  otherUserName?: string;
  colors: any;
  radii: any;
  onLongPress: () => void;
  onDoubleTap: () => void;
  hasReaction?: boolean;
}

function MessageBubble({ message, isMe, otherUserAvatar, otherUserName, colors, radii, onLongPress, onDoubleTap, hasReaction }: MessageBubbleProps) {
  const lastTapRef = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 300; // ms

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      onDoubleTap();
      lastTapRef.current = 0; // Reset to prevent triple-tap
    } else {
      lastTapRef.current = now;
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  // Helper to detect media type from URL content
  const detectMediaUrl = (content: string): { type: 'gif' | 'image' | 'video' | null; url: string | null } => {
    if (!content) return { type: null, url: null };
    const trimmed = content.trim();

    // Must be a valid URL (starts with http/https and contains no spaces except at boundaries)
    if (!/^https?:\/\/[^\s]+$/i.test(trimmed)) {
      return { type: null, url: null };
    }

    // GIF patterns
    const gifPatterns = [
      /\.gif(\?[^\s]*)?$/i,
      /\.gifv(\?[^\s]*)?$/i,
      /media\.tenor\.com\//i,
      /giphy\.com\//i,
    ];

    for (const pattern of gifPatterns) {
      if (pattern.test(trimmed)) {
        return { type: 'gif', url: trimmed };
      }
    }

    // Image patterns (common image extensions and cloud storage)
    const imagePatterns = [
      /\.(jpg|jpeg|png|webp|bmp|heic|heif)(\?[^\s]*)?$/i,
      /storage\.googleapis\.com\/[^\s]+\.(jpg|jpeg|png|webp|gif)(\?[^\s]*)?/i,
      /s3[\w-]*\.amazonaws\.com\/[^\s]+\.(jpg|jpeg|png|webp|gif)(\?[^\s]*)?/i,
      /cloudinary\.com\/[^\s]+\.(jpg|jpeg|png|webp|gif)(\?[^\s]*)?/i,
      /imgur\.com\/[^\s]+\.(jpg|jpeg|png|webp)(\?[^\s]*)?/i,
    ];

    for (const pattern of imagePatterns) {
      if (pattern.test(trimmed)) {
        return { type: 'image', url: trimmed };
      }
    }

    // Video patterns
    const videoPatterns = [
      /\.(mp4|mov|webm|m4v|avi|mkv)(\?[^\s]*)?$/i,
      /storage\.googleapis\.com\/[^\s]+\.(mp4|mov|webm)(\?[^\s]*)?/i,
      /s3[\w-]*\.amazonaws\.com\/[^\s]+\.(mp4|mov|webm)(\?[^\s]*)?/i,
    ];

    for (const pattern of videoPatterns) {
      if (pattern.test(trimmed)) {
        return { type: 'video', url: trimmed };
      }
    }

    return { type: null, url: null };
  };

  // Check for invitation message first
  const inviteData = parseInvitationMessage(message.content);
  if (inviteData) {
    return (
      <InvitationMessageCard
        inviteData={inviteData}
        isMe={isMe}
        colors={colors}
        messageTime={formatMessageTime(message.createdAt)}
      />
    );
  }

  // Detect media from content URL
  const detectedMedia = detectMediaUrl(message.content);

  // Check for GIF in message type or detect from content URL
  const isGif = (message.type === 'gif' && message.gifUrl) || detectedMedia.type === 'gif';
  const gifUrl = message.gifUrl || (detectedMedia.type === 'gif' ? detectedMedia.url : null);

  // Check for image in message type or detect from content URL
  const isImage = (message.type === 'image' && message.imageUrl) || detectedMedia.type === 'image';
  const imageUrl = message.imageUrl || (detectedMedia.type === 'image' ? detectedMedia.url : null);

  // Check for video in message type or detect from content URL
  const isVideo = message.type === 'video' || detectedMedia.type === 'video';
  const videoUrl = (message as any).videoUrl || (detectedMedia.type === 'video' ? detectedMedia.url : null);

  return (
    <View style={[
      styles.messageRow,
      isMe ? styles.messageRowRight : styles.messageRowLeft
    ]}>
      {/* Other user's avatar */}
      {!isMe && (
        <View style={styles.avatarContainer}>
          {otherUserAvatar ? (
            <Image source={{ uri: otherUserAvatar }} style={styles.messageAvatar} />
          ) : (
            <View style={[styles.messageAvatarFallback, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.messageAvatarInitial, { color: colors.textMuted }]}>
                {(otherUserName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.bubbleWrapper}>
        <Pressable
          onPress={handlePress}
          onLongPress={onLongPress}
          style={[
            styles.bubble,
            isMe ? styles.bubbleRight : styles.bubbleLeft,
            {
              backgroundColor: isMe ? colors.primary : colors.surfaceMuted,
              borderRadius: radii.lg,
              borderBottomRightRadius: isMe ? radii.xs : radii.lg,
              borderBottomLeftRadius: isMe ? radii.lg : radii.xs,
            }
          ]}
        >
          {isGif && gifUrl ? (
            <Image
              source={{ uri: gifUrl }}
              style={styles.gifImage}
              resizeMode="contain"
            />
          ) : isImage && imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : isVideo && videoUrl ? (
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: videoUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              <View style={styles.videoPlayOverlay}>
                <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          ) : (
            <Text style={{ color: isMe ? colors.primaryForeground : colors.textPrimary, fontSize: 15 }}>
              {message.content}
            </Text>
          )}
          <Text style={[
            styles.messageTime,
            { color: isMe ? colors.textMuted : colors.textMuted }
          ]}>
            {formatMessageTime(message.createdAt)}
          </Text>
        </Pressable>
        {/* Heart reaction indicator */}
        {hasReaction && (
          <View style={[
            styles.heartIndicator,
            isMe ? styles.heartIndicatorRight : styles.heartIndicatorLeft,
          ]}>
            <Ionicons name="heart" size={16} color={colors.error || '#E53935'} />
          </View>
        )}
      </View>

      {/* Spacer for my messages (no avatar on right) */}
      {isMe && <View style={styles.avatarSpacer} />}
    </View>
  );
}

// ============================================================================
// COMPOSER COMPONENT
// ============================================================================

interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onGifPress: () => void;
  isSending: boolean;
  colors: any;
}

function Composer({ value, onChangeText, onSend, onGifPress, isSending, colors }: ComposerProps) {
  return (
    <View style={[styles.composer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
      {/* GIF Button */}
      <Pressable
        onPress={onGifPress}
        style={styles.composerButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="happy-outline" size={24} color={colors.textMuted} />
      </Pressable>

      {/* Text Input */}
      <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderRadius: 20 }]}>
        <TextInput
          style={[styles.textInput, { color: colors.textPrimary }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={2000}
        />
      </View>

      {/* Send Button */}
      <Pressable
        onPress={onSend}
        disabled={!value.trim() || isSending}
        style={[
          styles.sendButton,
          { backgroundColor: value.trim() ? colors.primary : colors.surfaceMuted }
        ]}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Ionicons
            name="send"
            size={20}
            color={value.trim() ? colors.primaryForeground : colors.textMuted}
          />
        )}
      </Pressable>
    </View>
  );
}

// ============================================================================
// SETTINGS MENU MODAL
// ============================================================================

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
  onMute: () => void;
  onBlock: () => void;
  onReport: () => void;
  isMuted: boolean;
  colors: any;
}

function SettingsMenu({ visible, onClose, onMute, onBlock, onReport, isMuted, colors }: SettingsMenuProps) {
  if (Platform.OS === 'ios') {
    // Use ActionSheetIOS on iOS
    useEffect(() => {
      if (visible) {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', isMuted ? 'Unmute Conversation' : 'Mute Conversation', 'Block User', 'Report User'],
            destructiveButtonIndex: 2,
            cancelButtonIndex: 0,
          },
          (buttonIndex) => {
            onClose();
            if (buttonIndex === 1) onMute();
            else if (buttonIndex === 2) onBlock();
            else if (buttonIndex === 3) onReport();
          }
        );
      }
    }, [visible]);
    return null;
  }

  // Android: Use modal
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <View style={[styles.menuContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onMute(); }}>
            <Ionicons name={isMuted ? 'notifications' : 'notifications-off'} size={22} color={colors.textPrimary} />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
              {isMuted ? 'Unmute Conversation' : 'Mute Conversation'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onBlock(); }}>
            <Ionicons name="ban" size={22} color={colors.error} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>Block User</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onReport(); }}>
            <Ionicons name="flag" size={22} color={colors.error} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>Report User</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemCancel]} onPress={onClose}>
            <Text style={[styles.menuItemText, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// GIF PICKER MODAL (Placeholder - will implement full version)
// ============================================================================

interface GifPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
  colors: any;
}

function GifPicker({ visible, onClose, onSelectGif, colors }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tenor API key (Google's GIF service - more reliable than Giphy public key)
  const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'; // Public/demo key

  const searchGifs = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = query.trim()
        ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=30&media_filter=gif`
        : `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=30&media_filter=gif`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.results) {
        setGifs(data.results);
      } else {
        setGifs([]);
      }
    } catch (err) {
      console.error('Error loading GIFs:', err);
      setError('Failed to load GIFs. Please try again.');
      setGifs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      searchGifs('');
    }
  }, [visible, searchGifs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (visible) {
        searchGifs(searchQuery);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, visible, searchGifs]);

  // Get the best GIF URL from Tenor's media formats
  const getGifUrl = (item: any, size: 'small' | 'full' = 'small') => {
    try {
      const formats = item.media_formats;
      if (size === 'small') {
        return formats.tinygif?.url || formats.nanogif?.url || formats.gif?.url;
      }
      return formats.gif?.url || formats.mediumgif?.url || formats.tinygif?.url;
    } catch {
      return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.gifPickerContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.gifPickerHeader, { borderBottomColor: colors.borderSubtle }]}>
          <Text style={[styles.gifPickerTitle, { color: colors.textPrimary }]}>Choose a GIF</Text>
          <Pressable onPress={onClose} style={styles.gifPickerClose}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={[styles.gifSearchContainer, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.gifSearchInput, { color: colors.textPrimary }]}
            placeholder="Search GIFs..."
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

        {/* GIF Grid */}
        {loading ? (
          <View style={styles.gifLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading GIFs...</Text>
          </View>
        ) : error ? (
          <View style={styles.gifLoading}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 12, textAlign: 'center' }}>{error}</Text>
            <Pressable
              onPress={() => searchGifs(searchQuery)}
              style={{ marginTop: 16, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
            >
              <Text style={{ color: '#fff' }}>Retry</Text>
            </Pressable>
          </View>
        ) : gifs.length === 0 ? (
          <View style={styles.gifLoading}>
            <Ionicons name="images-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 12 }}>
              {searchQuery ? 'No GIFs found' : 'Search for GIFs'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={gifs}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.gifGrid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const thumbnailUrl = getGifUrl(item, 'small');
              const fullUrl = getGifUrl(item, 'full');

              if (!thumbnailUrl) return null;

              return (
                <Pressable
                  style={styles.gifItem}
                  onPress={() => {
                    if (fullUrl) {
                      onSelectGif(fullUrl);
                      onClose();
                    }
                  }}
                >
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={styles.gifThumbnail}
                    resizeMode="cover"
                  />
                </Pressable>
              );
            }}
          />
        )}

        {/* Powered by Tenor */}
        <View style={styles.giphyAttribution}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Powered by Tenor</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ============================================================================
// REPORT MODAL
// ============================================================================

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, note: string) => void;
  colors: any;
}

function ReportModal({ visible, onClose, onSubmit, colors }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [note, setNote] = useState('');

  const reasons = [
    'Harassment or bullying',
    'Spam or scam',
    'Inappropriate content',
    'Hate speech',
    'Threats or violence',
    'Other',
  ];

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Please select a reason');
      return;
    }
    onSubmit(selectedReason, note);
    setSelectedReason('');
    setNote('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.reportContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.reportHeader, { borderBottomColor: colors.borderSubtle }]}>
          <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>Report User</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.reportContent}>
          <Text style={[styles.reportLabel, { color: colors.textPrimary }]}>
            Why are you reporting this user?
          </Text>

          {reasons.map((reason) => (
            <Pressable
              key={reason}
              style={[
                styles.reportOption,
                {
                  backgroundColor: selectedReason === reason ? colors.primary + '20' : colors.surfaceMuted,
                  borderColor: selectedReason === reason ? colors.primary : colors.borderSubtle,
                }
              ]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text style={{ color: selectedReason === reason ? colors.primary : colors.textPrimary }}>
                {reason}
              </Text>
              {selectedReason === reason && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </Pressable>
          ))}

          <Text style={[styles.reportLabel, { color: colors.textPrimary, marginTop: 20 }]}>
            Additional details (optional)
          </Text>
          <TextInput
            style={[
              styles.reportTextArea,
              {
                backgroundColor: colors.surfaceMuted,
                color: colors.textPrimary,
                borderColor: colors.borderSubtle,
              }
            ]}
            placeholder="Provide any additional context..."
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
          />

          <Pressable
            style={[styles.reportSubmitButton, { backgroundColor: colors.error }]}
            onPress={handleSubmit}
          >
            <Text style={styles.reportSubmitText}>Submit Report</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MessageDetail({
  onBack,
  conversationId,
  otherUser: providedOtherUser,
  onNavigateToProfile
}: MessageDetailProps) {
  const { colors, spacing, radii } = useTheme();
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [messageText, setMessageText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  // Track which messages have heart reactions from current user
  const [myReactions, setMyReactions] = useState<Set<string | number>>(new Set());

  const flatListRef = useRef<FlatList>(null);

  const { data: messages, isLoading, isError, refetch } = useConversationMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  // Extract otherUser from messages if not provided as prop
  const otherUser = React.useMemo(() => {
    if (providedOtherUser) return providedOtherUser;

    if (messages && messages.length > 0 && currentUser) {
      const firstMessage = messages[0];
      const isCurrentUserSender = firstMessage.senderId === currentUser.id;
      const otherUserData = isCurrentUserSender ? firstMessage.receiver : firstMessage.sender;

      if (otherUserData) {
        return {
          id: otherUserData.id,
          name: otherUserData.displayName || otherUserData.username,
          username: otherUserData.username,
          avatar: otherUserData.profileImageUrl,
        };
      }
    }

    return null;
  }, [providedOtherUser, messages, currentUser]);

  useEffect(() => {
    if (conversationId) {
      markAsReadMutation.mutate(conversationId);
    }
  }, [conversationId]);

  // Load muted state when other user is known
  useEffect(() => {
    const loadMuteStatus = async () => {
      if (!otherUser?.id) return;
      try {
        const response = await apiClient.get(`/api/dm/mute/${otherUser.id}`);
        setIsMuted(response.data?.isMuted || false);
      } catch (error) {
        console.error('Error loading mute status:', error);
      }
    };
    loadMuteStatus();
  }, [otherUser?.id]);

  // Load existing reactions when messages load
  useEffect(() => {
    const loadReactions = async () => {
      if (!messages || messages.length === 0 || !currentUser) return;

      const reactedMessageIds = new Set<string | number>();

      // Fetch reactions for each message (batch could be optimized on server)
      // For now, check if messages have reactions embedded
      for (const msg of messages) {
        // If server returns reactions with messages, use that
        const msgReactions = (msg as any).reactions;
        if (msgReactions && Array.isArray(msgReactions)) {
          const hasMyReaction = msgReactions.some(
            (r: any) => r.userId === currentUser.id && r.reaction === 'heart'
          );
          if (hasMyReaction) {
            reactedMessageIds.add(msg.id);
          }
        }
      }

      if (reactedMessageIds.size > 0) {
        setMyReactions(reactedMessageIds);
      }
    };

    loadReactions();
  }, [messages, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({
      receiverId: conversationId,
      content: messageText.trim(),
    }, {
      onSuccess: () => {
        setMessageText('');
        Keyboard.dismiss();
      },
    });
  };

  const handleSendGif = (gifUrl: string) => {
    // For now, send GIF URL as message content
    // TODO: Implement proper GIF message type on server
    sendMessageMutation.mutate({
      receiverId: conversationId,
      content: gifUrl,
    });
  };

  const handleProfilePress = () => {
    if (otherUser && onNavigateToProfile) {
      onNavigateToProfile(otherUser.id);
    }
  };

  const handleMute = async () => {
    if (!otherUser?.id) return;

    try {
      if (isMuted) {
        // Unmute
        await apiClient.delete(`/api/dm/mute/${otherUser.id}`);
        setIsMuted(false);
        Alert.alert('Unmuted', 'You will receive notifications from this conversation.');
      } else {
        // Mute
        await apiClient.post(`/api/dm/mute/${otherUser.id}`);
        setIsMuted(true);
        Alert.alert('Muted', 'You will not receive notifications from this conversation.');
      }
    } catch (error: any) {
      console.error('Error toggling mute:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update notification settings.');
    }
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUser?.name}? They will not be able to message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post('/api/blocks', {
                userId: otherUser?.id,
                reason: 'blocked_from_dm',
              });
              Alert.alert('Blocked', 'User has been blocked.');
              onBack();
            } catch (error: any) {
              const message = error?.response?.data?.message || 'Failed to block user.';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const handleReport = (reason: string, note: string) => {
    apiClient.post('/api/user-reports', {
      userId: otherUser?.id,
      reason,
      description: note,
    })
    .then(() => {
      Alert.alert('Report Submitted', 'Thank you for your report. We will review it shortly.');
    })
    .catch((error) => {
      const message = error?.response?.data?.message || 'Failed to submit report. Please try again.';
      Alert.alert('Error', message);
    });
  };

  // Toggle heart reaction on a message
  const handleToggleReaction = useCallback(async (messageId: string | number) => {
    try {
      const response = await apiClient.post(`/api/dms/messages/${messageId}/reactions`, {
        reaction: 'heart',
      });

      setMyReactions((prev) => {
        const newSet = new Set(prev);
        if (response.data?.added) {
          newSet.add(messageId);
        } else {
          newSet.delete(messageId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      // Optionally show a toast or alert
    }
  }, []);

  const handleDeleteMessage = async (messageId: number | string) => {
    try {
      await apiClient.delete(`/api/dm/messages/${messageId}`);
      refetch();
      Alert.alert('Deleted', 'Message deleted successfully');
    } catch (error: any) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete message');
    }
  };

  const confirmDeleteMessage = (message: MessageItem) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteMessage(message.id),
        },
      ]
    );
  };

  const handleMessageLongPress = (message: MessageItem) => {
    const isMyMessage = message.senderId === currentUser?.id;

    const options = ['Copy Text'];
    if (isMyMessage) {
      options.push('Delete Message');
    } else {
      options.push('Report Message');
    }
    options.push('Cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: isMyMessage ? 1 : undefined,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            Clipboard.setString(message.content);
            Alert.alert('Copied', 'Message copied to clipboard');
          } else if (buttonIndex === 1 && isMyMessage) {
            confirmDeleteMessage(message);
          } else if (buttonIndex === 1 && !isMyMessage) {
            setShowReportModal(true);
          }
        }
      );
    } else {
      Alert.alert(
        'Message Options',
        '',
        [
          { text: 'Copy Text', onPress: () => {
            Clipboard.setString(message.content);
            Alert.alert('Copied', 'Message copied to clipboard');
          }},
          ...(isMyMessage
            ? [{ text: 'Delete Message', style: 'destructive' as const, onPress: () => confirmDeleteMessage(message) }]
            : [{ text: 'Report Message', onPress: () => setShowReportModal(true) }]
          ),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    }
  };

  const renderMessage = ({ item }: { item: MessageItem }) => {
    const isMe = item.senderId === currentUser?.id;

    return (
      <MessageBubble
        message={item}
        isMe={isMe}
        otherUserAvatar={otherUser?.avatar}
        otherUserName={otherUser?.name}
        colors={colors}
        radii={radii}
        onLongPress={() => handleMessageLongPress(item)}
        onDoubleTap={() => handleToggleReaction(item.id)}
        hasReaction={myReactions.has(item.id)}
      />
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ChatHeader
          otherUser={otherUser}
          onBack={onBack}
          onProfilePress={handleProfilePress}
          onMenuPress={() => {}}
          colors={colors}
        />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ChatHeader
        otherUser={otherUser}
        onBack={onBack}
        onProfilePress={handleProfilePress}
        onMenuPress={() => setShowMenu(true)}
        colors={colors}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.md }]}
          onContentSizeChange={() => {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
          }}
          showsVerticalScrollIndicator={false}
          inverted={false}
        />

        <View style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }}>
          <Composer
            value={messageText}
            onChangeText={setMessageText}
            onSend={handleSend}
            onGifPress={() => setShowGifPicker(true)}
            isSending={sendMessageMutation.isPending}
            colors={colors}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <SettingsMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onMute={handleMute}
        onBlock={handleBlock}
        onReport={() => setShowReportModal(true)}
        isMuted={isMuted}
        colors={colors}
      />

      <GifPicker
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelectGif={handleSendGif}
        colors={colors}
      />

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBackButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerUsername: {
    fontSize: 13,
  },
  headerMenuButton: {
    padding: 8,
  },

  // Message List
  listContent: {
    flexGrow: 1,
    paddingVertical: 12,
  },

  // Message Bubble
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
  },
  avatarSpacer: {
    width: 32,
    marginLeft: 8,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarInitial: {
    fontSize: 12,
    fontWeight: '600',
  },
  bubbleWrapper: {
    maxWidth: '75%',
    position: 'relative',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleLeft: {},
  bubbleRight: {},
  heartIndicator: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  heartIndicatorLeft: {
    left: 8,
  },
  heartIndicatorRight: {
    right: 8,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  gifImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  videoContainer: {
    position: 'relative',
    width: 200,
    height: 200,
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },

  // Composer
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  composerButton: {
    padding: 8,
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    marginRight: 8,
  },
  textInput: {
    fontSize: 16,
    maxHeight: 100,
    minHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Settings Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 17,
    marginLeft: 12,
  },
  menuItemCancel: {
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
  },

  // GIF Picker
  gifPickerContainer: {
    flex: 1,
  },
  gifPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  gifPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  gifPickerClose: {
    padding: 4,
  },
  gifSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  gifSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  gifLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gifGrid: {
    paddingHorizontal: 8,
  },
  gifItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gifThumbnail: {
    width: '100%',
    height: '100%',
  },
  giphyAttribution: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  // Report Modal
  reportContainer: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  reportContent: {
    padding: 16,
  },
  reportLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  reportOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  reportTextArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  reportSubmitButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  reportSubmitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
