import { useEffect, useState } from 'react';
import {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from '@tanstack/react-query';
import { useOffline } from '../shared/OfflineProvider';
import { readCache, writeCache } from '../lib/offlineCache';

type MaybePromise<T> = T | Promise<T>;

export function useOfflineAwareQuery<TQueryFnData, TError = Error, TData = TQueryFnData>(
  options: UseQueryOptions<TQueryFnData, TError, TData, QueryKey>
): UseQueryResult<TData, TError> {
  const { isOffline } = useOffline();
  const [cached, setCached] = useState<TData | undefined>(undefined);

  useEffect(() => {
    if (!options.queryKey) return;

    readCache<TData>(options.queryKey).then((data) => {
      if (data !== null) {
        setCached(data);
      }
    });
  }, [options.queryKey]);

  return useQuery({
    ...options,
    enabled: (options.enabled ?? true) && (!isOffline || !!cached),
    initialData: cached as MaybePromise<TData> | undefined,
    placeholderData: cached as MaybePromise<TData> | undefined,
    retry: isOffline ? false : options.retry,
    onSuccess: async (data) => {
      if (options.queryKey) {
        await writeCache(options.queryKey, data as TData);
      }
      options.onSuccess?.(data);
    },
  });
}

