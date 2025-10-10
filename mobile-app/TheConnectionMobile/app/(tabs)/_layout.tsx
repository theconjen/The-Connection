import { Tabs } from 'expo-router';
import { Home, Users, Calendar, BookOpen } from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="apologetics"
        options={{
          title: 'Apologetics',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size ?? 22} />,
        }}
      />
    </Tabs>
  );
}
