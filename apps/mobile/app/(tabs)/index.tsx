import { View, Text, ActivityIndicator, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getFeed } from 'shared/services/feed';

export default function Home() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['feed'], queryFn: getFeed });

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
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="bg-card rounded-xl p-4 mb-3 border border-border">
            <Text className="text-text text-base font-semibold">{item.title}</Text>
            <Text className="text-muted mt-1">{item.body}</Text>
            <Text className="text-muted mt-2 text-xs">{item.createdAt}</Text>
          </View>
        )}
      />
    </View>
  );
}
