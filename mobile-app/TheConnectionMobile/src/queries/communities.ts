import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export type Community = {
  id: number | string;
  name: string;
  slug?: string;
  membersCount?: number;
  initials?: string;
};

export function useCommunities(search?: string) {
  return useQuery<Community[]>({
    queryKey: ['communities', { search: search || '' }],
    queryFn: async () => {
      const data = await api.get(`/communities${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      return Array.isArray(data) ? data : [];
    },
  });
}
