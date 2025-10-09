import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '../../src/components/ui';
import { useAuth } from '../../src/auth/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const { login } = useAuth();

  const onSubmit = async () => {
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/feed');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 gap-3">
        <Text className="text-2xl font-semibold mb-2">Log in</Text>
        {error ? <Text className="text-red-600 mb-2">{error}</Text> : null}
        <Input placeholder="Email or Username" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Button title="Sign In" onPress={onSubmit} />
  <Button variant="link" title="Create an account" onPress={() => router.push('/(auth)/register')} />
  <Button variant="link" title="Back to Feed" onPress={() => router.push('/(tabs)/feed')} />
      </View>
    </ScrollView>
  );
}
