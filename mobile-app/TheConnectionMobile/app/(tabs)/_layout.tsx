import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/shared/ThemeProvider.js';
import { Ionicons } from '@expo/vector-icons';
export default function TabsLayout() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Tabs screenOptions={{
      headerShown: true,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
      },
      headerStyle: {
        backgroundColor: colors.surface,
      },
      headerTintColor: colors.text,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/menu')}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Forum',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="apologetics"
        options={{
          title: 'Apologetics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden tabs */}
      <Tabs.Screen
        name="create"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="prayers"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="messages"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ href: null }}
      />
    </Tabs>
  );
}