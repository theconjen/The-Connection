import { useEffect, useState, useCallback } from 'react';
import { getJson } from '../lib/env';

export function useBlockedUserIds() {
  const [blockedIds, setBlockedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = useCallback(async () => {
    try {
      const data = await getJson<any[]>(`/moderation/blocked-users`).catch(() => []);
      // API returns array of blocks with blockedUser objects
      const ids = (data || []).map((b: any) => b.blockedUser?.id).filter(Boolean);
      setBlockedIds(ids);
    } catch (e) {
      console.error('Failed to fetch blocked users', e);
      setBlockedIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const addBlocked = (id: number) => setBlockedIds(prev => Array.from(new Set([...prev, id])));
  const removeBlocked = (id: number) => setBlockedIds(prev => prev.filter(x => x !== id));

  return { blockedIds, loading, refresh: fetchBlocked, addBlocked, removeBlocked };
}
