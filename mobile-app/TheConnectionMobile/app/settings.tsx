import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Switch, Separator } from '../src/components/ui';
import { useAuth } from '../src/auth/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = React.useState(true);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 gap-4">
        <Text className="text-2xl font-semibold">Settings</Text>
        {user ? (
          <View className="gap-2 py-2">
            <Text className="text-base">Signed in as {user.username}</Text>
            <Button title="Log out" onPress={async () => { await logout(); router.replace('/(auth)/login'); }} />
          </View>
        ) : null}

        <View className="gap-3">
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-base">Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
          <Separator />
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-base">Dark Mode</Text>
            <Switch value={false} onValueChange={() => {}} />
          </View>
          <Separator />
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-base">Email Summaries</Text>
            <Switch value={true} onValueChange={() => {}} />
          </View>
        </View>
        {!user ? <Button title="Log In" onPress={() => router.push('/(auth)/login')} /> : null}
      </View>
    </ScrollView>
  );
}
