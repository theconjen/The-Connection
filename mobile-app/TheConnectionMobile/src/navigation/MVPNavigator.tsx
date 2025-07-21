import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Alert } from 'react-native';

import { MVPHomeScreen } from '../screens/MVPHomeScreen';
import { CommunitiesScreen } from '../screens/CommunitiesScreen';
import { MicroblogsScreen } from '../screens/MicroblogsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { useAuth } from '../hooks/useAuth';

// Simple tab icons for MVP
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => (
  <View
    style={{
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: focused ? '#E73AA4' : '#64748B',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text
      style={{
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
      }}
    >
      {name}
    </Text>
  </View>
);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MVPTabNavigator = () => {
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
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={MVPHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="H" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Communities"
        component={CommunitiesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="C" focused={focused} />,
          tabBarLabel: 'Groups',
        }}
      />
      <Tab.Screen
        name="Feed"
        component={MicroblogsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="F" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="P" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const MVPNavigator: React.FC = () => {
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
          <Stack.Screen name="Main" component={MVPTabNavigator} />
        ) : (
          <>
            <Stack.Screen name="MainGuest" component={MVPTabNavigator} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};