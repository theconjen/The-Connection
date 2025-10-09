import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/auth/AuthProvider';

export default function Settings() {
  const { user, logout, loading } = useAuth();
  return (
    <View className="flex-1 bg-bg p-6 gap-4">
      <Text className="text-text text-xl font-semibold">Settings</Text>
      <Text className="text-muted">Signed in as {user?.email}</Text>
      <Pressable className="bg-card rounded-xl p-4 items-center border border-border" disabled={loading} onPress={() => logout()}>
        {loading ? <ActivityIndicator /> : <Text className="text-danger">Log out</Text>}
      </Pressable>
    </View>
  );
}
