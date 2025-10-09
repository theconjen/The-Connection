import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import { Redirect } from 'expo-router';

export default function Home() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator />
      </View>
    );
  }
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <View className="flex-1 items-center justify-center bg-bg">
      <Text className="text-text text-xl">Welcome, {user.email}</Text>
    </View>
  );
}
