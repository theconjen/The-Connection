import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Separator } from '../../src/components/ui';
import { useEvents } from '../../src/queries/events';

const DEMO_EVENTS = [
  { id: 'e1', title: 'Sunday Service', desc: 'Join us for worship and teaching', date: 'Sun 10:00 AM' },
  { id: 'e2', title: 'Community Outreach', desc: 'Serve the neighborhood together', date: 'Sat 9:00 AM' },
];

export default function EventsScreen() {
  const router = useRouter();
  const { data: events, isLoading, error } = useEvents();
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-semibold">Events</Text>
          <Button variant="secondary" title="Calendar" />
        </View>
        {isLoading && <Text>Loading events…</Text>}
        {error && <Text className="text-red-600">{String((error as any)?.message || 'Failed to load events')}</Text>}
        {(events || []).map((ev: any) => (
          <Card key={ev.id}>
            <CardHeader>
              <CardTitle>{ev.title}</CardTitle>
              {ev.eventDate ? <CardDescription>{ev.eventDate}</CardDescription> : null}
            </CardHeader>
            <Separator />
            <CardContent>
              {ev.description ? <Text className="text-gray-700">{ev.description}</Text> : null}
            </CardContent>
            <CardFooter>
              <Button title="Attend" />
            </CardFooter>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
