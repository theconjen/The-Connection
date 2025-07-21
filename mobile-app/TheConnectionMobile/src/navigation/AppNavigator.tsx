import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { CommunitiesScreen } from '../screens/CommunitiesScreen';
import { MicroblogsScreen } from '../screens/MicroblogsScreen';
import { useAuth } from '../hooks/useAuth';

// Simple icon component for tabs
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => (
  <View style={{
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: focused ? '#E73AA4' : '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <Text style={{
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    }}>
      {name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

// Placeholder screens
const EventsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1A1D29' }}>Events</Text>
    <Text style={{ fontSize: 16, color: '#64748B', marginTop: 8 }}>Coming soon...</Text>
  </View>
);

const PrayerRequestsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1A1D29' }}>Prayer Requests</Text>
    <Text style={{ fontSize: 16, color: '#64748B', marginTop: 8 }}>Coming soon...</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1A1D29' }}>Profile</Text>
    <Text style={{ fontSize: 16, color: '#64748B', marginTop: 8 }}>Coming soon...</Text>
  </View>
);

const AuthScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1A1D29' }}>Login</Text>
    <Text style={{ fontSize: 16, color: '#64748B', marginTop: 8 }}>Authentication coming soon...</Text>
  </View>
);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#E73AA4',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#D1D5DB',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Communities"
        component={CommunitiesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="communities" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Microblogs"
        component={MicroblogsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="feed" focused={focused} />,
          tabBarLabel: 'Feed',
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="events" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PrayerRequests"
        component={PrayerRequestsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="prayer" focused={focused} />,
          tabBarLabel: 'Prayer',
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
        <Text style={{ fontSize: 18, color: '#64748B' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <>
            <Stack.Screen name="MainGuest" component={TabNavigator} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};