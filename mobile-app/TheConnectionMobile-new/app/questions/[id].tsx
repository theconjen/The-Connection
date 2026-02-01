import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  isQuestion?: boolean; // Flag for the original question
}

// Structured answer template for apologists
const ANSWER_TEMPLATE = `## Summary
[2-3 sentence answer to the question]

## Key Points
- [Main point 1]
- [Main point 2]
- [Main point 3]

## Detailed Answer
[Full explanation here...]

## Scripture References
- [Book Chapter:Verse - Brief context]

## Sources
- [Author, "Title" (Publisher, Year)]

## Perspectives
- [Denominational perspectives if relevant]
`;

export default function QuestionThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();
  const styles = getThemedStyles(colors, colorScheme);
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);

  const [replyText, setReplyText] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [menuMessage, setMenuMessage] = useState<Message | null>(null); // message for showing action menu
  const [showTemplateOption, setShowTemplateOption] = useState(true); // Show template button for first answer

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

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, body }: { messageId: number; body: string }) => {
      return await apiClient.patch(`/api/questions/${questionId}/messages/${messageId}`, { body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions', questionId, 'messages'] });
      setEditingMessage(null);
      setEditText('');
      Alert.alert('Success', 'Answer updated');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update message');
    },
  });

  // Publish as article mutation
  const publishMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiClient.post(`/api/questions/${questionId}/messages/${messageId}/publish`);
    },
    onSuccess: (response: any) => {
      Alert.alert(
        'Published!',
        'Your answer has been published to the Apologetics Library.',
        [
          { text: 'View Article', onPress: () => router.push(`/apologetics/${response.data?.postId}`) },
          { text: 'OK' },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to publish answer');
    },
  });

  const handleEdit = (message: Message) => {
    setMenuMessage(null);
    setEditingMessage(message);
    setEditText(message.body);
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editText.trim()) return;
    editMessageMutation.mutate({ messageId: editingMessage.id, body: editText.trim() });
  };

  const handlePublish = (message: Message) => {
    setMenuMessage(null);
    Alert.alert(
      'Publish Answer',
      'This will publish your answer to the Apologetics Library where it can help others with similar questions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish', onPress: () => publishMutation.mutate(message.id) },
      ]
    );
  };

  const handleSend = () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    sendMessageMutation.mutate(replyText.trim());
    setShowTemplateOption(false); // Hide template option after first message
  };

  const handleInsertTemplate = () => {
    setReplyText(ANSWER_TEMPLATE);
    setShowTemplateOption(false);
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
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
            // Use isQuestion flag, or fallback to first message with id=0 or index 0
            const isOriginalQuestion = message.isQuestion === true || message.id === 0 || (index === 0 && !message.id);

            return (
              <View
                key={`${message.id}-${message.isQuestion ? 'q' : 'm'}`}
                style={[
                  styles.messageBubble,
                  isOriginalQuestion ? styles.questionBubble : (isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft),
                ]}
              >
                {isOriginalQuestion && (
                  <View style={styles.questionHeader}>
                    <Ionicons name="help-circle" size={20} color={colors.accent} />
                    <Text style={styles.questionLabel}>Original Question</Text>
                  </View>
                )}

                {!isCurrentUser && !isOriginalQuestion && (
                  <Text style={styles.senderName}>
                    {message.senderDisplayName || 'Unknown User'}
                  </Text>
                )}

                {/* Menu button for user's own answers (not the question) */}
                {isCurrentUser && !isOriginalQuestion && (
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setMenuMessage(message)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color="rgba(255,255,255,0.9)" />
                  </TouchableOpacity>
                )}

                <Text
                  style={[
                    styles.messageText,
                    isCurrentUser && !isOriginalQuestion && styles.messageTextRight,
                  ]}
                >
                  {message.body}
                </Text>

                <Text
                  style={[
                    styles.messageTimestamp,
                    isCurrentUser && !isOriginalQuestion && styles.messageTimestampRight,
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
      <View style={styles.replyWrapper}>
        {/* Template suggestion for apologists */}
        {showTemplateOption && !replyText && messages && messages.length <= 1 && (
          <TouchableOpacity
            style={styles.templateButton}
            onPress={handleInsertTemplate}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.accent} />
            <Text style={styles.templateButtonText}>Use Structured Answer Template</Text>
          </TouchableOpacity>
        )}
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
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!replyText.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!replyText.trim() || sendMessageMutation.isPending}
            activeOpacity={0.7}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom} />
      </View>

      {/* Action Sheet Modal */}
      <Modal
        visible={!!menuMessage}
        animationType="fade"
        transparent
        onRequestClose={() => setMenuMessage(null)}
      >
        <View style={styles.actionSheetOverlay}>
          <TouchableOpacity style={styles.actionSheetBackdrop} onPress={() => setMenuMessage(null)} />
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>Message Options</Text>
            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => {
                if (menuMessage) handleEdit(menuMessage);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={22} color={colors.accent} />
              <Text style={styles.actionSheetItemText}>Edit Answer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => {
                if (menuMessage) handlePublish(menuMessage);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="library-outline" size={22} color={colors.accent} />
              <Text style={styles.actionSheetItemText}>Publish to Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetItem, styles.actionSheetCancel]}
              onPress={() => setMenuMessage(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={!!editingMessage}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingMessage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Answer</Text>
              <TouchableOpacity onPress={() => setEditingMessage(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
              placeholder="Edit your answer..."
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditingMessage(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!editText.trim() || editMessageMutation.isPending) && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveEdit}
                disabled={!editText.trim() || editMessageMutation.isPending}
              >
                {editMessageMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
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
  replyWrapper: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  templateButtonText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  safeAreaBottom: {
    backgroundColor: colors.surface,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 44,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    minWidth: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
  },
  actionSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionSheetItemText: {
    fontSize: 17,
    color: colors.textPrimary,
  },
  actionSheetCancel: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    justifyContent: 'center',
  },
  actionSheetCancelText: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  editInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 200,
    maxHeight: 400,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
