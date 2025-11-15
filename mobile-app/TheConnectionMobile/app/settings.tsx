import React from 'react';
import { View, Text, ScrollView, Switch, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { Colors } from '../src/shared/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(true);

  const openPrivacyPolicy = () => {
    Linking.openURL('https://app.theconnection.app/privacy');
  };

  const openCommunityGuidelines = () => {
    Linking.openURL('https://app.theconnection.app/community-guidelines');
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 gap-3">
        <Text className="text-2xl font-semibold mb-2">Settings</Text>

        {/* Notifications */}
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-base">Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>

        {/* Policies & Guidelines Section */}
        <View className="mt-6 mb-2">
          <Text className="text-lg font-semibold mb-3">Policies & Guidelines</Text>

          <Pressable
            onPress={openPrivacyPolicy}
            style={({ pressed }) => ({
              backgroundColor: pressed ? Colors.muted : 'transparent',
              padding: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: Colors.border,
              marginBottom: 12,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.primary, marginBottom: 4 }}>
              Privacy Policy
            </Text>
            <Text style={{ fontSize: 14, color: Colors.mutedForeground }}>
              Learn how we protect your data
            </Text>
          </Pressable>

          <Pressable
            onPress={openCommunityGuidelines}
            style={({ pressed }) => ({
              backgroundColor: pressed ? Colors.muted : 'transparent',
              padding: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: Colors.border,
              marginBottom: 12,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.primary, marginBottom: 4 }}>
              Community Guidelines
            </Text>
            <Text style={{ fontSize: 14, color: Colors.mutedForeground }}>
              Understand our community expectations
            </Text>
          </Pressable>
        </View>

        <Button title="Log In" onPress={() => router.push('/(auth)/login')} />
      </View>
    </ScrollView>
  );
}
