import { Tabs, useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { View, Pressable, StyleSheet } from 'react-native';
import { CreateHubSheet } from '../../src/components/CreateHubSheet';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Check if user has inbox access permission
  const hasInboxAccess = user?.permissions?.includes('inbox_access') || false;

  // Debug logging for inbox access
  console.info('[Tab Layout] User:', user?.username);
  console.info('[Tab Layout] Permissions:', user?.permissions);
  console.info('[Tab Layout] Has Inbox Access:', hasInboxAccess);

  // Earth-forward icon colors - warm, grounded palette
  const iconColors = {
    home: '#5C6B5E',        // Sage
    communities: '#7C6B78', // Muted plum
    events: '#B56A55',      // Terracotta
    apologetics: '#7C8F78', // Sage green
  };

  // Handle create button press
  const handleCreatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCreateSheetOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.borderSubtle,
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
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={focused ? iconColors.home : colors.textSecondary}
            />
          ),
          tabBarActiveTintColor: iconColors.home,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          href: null, // Hide old feed, keep for backwards compatibility
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
              onPress={handleCreatePress}
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
                  backgroundColor: '#0B132B', // Ink navy (text-like, not blue fill)
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
      <Tabs.Screen
        name="advice"
        options={{
          href: null, // Hide from tab bar, accessible via Home "See All"
        }}
      />
    </Tabs>

      <CreateHubSheet
        open={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />
    </View>
  );
}
