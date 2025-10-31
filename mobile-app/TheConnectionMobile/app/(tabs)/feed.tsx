import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';

export default function FeedScreen() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-semibold mb-2">Feed</Text>
        <Text className="text-gray-600 mb-4">Your personalized community feed</Text>
        <Button title="Go to Events" onPress={() => router.push('/(tabs)/events')} />
      </View>
    </ScrollView>
  );
}
