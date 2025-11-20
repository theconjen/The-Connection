import { Tabs } from 'expo-router';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/shared/colors';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: 'Colors.primary' }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: () => '📰',
          href: '/(tabs)/feed'
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Forum',
          tabBarIcon: () => '💬',
          href: '/(tabs)/posts'
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: () => '👥',
          href: '/(tabs)/communities'
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: () => '📅',
          href: '/(tabs)/events'
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => '👤',
          href: '/(tabs)/profile'
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="apologetics"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButton: {
    top: -10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'Colors.primary',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
