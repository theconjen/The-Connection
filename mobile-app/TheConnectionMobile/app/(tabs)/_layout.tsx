import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#8b5cf6' }}>
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: () => '📰' }} />
      <Tabs.Screen name="communities" options={{ title: 'Communities', tabBarIcon: () => '👥' }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: () => '📅' }} />
      <Tabs.Screen name="prayers" options={{ title: 'Prayers', tabBarIcon: () => '🙏' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: () => '💬' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => '👤' }} />
    </Tabs>
  );
}
