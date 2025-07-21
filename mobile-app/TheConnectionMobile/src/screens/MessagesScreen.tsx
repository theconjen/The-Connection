import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MobileCard from '../components/MobileCard';
import TouchFeedback from '../components/TouchFeedback';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

interface Message {
  id: number;
  content: string;
  senderId: number;
  recipientId: number;
  createdAt: string;
  sender?: {
    username: string;
  };
}

interface Conversation {
  recipientId: number;
  recipientUsername: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { recipientId } = route.params || {};
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(recipientId || null);

  // Socket connection for real-time messages
  const { emit, on, off } = useSocket(user?.id);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiService.getConversations(),
    enabled: !!user && !selectedConversation,
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => apiService.getMessages(selectedConversation!),
    enabled: !!user && !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ recipientId, content }: { recipientId: number; content: string }) =>
      apiService.sendMessage(recipientId, content),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Set up real-time message listeners
  useEffect(() => {
    if (!user) return;

    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(['messages', selectedConversation], (old: Message[] = []) => [
        ...old,
        message,
      ]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    on('new_message', handleNewMessage);

    return () => {
      off('new_message', handleNewMessage);
    };
  }, [user, selectedConversation]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      recipientId: selectedConversation,
      content: newMessage.trim(),
    });

    // Emit real-time message
    emit('send_message', {
      recipientId: selectedConversation,
      content: newMessage.trim(),
    });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchFeedback
      onPress={() => setSelectedConversation(item.recipientId)}
      style={styles.conversationItem}
    >
      <MobileCard style={styles.conversationCard}>
        <View style={styles.conversationHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.recipientUsername.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.conversationInfo}>
            <Text style={styles.recipientName}>{item.recipientUsername}</Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </MobileCard>
    </TouchFeedback>
  );

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    
    return (
      <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
        <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwn ? styles.ownTime : styles.otherTime]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <MobileCard style={styles.centerCard}>
          <Text style={styles.centerText}>Please log in to access messages</Text>
        </MobileCard>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#E91E63', '#9C27B0']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          {selectedConversation && (
            <TouchFeedback
              onPress={() => setSelectedConversation(null)}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchFeedback>
          )}
          <Text style={styles.headerTitle}>
            {selectedConversation ? 'Messages' : 'Conversations'}
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      {!selectedConversation ? (
        // Conversations List
        <FlatList
          data={conversations || []}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.recipientId.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={conversationsLoading}
          ListEmptyComponent={
            <MobileCard style={styles.centerCard}>
              <Text style={styles.centerText}>No conversations yet</Text>
              <Text style={styles.centerSubtext}>
                Start a conversation by visiting someone's profile
              </Text>
            </MobileCard>
          }
        />
      ) : (
        // Messages View
        <KeyboardAvoidingView
          style={styles.messagesContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <FlatList
            data={messages || []}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesContent}
            refreshing={messagesLoading}
            inverted
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation!</Text>
              </View>
            }
          />

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchFeedback
              onPress={handleSendMessage}
              style={[
                styles.sendButton,
                (!newMessage.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled,
              ]}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              hapticFeedback="medium"
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchFeedback>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  conversationItem: {
    marginBottom: 8,
  },
  conversationCard: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1625',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  unreadBadge: {
    backgroundColor: '#E91E63',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#E91E63',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#1A1625',
  },
  messageTime: {
    fontSize: 12,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherTime: {
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    backgroundColor: '#E91E63',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centerCard: {
    marginTop: 40,
    alignItems: 'center',
  },
  centerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1625',
    textAlign: 'center',
    marginBottom: 8,
  },
  centerSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyMessages: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1625',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});