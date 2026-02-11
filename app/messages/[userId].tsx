/**
 * Individual Chat Screen
 * Uses the improved MessageDetail component with proper UI/UX
 */

import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MessageDetail } from '../../src/screens/MessageDetail';
import apiClient from '../../src/lib/apiClient';

export default function ChatScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams() as { userId: string };
  const otherUserId = parseInt(userId || '0');

  // Fetch other user's profile data to pass to MessageDetail
  const { data: otherUserData } = useQuery({
    queryKey: ['user-profile', otherUserId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/users/${otherUserId}/profile`);
        return response.data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!otherUserId,
    retry: 2,
  });

  // Format other user data for MessageDetail
  const otherUser = React.useMemo(() => {
    if (!otherUserData?.user) return undefined;

    return {
      id: otherUserData.user.id || otherUserId,
      name: otherUserData.user.displayName || otherUserData.user.username || 'User',
      username: otherUserData.user.username,
      avatar: otherUserData.user.profileImageUrl || otherUserData.user.avatarUrl,
    };
  }, [otherUserData, otherUserId]);

  const handleBack = () => {
    router.push('/(tabs)/messages');
  };

  const handleNavigateToProfile = (userId: number) => {
    router.push(`/profile/${userId}`);
  };

  return (
    <MessageDetail
      conversationId={otherUserId}
      otherUser={otherUser}
      onBack={handleBack}
      onNavigateToProfile={handleNavigateToProfile}
    />
  );
}
