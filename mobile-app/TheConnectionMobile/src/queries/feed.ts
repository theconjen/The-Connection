import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export type FeedPost = {
  id: number | string;
  title?: string;
  content?: string;
  excerpt?: string;
  imageUrl?: string;
  authorId?: number;
  author?: { username?: string; displayName?: string } | null;
};

export function useFeed() {
  return useQuery<FeedPost[]>({
    queryKey: ['feed'],
    queryFn: async () => {
      const response = await apiClient.get('/feed');
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
  });
}
