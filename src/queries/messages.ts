import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesAPI } from '../lib/apiClient';

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender?: {
    id: number;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
  };
}

export interface Conversation {
  id: number;
  otherUser: {
    id: number;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: number;
  };
  unreadCount: number;
  // Legacy fields for compatibility
  name?: string;
  isGroup?: boolean;
  avatarUrl?: string;
  updatedAt?: string;
  participants?: any[];
}

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        const conversations = await messagesAPI.getConversations();
        return conversations;
      } catch (error: any) {
        throw error;
      }
    },
    refetchInterval: 10000, // Poll every 10 seconds for new messages
    retry: 2, // Retry twice on failure
  });
};

export const useConversationMessages = (otherUserId: number) => {
  return useQuery({
    queryKey: ['messages', otherUserId],
    queryFn: () => messagesAPI.getMessages(otherUserId),
    enabled: !!otherUserId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: number; content: string }) =>
      messagesAPI.sendMessage(receiverId, content),
    onSuccess: (_, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({ queryKey: ['messages', variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: number) => messagesAPI.markConversationRead(otherUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: messagesAPI.getUnreadCount,
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: number) => messagesAPI.deleteMessage(messageId),
    onSuccess: () => {
      // Invalidate all message queries to refetch
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
