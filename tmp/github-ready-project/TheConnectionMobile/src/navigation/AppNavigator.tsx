import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Alert } from 'react-native';
import { FloatingActionButton } from '../components/FloatingActionButton';

import OptimizedHomeScreen from '../screens/OptimizedHomeScreen';
import { CommunitiesScreen } from '../screens/CommunitiesScreen';
import { MicroblogsScreen } from '../screens/MicroblogsScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { PrayerRequestsScreen } from '../screens/PrayerRequestsScreen';
import { BibleStudyScreen } from '../screens/BibleStudyScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { ApologeticsScreen } from '../screens/ApologeticsScreen';
import { useAuth } from '../hooks/useAuth';

// Simple icon component for tabs
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => (
  <View style={{
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: focused ? '#E91E63' : '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <Text style={{
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    }}>
      {name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#E91E63',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E1E5E9',
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 2,
          height: 60,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 16,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={OptimizedHomeScreen}
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
        name="Microblogs"
        component={MicroblogsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="F" focused={focused} />,
          tabBarLabel: 'Feed',
        }}
      />
      <Tab.Screen
        name="PrayerRequests"
        component={PrayerRequestsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="P" focused={focused} />,
          tabBarLabel: 'Prayer',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="U" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const MainTabsWithFAB = () => {
  const fabOptions = [
    {
      id: 'events',
      label: 'Events',
      color: '#6366F1',
      onPress: () => Alert.alert('Navigate to Events'),
    },
    {
      id: 'bible',
      label: 'Bible Study',
      color: '#10B981',
      onPress: () => Alert.alert('Navigate to Bible Study'),
    },
    {
      id: 'apologetics',
      label: 'Q&A',
      color: '#F59E0B',
      onPress: () => Alert.alert('Navigate to Apologetics'),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <TabNavigator />
      <FloatingActionButton options={fabOptions} />
    </View>
  );
};

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainTabs" component={MainTabsWithFAB} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};