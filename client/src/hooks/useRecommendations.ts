import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

export interface RecommendedMicroblog {
  id: number;
  content: string;
  authorId: number;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  score: number;
  reason: string;
  user?: {
    username: string;
    displayName?: string;
  };
}

export interface RecommendedCommunity {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  iconName: string;
  iconColor: string;
  score: number;
  reason: string;
}

export interface PersonalizedFeedData {
  microblogs: RecommendedMicroblog[];
  communities: RecommendedCommunity[];
  algorithm: string;
  timestamp: string;
}

export interface InteractionData {
  contentId: number;
  contentType: 'microblog' | 'community' | 'event';
  interactionType: 'view' | 'like' | 'comment' | 'share';
}

export function usePersonalizedFeed(limit = 20) {
  return useQuery({
    queryKey: ['/recommendations/feed', limit],
    queryFn: async (): Promise<PersonalizedFeedData> => {
      const response = await apiRequest('GET', `/recommendations/feed?limit=${limit}`);
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useRecordInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interaction: InteractionData) => {
      const response = await apiRequest('POST', '/recommendations/interaction', interaction);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate recommendations to potentially refresh with new data
      queryClient.invalidateQueries({ queryKey: ['/recommendations/feed'] });
    },
  });
}

// Helper hook to track content interactions
export function useContentTracking() {
  const recordInteraction = useRecordInteraction();

  const trackView = (contentId: number, contentType: InteractionData['contentType']) => {
    recordInteraction.mutate({
      contentId,
      contentType,
      interactionType: 'view',
    });
  };

  const trackLike = (contentId: number, contentType: InteractionData['contentType']) => {
    recordInteraction.mutate({
      contentId,
      contentType,
      interactionType: 'like',
    });
  };

  const trackComment = (contentId: number, contentType: InteractionData['contentType']) => {
    recordInteraction.mutate({
      contentId,
      contentType,
      interactionType: 'comment',
    });
  };

  const trackShare = (contentId: number, contentType: InteractionData['contentType']) => {
    recordInteraction.mutate({
      contentId,
      contentType,
      interactionType: 'share',
    });
  };

  return {
    trackView,
    trackLike,
    trackComment,
    trackShare,
    isRecording: recordInteraction.isPending,
  };
}