import { Tabs } from 'expo-router';
import { useTheme } from '../../src/shared/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { display: 'none' }, // Hide the tab bar completely
    }}>
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="posts" />
      <Tabs.Screen name="communities" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="apologetics" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="create" options={{ href: null }} />
      <Tabs.Screen name="prayers" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
    </Tabs>
  );
}
