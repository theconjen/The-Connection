import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button, Tabs, TabsList, TabsTrigger, TabsContent, Separator } from '../../src/components/ui';

export default function ApologeticsScreen() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 gap-4">
        <Text className="text-2xl font-semibold">Apologetics</Text>
        <Text className="text-gray-600">Explore resources and arguments for the faith</Text>
        <Tabs>
          <TabsList>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="qa">Q&A</TabsTrigger>
          </TabsList>
          <Separator />
          <TabsContent>
            <Text className="text-gray-700">Coming soon...</Text>
          </TabsContent>
        </Tabs>
        <Button title="Back to Feed" href="/(tabs)/feed" />
      </View>
    </ScrollView>
  );
}
