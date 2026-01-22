import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

interface Question {
  id: number;
  askerUserId: number;
  domain: string;
  areaId: number;
  tagId: number;
  questionText: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  askerDisplayName?: string;
  areaName?: string;
  tagName?: string;
}

interface Message {
  id: number;
  questionId: number;
  senderUserId: number;
  body: string;
  createdAt: string;
  senderDisplayName?: string;
  isCurrentUser?: boolean;
}

export default function QuestionThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();
  const styles = getThemedStyles(colors, colorScheme);
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);

  const [replyText, setReplyText] = useState('');

  const questionId = parseInt(id || '0');

  // Fetch question messages
  const { data: messages, isLoading, refetch } = useQuery<Message[]>({
    queryKey: ['/api/questions', questionId, 'messages'],
    queryFn: async () => {
      const response = await apiClient.get(`/api/questions/${questionId}/messages`);
      return response.data;
    },
    enabled: !!questionId && !!user,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      return await apiClient.post(`/api/questions/${questionId}/messages`, { body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions', questionId, 'messages'] });
      setReplyText('');
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send message');
    },
  });

  const handleSend = () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    sendMessageMutation.mutate(replyText.trim());
  };

  // Extract question from first message (or could fetch separately)
  const question: Question | null = messages && messages.length > 0
    ? {
        id: questionId,
        askerUserId: messages[0]?.senderUserId || 0,
        domain: '',
        areaId: 0,
        tagId: 0,
        questionText: messages[0]?.body || '',
        status: 'routed',
        createdAt: messages[0]?.createdAt || '',
        updatedAt: messages[0]?.createdAt || '',
        askerDisplayName: messages[0]?.senderDisplayName,
      }
    : null;

  // Scroll to bottom on mount and when messages update
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Question Thread</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Question Thread</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages && messages.length > 0 ? (
          messages.map((message, index) => {
            const isCurrentUser = message.senderUserId === user?.id;
            const isFirstMessage = index === 0; // First message is the question

            return (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft,
                  isFirstMessage && styles.questionBubble,
                ]}
              >
                {isFirstMessage && (
                  <View style={styles.questionHeader}>
                    <Ionicons name="help-circle" size={20} color={colors.accent} />
                    <Text style={styles.questionLabel}>Original Question</Text>
                  </View>
                )}

                {!isCurrentUser && (
                  <Text style={styles.senderName}>
                    {message.senderDisplayName || 'Unknown User'}
                  </Text>
                )}

                <Text
                  style={[
                    styles.messageText,
                    isCurrentUser && styles.messageTextRight,
                  ]}
                >
                  {message.body}
                </Text>

                <Text
                  style={[
                    styles.messageTimestamp,
                    isCurrentUser && styles.messageTimestampRight,
                  ]}
                >
                  {new Date(message.createdAt).toLocaleString()}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Reply Input */}
      <View style={styles.replyContainer}>
        <TextInput
          style={styles.replyInput}
          value={replyText}
          onChangeText={setReplyText}
          placeholder="Type your response..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={5000}
        />
        <Pressable
          style={[
            styles.sendButton,
            (!replyText.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!replyText.trim() || sendMessageMutation.isPending}
        >
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const getThemedStyles = (colors: any, colorScheme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  messageBubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  questionBubble: {
    maxWidth: '100%',
    backgroundColor: colorScheme === 'dark' ? '#2D2518' : '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
    borderRadius: 8,
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? '#4A3C20' : '#FFD580',
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  messageTextRight: {
    color: '#fff',
  },
  messageTimestamp: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
  },
  messageTimestampRight: {
    color: 'rgba(255,255,255,0.7)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
});
