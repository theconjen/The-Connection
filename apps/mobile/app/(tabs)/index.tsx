import { View, Text, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getFeed } from 'shared/services/feed';

export default function Home() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: getFeed,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator />
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
