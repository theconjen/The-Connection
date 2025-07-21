import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthContext, useAuthProvider } from './src/hooks/useAuth';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const authValue = useAuthProvider();

  return (
    <AuthContext.Provider value={authValue}>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <AppNavigator />
      </View>
    </AuthContext.Provider>
  );
}
