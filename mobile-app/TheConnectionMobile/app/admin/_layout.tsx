import { Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user?.isAdmin) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="apologist-scholar-applications" options={{ title: 'Apologist Applications' }} />
      <Stack.Screen name="livestreamer-applications" options={{ title: 'Livestreamer Applications' }} />
      <Stack.Screen name="application-stats" options={{ title: 'Application Stats' }} />
    </Stack>
  );
}
