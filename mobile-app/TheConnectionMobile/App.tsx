import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthContext, useAuthProvider } from './src/hooks/useAuth';
import { AppNavigator } from './src/navigation/AppNavigator';
import { MVPNavigator } from './src/navigation/MVPNavigator';

export default function App() {
  const authValue = useAuthProvider();

  return (
    <AuthContext.Provider value={authValue}>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        {/* Use MVPNavigator for faster deployment, AppNavigator for full version */}
        <MVPNavigator />
      </View>
    </AuthContext.Provider>
  );
}
