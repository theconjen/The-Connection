import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Avatar, AvatarImage, AvatarFallback, Separator, Tabs, Toggle } from '../../src/components/ui';
import { useFeed } from '../../src/queries/feed';

const DEMO_POSTS = [
  {
    id: '1',
    author: 'Jane Doe',
    initials: 'JD',
    title: 'Welcome to The Connection',
    excerpt: 'Let\'s build a thriving community together. Share your thoughts and connect with others.',
    image: 'https://picsum.photos/seed/1/600/360',
  },
  {
    id: '2',
    author: 'John Smith',
    initials: 'JS',
    title: 'Community Guidelines',
    excerpt: 'Be kind, be helpful, and report any inappropriate content. We\'re glad you\'re here!',
    image: 'https://picsum.photos/seed/2/600/360',
  },
];

export default function FeedScreen() {
  const router = useRouter();
  const { data: posts, isLoading, error } = useFeed();
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-semibold">Feed</Text>
          <Button variant="secondary" title="Settings" href="/settings" />
        </View>

        <Tabs>
          <Tabs.List>
            <Tabs.Trigger value="all">All</Tabs.Trigger>
            <Tabs.Trigger value="following">Following</Tabs.Trigger>
          </Tabs.List>
        </Tabs>

        {isLoading && <Text>Loading feed…</Text>}
        {error && <Text className="text-red-600">{String((error as any)?.message || 'Failed to load feed')}</Text>}
        {(posts || []).map((post: any) => (
          <Card key={post.id}>
            <CardHeader>
              <View className="flex-row items-center gap-3">
                <Avatar>
                  <AvatarFallback initials={(post.author?.displayName || post.author?.username || 'U').slice(0,2).toUpperCase()} />
                </Avatar>
                <View className="flex-1">
                  <CardTitle>{post.title || 'Untitled Post'}</CardTitle>
                  <CardDescription>by {post.author?.displayName || post.author?.username || 'Unknown'}</CardDescription>
                </View>
              </View>
            </CardHeader>
            <Separator />
            <CardContent>
              {post.excerpt ? <Text className="text-gray-700 mb-3">{post.excerpt}</Text> : null}
              {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={{ width: '100%', height: 180, borderRadius: 12 }} /> : null}
            </CardContent>
            <CardFooter>
              <View className="flex-row gap-2">
                <Button title="Like" variant="secondary" />
                <Button title="Comment" variant="secondary" />
              </View>
            </CardFooter>
          </Card>
        ))}

        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-gray-600">Notifications</Text>
          <Toggle aria-label="notifications" />
        </View>

        <Button title="Go to Events" onPress={() => router.push('/(tabs)/events')} />
      </View>
    </ScrollView>
  );
}
