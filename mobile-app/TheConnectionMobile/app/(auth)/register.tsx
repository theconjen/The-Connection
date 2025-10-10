import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '../../src/components/ui';
import { api } from '../../src/lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    try {
      await api.post('/register', { username, email, password });
      router.replace('/(tabs)/feed');
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 gap-3">
        <Text className="text-2xl font-semibold mb-2">Create account</Text>
        {error ? <Text className="text-red-600 mb-2">{error}</Text> : null}
        <Input placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
        <Input placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Button title="Sign Up" onPress={onSubmit} />
        <Button variant="link" title="I already have an account" onPress={() => router.push('/(auth)/login')} />
      </View>
    </ScrollView>
  );
}
