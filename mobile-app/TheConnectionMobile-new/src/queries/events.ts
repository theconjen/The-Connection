import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export type EventItem = {
  id: number | string;
  title: string;
  description?: string;
  eventDate?: string;
  startTime?: string;
  isPublic?: boolean;
};

export function useEvents() {
  return useQuery<EventItem[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await apiClient.get('/events');
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
  });
}
