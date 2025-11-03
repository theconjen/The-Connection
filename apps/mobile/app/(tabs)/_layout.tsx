import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return null; // root spinner already covers initial load
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
