import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthProvider } from '../src/auth/AuthProvider';

export default function RootLayout() {
  const [qc] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <View className="flex-1 bg-bg">
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </AuthProvider>
    </QueryClientProvider>
  );
}
