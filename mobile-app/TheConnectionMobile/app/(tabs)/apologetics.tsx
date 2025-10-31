import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';

export default function ApologeticsScreen() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-semibold mb-2">Apologetics</Text>
        <Text className="text-gray-600 mb-4">Explore apologetics resources</Text>
        <Button title="Go to Feed" onPress={() => router.push('/(tabs)/feed')} />
      </View>
    </ScrollView>
  );
}
