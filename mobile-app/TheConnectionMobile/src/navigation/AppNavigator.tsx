import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Alert } from 'react-native';
import { FloatingActionButton } from '../components/FloatingActionButton';

import { HomeScreen } from '../screens/HomeScreen';
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
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
      label: 'Create Event',
      color: '#6366F1',
      onPress: () => Alert.alert('Create Event', 'Event creation coming soon!'),
    },
    {
      id: 'bible',
      label: 'Bible Study',
      color: '#10B981',
      onPress: () => Alert.alert('Bible Study', 'Navigate to Bible Study screen'),
    },
    {
      id: 'apologetics',
      label: 'Ask Question',
      color: '#F59E0B',
      onPress: () => Alert.alert('Apologetics', 'Navigate to Apologetics screen'),
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
        <Text style={{ fontSize: 18, color: '#64748B' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabsWithFAB} />
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="BibleStudy" component={BibleStudyScreen} />
            <Stack.Screen name="Apologetics" component={ApologeticsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainGuest" component={MainTabsWithFAB} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="BibleStudy" component={BibleStudyScreen} />
            <Stack.Screen name="Apologetics" component={ApologeticsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};