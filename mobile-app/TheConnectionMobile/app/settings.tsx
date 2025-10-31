import React from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/ui/Button';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(true);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 gap-3">
        <Text className="text-2xl font-semibold mb-2">Settings</Text>
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-base">Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        <Button title="Log In" onPress={() => router.push('/(auth)/login')} />
      </View>
    </ScrollView>
  );
}
