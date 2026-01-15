/**
 * Individual Chat Screen with Real-time Socket.IO Support
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import apiClient from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors } from '../../src/shared/colors';

interface Message {
  id: string;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  senderName?: string;
  isRead?: boolean;
  readAt?: string | null;
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

export default function ChatScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams() as { userId: string };
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const socketRef = useRef<Socket | null>(null);

  const [messageText, setMessageText] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const otherUserId = parseInt(userId || '0');

  // Fetch initial messages
  const { data: initialMessages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['messages', otherUserId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/messages/${otherUserId}`);
      return response.data;
    },
    enabled: !!otherUserId,
  });

  // Fetch other user's profile data (needed when no messages exist yet)
  const { data: otherUserData, error: profileError, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', otherUserId],
    queryFn: async () => {
      console.log('[ChatScreen] Fetching profile for user:', otherUserId);
      try {
        const response = await apiClient.get(`/api/users/${otherUserId}/profile`);
        console.log('[ChatScreen] Profile data received:', response.data);
        return response.data;
      } catch (error) {
        console.error('[ChatScreen] Error fetching profile:', error);
        throw error;
      }
    },
    enabled: !!otherUserId,
    retry: 2,
  });

  // Debug log when profile data changes
  useEffect(() => {
    console.log('[ChatScreen] otherUserData updated:', otherUserData);
    console.log('[ChatScreen] profileError:', profileError);
    console.log('[ChatScreen] profileLoading:', profileLoading);
  }, [otherUserData, profileError, profileLoading]);

  // Update local messages when initial messages load
  useEffect(() => {
    if (initialMessages.length > 0) {
      setLocalMessages(initialMessages);
    }
  }, [initialMessages]);

  // Socket.IO connection and real-time messaging
  useEffect(() => {
    if (!user?.id) return;

    // Get the API base URL from the apiClient
    const baseURL = apiClient.defaults.baseURL || '';
    const socketURL = baseURL.replace('/api', '');

    // Connect to Socket.IO
    const socket = io(socketURL, {
      path: '/socket.io/',
      auth: { userId: user.id },
      query: { userId: user.id },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Join user's room for DMs
      socket.emit('join_user_room', user.id);
    });

    socket.on('new_message', (message: Message) => {
      // Only add message if it's part of this conversation
      if (
        (message.senderId === user.id && message.receiverId === otherUserId) ||
        (message.senderId === otherUserId && message.receiverId === user.id)
      ) {
        setLocalMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Invalidate conversations to update unread counts
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });

    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    socket.on('disconnect', () => {
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, otherUserId, queryClient]);

  // Mark conversation as read when screen opens
  useEffect(() => {
    if (!user?.id || !otherUserId) return;

    const markAsRead = async () => {
      try {
        await apiClient.post(`/api/messages/mark-conversation-read/${otherUserId}`);
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    };

    markAsRead();
  }, [user?.id, otherUserId, queryClient]);

  const handleSend = async () => {
    if (!messageText.trim() || !user?.id) return;

    const content = messageText.trim();
    setMessageText(''); // Clear input immediately for better UX

    try {
      // Send via REST API to ensure message is saved
      const response = await apiClient.post('/api/messages/send', {
        receiverId: otherUserId,
        content,
      });

      // Optimistically add message to local state
      const newMessage: Message = {
        id: response.data.id || Date.now().toString(),
        senderId: user.id,
        receiverId: otherUserId,
        content,
        createdAt: new Date().toISOString(),
        isRead: false,
        readAt: null,
      };

      setLocalMessages((prev) => [...prev, newMessage]);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message text on error
      setMessageText(content);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [localMessages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Extract other user's name from enriched message data OR fetched profile
  const otherUserName = React.useMemo(() => {
    // First priority: get from fetched user profile data (works even with no messages)
    if (otherUserData?.user) {
      // Profile API returns nested structure: { user: { username, displayName, ... } }
      return otherUserData.user.displayName || otherUserData.user.username || 'User';
    }

    // Second priority: extract from messages if they exist
    if (localMessages.length > 0) {
      const firstMessage = localMessages[0];
      // Check if we have enriched data (sender/receiver objects)
      if (firstMessage.sender || firstMessage.receiver) {
        const userData = firstMessage.senderId === otherUserId
          ? firstMessage.sender
          : firstMessage.receiver;
        return userData?.displayName || userData?.username || 'User';
      }

      // Fallback to legacy senderName field
      return firstMessage.senderId === otherUserId
        ? firstMessage.senderName
        : localMessages.find(m => m.senderId === otherUserId)?.senderName || 'User';
    }

    // Final fallback
    return 'User';
  }, [localMessages, otherUserId, otherUserData]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{otherUserName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Loading messages...</Text>
          </View>
        ) : localMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>Start the conversation!</Text>
          </View>
        ) : (
          localMessages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  isMe ? styles.myMessage : styles.theirMessage,
                ]}
              >
                <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                  {msg.content}
                </Text>
                <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
                  {formatTime(msg.createdAt)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, color: Colors.primary },
  title: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  messageText: { fontSize: 15, color: '#1f2937', marginBottom: 4 },
  myMessageText: { color: '#fff' },
  messageTime: { fontSize: 11, color: '#9ca3af' },
  myMessageTime: { color: '#e9d5ff' },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 100 },
  emptyStateText: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  emptyStateSubtext: { fontSize: 14, color: '#9ca3af' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, marginRight: 8 },
  sendButton: { backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
