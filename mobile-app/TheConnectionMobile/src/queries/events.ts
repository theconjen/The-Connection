import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

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
      const data = await api.get('/events');
      return Array.isArray(data) ? data : [];
    },
  });
}
