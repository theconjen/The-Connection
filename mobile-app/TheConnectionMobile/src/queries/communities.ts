import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

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
      const response = await apiClient.get(`/communities${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
  });
}
