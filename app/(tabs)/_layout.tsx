import { Tabs, useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useCreateMenu } from '../../src/contexts/CreateMenuContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { View, Pressable, StyleSheet } from 'react-native';
import { FanMenu } from '../../src/components/FanMenu';

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isMenuOpen, openMenu, closeMenu } = useCreateMenu();
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Check if user has inbox access permission
  const hasInboxAccess = user?.permissions?.includes('inbox_access') || false;

  // Debug logging for inbox access
  console.log('[Tab Layout] User:', user?.username);
  console.log('[Tab Layout] Permissions:', user?.permissions);
  console.log('[Tab Layout] Has Inbox Access:', hasInboxAccess);

  // Custom icon colors matching the design
  const iconColors = {
    feed: '#4A90E2',        // Blue
    communities: '#9B59B6', // Purple
    events: '#5B9BD5',      // Blue
    apologetics: '#27AE60', // Green
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

  const handleCreateEvent = () => {
    router.push('/events/create');
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
        name="apologetics"
        options={{
          title: 'Apologetics',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={size}
              color={focused ? iconColors.apologetics : colors.textSecondary}
            />
          ),
          tabBarActiveTintColor: iconColors.apologetics,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          href: null, // Hidden from tab bar, accessible only through Menu drawer
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null, // Hide from tab bar, but keep route accessible
        }}
      />
      <Tabs.Screen
        name="profile"
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
        onCreateEvent={handleCreateEvent}
        isAdmin={isAdmin}
      />
    </View>
  );
}
