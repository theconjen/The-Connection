import { Tabs } from 'expo-router';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#8b5cf6' }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: () => '📰',
          href: '/(tabs)/feed'
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
        name="create"
        options={{
          title: '',
          tabBarIcon: () => '➕',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={styles.createButton}
              onPress={() => router.push('/create-post')}
            />
          ),
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
        name="apologetics"
        options={{
          title: 'Resources',
          tabBarIcon: () => '📚',
          href: '/(tabs)/apologetics'
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
      <Tabs.Screen
        name="profile"
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
    backgroundColor: '#8b5cf6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
