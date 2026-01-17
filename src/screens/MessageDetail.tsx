import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Text, Screen, Input, Button, Avatar } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { AppHeader } from './AppHeader';
import { useConversationMessages, useSendMessage, useMarkAsRead } from '../queries/messages';
import { useAuth } from '../contexts/AuthContext';

interface MessageDetailProps {
  onBack: () => void;
  conversationId: number;
  otherUser?: {
    id: number;
    name: string;
    avatar?: string;
  };
}

export function MessageDetail({ onBack, conversationId, otherUser: providedOtherUser }: MessageDetailProps) {
  const { colors, spacing, radii } = useTheme();
  const { user: currentUser } = useAuth();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: messages, isLoading, isError } = useConversationMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  // Extract otherUser from messages if not provided as prop
  const otherUser = React.useMemo(() => {
    if (providedOtherUser) return providedOtherUser;

    if (messages && messages.length > 0 && currentUser) {
      const firstMessage = messages[0];
      // Determine who the other user is
      const isCurrentUserSender = firstMessage.senderId === currentUser.id;
      const otherUserData = isCurrentUserSender ? firstMessage.receiver : firstMessage.sender;

      if (otherUserData) {
        return {
          id: otherUserData.id,
          name: otherUserData.displayName || otherUserData.username,
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

  const handleSend = () => {
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({
      receiverId: conversationId, // conversationId is the other user's ID
      content: messageText.trim(),
    });
    setMessageText('');
    Keyboard.dismiss();
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === currentUser?.id;

    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {!isMe && (
          <Avatar
            src={item.sender?.profileImageUrl || otherUser?.avatar}
            size="sm"
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.bubble,
          { 
            backgroundColor: isMe ? colors.primary : colors.muted,
            borderBottomRightRadius: isMe ? radii.xs : radii.lg,
            borderBottomLeftRadius: isMe ? radii.lg : radii.xs,
            borderRadius: radii.lg,
          }
        ]}>
          <Text style={{ color: isMe ? colors.primaryForeground : colors.textPrimary }}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <AppHeader showBack onBackPress={onBack} title={otherUser?.name || 'Chat'} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader 
        showBack 
        onBackPress={onBack} 
        title={otherUser?.name || 'Chat'} 
        rightElement={
          <Avatar src={otherUser?.avatar} size="sm" />
        }
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { padding: spacing.md }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[
          styles.inputContainer, 
          { 
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
            backgroundColor: colors.background
          }
        ]}>
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            style={styles.input}
            multiline
          />
          <Button 
            onPress={handleSend}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            style={styles.sendButton}
            size="sm"
          >
            <Text style={{ color: colors.primaryForeground }}>Send</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    height: 44,
    justifyContent: 'center',
  }
});

