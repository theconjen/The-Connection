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
        paddingBottom: 28,
        paddingTop: 6,
        height: 78,
        paddingHorizontal: 8,
      },
      tabBarItemStyle: {
        flex: 1, // Ensure each tab takes equal space
      },
      tabBarLabelStyle: {
        fontSize: 10,
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
                top: -16,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#0B132B',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3,
                  elevation: 6,
                }}
              >
                <Ionicons name="add" size={26} color="#fff" />
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
          title: 'Q&A',
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
