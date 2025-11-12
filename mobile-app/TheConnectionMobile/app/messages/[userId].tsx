/**
 * Individual Chat Screen
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
import apiClient from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  senderName?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messageText, setMessageText] = useState('');
  const otherUserId = parseInt(userId || '0');

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', otherUserId],
    queryFn: async () => {
      const response = await apiClient.get(`/messages/${otherUserId}`);
      return response.data;
    },
    enabled: !!otherUserId,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post('/messages', {
        receiverId: otherUserId,
        content,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageText('');
    },
  });

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText.trim());
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const otherUserName = messages[0]?.senderId === otherUserId 
    ? messages[0]?.senderName 
    : messages.find(m => m.senderId === otherUserId)?.senderName || 'User';

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
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>Start the conversation!</Text>
          </View>
        ) : (
          messages.map((msg) => {
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
          disabled={!messageText.trim() || sendMutation.isPending}
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
  backIcon: { fontSize: 24, color: '#8b5cf6' },
  title: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#8b5cf6', borderBottomRightRadius: 4 },
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
  sendButton: { backgroundColor: '#8b5cf6', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
