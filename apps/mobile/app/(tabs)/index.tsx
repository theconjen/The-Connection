import { View, Text, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useRef, useEffect, useState, useCallback } from 'react';
import { getFeedPage } from 'shared/services/feed';
import { Skeleton } from '../../src/ui/Skeleton';

export default function Home() {
  const lastUpdatedRef = useRef<number | null>(null);
  const [pages, setPages] = useState<import('shared/app-schema').FeedPage[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [initialError, setInitialError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<Error | null>(null);

  const items = pages.flatMap(p => p.items);
  const nextCursor = pages.length ? pages[pages.length - 1].nextCursor : null;
  const hasNextPage = nextCursor != null;

  const loadInitial = useCallback(async () => {
    setInitialLoading(true);
    setInitialError(null);
    try {
      const page = await getFeedPage(null);
      setPages([page]);
      lastUpdatedRef.current = Date.now();
    } catch (e: any) {
      setInitialError(e);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setInitialError(null);
    try {
      const page = await getFeedPage(null);
      setPages([page]);
      lastUpdatedRef.current = Date.now();
    } catch (e: any) {
      setInitialError(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await getFeedPage(nextCursor);
      setPages(prev => [...prev, page]);
      lastUpdatedRef.current = Date.now();
    } catch (e: any) {
      setLoadMoreError(e);
    } finally {
      setLoadingMore(false);
    }
  }, [hasNextPage, loadingMore, nextCursor]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  if (initialLoading) {
    return (
      <View className="flex-1 bg-bg p-4">
        <Skeleton height={80} className="mb-3" />
        <Skeleton height={80} className="mb-3" />
        <Skeleton height={80} className="mb-3" />
      </View>
    );
  }

  if (initialError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-danger">Failed to load feed</Text>
        <Text className="text-muted">{initialError?.message || 'Unknown error'}</Text>
        <Text className="text-primary mt-2" onPress={() => refresh()}>Try again</Text>
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
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
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
        onEndReachedThreshold={0.5}
        onEndReached={fetchNextPage}
        ListFooterComponent={
          hasNextPage ? (
            <View className="py-4 items-center">
              {loadingMore ? (
                <ActivityIndicator />
              ) : (
                <Text className="text-primary" onPress={fetchNextPage}>Load more</Text>
              )}
              {loadMoreError && (
                <Text className="text-danger text-xs mt-2">Failed to load more: {loadMoreError.message}</Text>
              )}
            </View>
          ) : (
            <View className="py-6 items-center">
              <Text className="text-muted text-xs">End of feed</Text>
            </View>
          )
        }
      />
    </View>
  );
}
