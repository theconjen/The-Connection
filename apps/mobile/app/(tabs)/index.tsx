import { View, Text, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getFeed } from 'shared/services/feed';
import { useRef, useEffect } from 'react';
import { Skeleton } from '../../src/ui/Skeleton';

export default function Home() {
  const lastUpdatedRef = useRef<number | null>(null);
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: getFeed,
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: false, // parity with web: surface errors immediately (E2E determinism)
  });

  useEffect(() => {
    if (data && !isRefetching) lastUpdatedRef.current = Date.now();
  }, [data, isRefetching]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg p-4">
        <Skeleton height={80} className="mb-3" />
        <Skeleton height={80} className="mb-3" />
        <Skeleton height={80} className="mb-3" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-danger">Failed to load feed</Text>
        <Text className="text-muted">{(error as any)?.message || 'Unknown error'}</Text>
        <Text className="text-primary mt-2" onPress={() => refetch()}>Try again</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-3 pb-1">
        <Text className="text-muted text-xs">
          Last updated{' '}
          {lastUpdatedRef.current
            ? new Date(lastUpdatedRef.current).toLocaleTimeString()
            : '—'}
        </Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
        renderItem={({ item }) => (
          <View className="bg-card rounded-xl p-4 mb-3 border border-border">
            <Text className="text-text text-base font-semibold">{item.title}</Text>
            <Text className="text-muted mt-1">{item.body}</Text>
            <Text className="text-muted mt-2 text-xs">{item.createdAt}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-10">
            <Text className="text-muted">No items yet</Text>
          </View>
        }
      />
    </View>
  );
}
