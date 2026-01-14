import { Tabs, useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useCreateMenu } from '../../src/contexts/CreateMenuContext';
import { Ionicons } from '@expo/vector-icons';
import { View, Pressable, StyleSheet } from 'react-native';
import { FanMenu } from '../../src/components/FanMenu';

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isMenuOpen, openMenu, closeMenu } = useCreateMenu();


  // Custom icon colors matching the design
  const iconColors = {
    feed: '#4A90E2',        // Blue
    communities: '#9B59B6', // Purple
    events: '#5B9BD5',      // Blue
    forum: '#E67E22',       // Orange
  };

  const handleCreateFeed = () => {
    router.push('/create-post');
  };

  const handleCreateCommunity = () => {
    router.push('/communities/create');
  };

  const handleCreateForum = () => {
    router.push('/create-forum-post'); // Reddit-style forum post with anonymous option
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: 34, // Safe area for iPhone home indicator (34px standard)
        paddingTop: 8,
        height: 90, // Increased height to accommodate elevated button
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        fontFamily: 'PlayfairDisplay_600SemiBold',
      },
    }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "chatbubble" : "chatbubble-outline"}
              size={size}
              color={focused ? iconColors.feed : colors.textSecondary}
            />
          ),
          tabBarActiveTintColor: iconColors.feed,
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={size}
              color={focused ? iconColors.communities : colors.textSecondary}
            />
          ),
          tabBarActiveTintColor: iconColors.communities,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarButton: () => (
            <Pressable
              onPress={() => {
                openMenu();
              }}
              style={{
                top: -20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#222D99',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 8,
                }}
              >
                <Ionicons name="add" size={32} color="#fff" />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size}
              color={focused ? iconColors.events : colors.textSecondary}
            />
          ),
          tabBarActiveTintColor: iconColors.events,
        }}
      />
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Forum',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={size}
              color={focused ? iconColors.forum : colors.textSecondary}
            />
          ),
          tabBarActiveTintColor: iconColors.forum,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null, // Hide from tab bar, but keep route accessible
        }}
      />
    </Tabs>

      <FanMenu
        visible={isMenuOpen}
        onClose={closeMenu}
        onCreateFeed={handleCreateFeed}
        onCreateCommunity={handleCreateCommunity}
        onCreateForum={handleCreateForum}
      />
    </View>
  );
}
