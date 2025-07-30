
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StatusBar, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation components
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Import React Native screens
import { HomeScreen } from './src/screens/HomeScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { CommunitiesScreen } from './src/screens/CommunitiesScreen';
import { MicroblogsScreen } from './src/screens/MicroblogsScreen';
import { PrayerRequestsScreen } from './src/screens/PrayerRequestsScreen';
import { EventsScreen } from './src/screens/EventsScreen';
import { BibleStudyScreen } from './src/screens/BibleStudyScreen';
import { ApologeticsScreen } from './src/screens/ApologeticsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// Auth context
import { useAuth } from './src/hooks/useAuth';

// Tab Navigator for main app screens
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#E91E63',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Feed" 
        component={MicroblogsScreen}
        options={{
          tabBarLabel: 'Feed',
        }}
      />
      <Tab.Screen 
        name="Communities" 
        component={CommunitiesScreen}
        options={{
          tabBarLabel: 'Communities',
        }}
      />
      <Tab.Screen 
        name="Prayer" 
        component={PrayerRequestsScreen}
        options={{
          tabBarLabel: 'Prayer',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated screens
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="Events" component={EventsScreen} />
          <Stack.Screen name="BibleStudy" component={BibleStudyScreen} />
          <Stack.Screen name="Apologetics" component={ApologeticsScreen} />
        </>
      ) : (
        // Unauthenticated screens
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function App() {
  // Initialize app services
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('React Native app initialized');
      } catch (error) {
        console.error('App initialization error:', error);
        Alert.alert('Error', 'Failed to initialize app');
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

export default App;
