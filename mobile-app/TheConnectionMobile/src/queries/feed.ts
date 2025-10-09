import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

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
      const data = await api.get('/feed');
      return Array.isArray(data) ? data : [];
    },
  });
}
