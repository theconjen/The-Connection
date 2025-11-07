import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';

export default function CommunitiesScreen() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-semibold mb-2">Communities</Text>
        <Text className="text-gray-600 mb-4">Discover and join communities</Text>
        <Button title="Open Settings" onPress={() => router.push('/settings')} />
      </View>
    </ScrollView>
  );
}
