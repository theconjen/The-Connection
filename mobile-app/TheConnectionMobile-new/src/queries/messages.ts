import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: string;
  mediaUrl?: string;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface Conversation {
  id: number;
  name?: string;
  isGroup: boolean;
  avatarUrl?: string;
  updatedAt: string;
  participants: any[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiClient.get<Conversation[]>('/api/messages/conversations');
      return response.data;
    },
  });
};

export const useConversationMessages = (conversationId: number) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await apiClient.get<Message[]>(`/api/messages/conversations/${conversationId}/messages`);
      return response.data;
    },
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, content, messageType = 'text', mediaUrl }: { 
      conversationId: number; 
      content: string; 
      messageType?: string; 
      mediaUrl?: string 
    }) => {
      const response = await apiClient.post<Message>(`/api/messages/conversations/${conversationId}/messages`, {
        content,
        messageType,
        mediaUrl,
      });
      return response.data;
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['messages', newMessage.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: number) => {
      await apiClient.post(`/api/messages/conversations/${conversationId}/read`);
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
