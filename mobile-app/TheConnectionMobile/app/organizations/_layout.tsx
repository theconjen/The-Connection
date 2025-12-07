import { Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

export default function OrganizationsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Organizations' }} />
      <Stack.Screen name="[id]" options={{ title: 'Organization' }} />
      <Stack.Screen name="[id]/invite" options={{ title: 'Invite' }} />
    </Stack>
  );
}
