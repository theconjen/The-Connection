import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Avatar, AvatarFallback, Separator } from '../../src/components/ui';
import { useCommunities } from '../../src/queries/communities';

const DEMO_COMMUNITIES = [
  { id: 'c1', name: 'Bible Study Group', members: 128, initials: 'BS' },
  { id: 'c2', name: 'Prayer Warriors', members: 342, initials: 'PW' },
  { id: 'c3', name: 'Youth Fellowship', members: 89, initials: 'YF' },
];

export default function CommunitiesScreen() {
  const router = useRouter();
  const { data: communities, isLoading, error } = useCommunities();
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-semibold">Communities</Text>
          <Button variant="secondary" title="Create" />
        </View>

        {isLoading && <Text>Loading communities…</Text>}
        {error && <Text className="text-red-600">{String((error as any)?.message || 'Failed to load communities')}</Text>}
        {(communities || []).map((c: any) => (
          <Card key={c.id}>
            <CardHeader>
              <View className="flex-row items-center gap-3">
                <Avatar>
                  <AvatarFallback initials={(c.name || 'C').slice(0,2).toUpperCase()} />
                </Avatar>
                <View className="flex-1">
                  <CardTitle>{c.name}</CardTitle>
                  {c.membersCount != null ? <CardDescription>{c.membersCount} members</CardDescription> : null}
                </View>
              </View>
            </CardHeader>
            <Separator />
            <CardFooter>
              <View className="flex-row gap-2">
                <Button title="Join" />
                <Button variant="secondary" title="View" onPress={() => router.push('/(tabs)/feed')} />
              </View>
            </CardFooter>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
