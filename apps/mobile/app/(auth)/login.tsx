import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';

export default function Login() {
  const { login, loading, error } = useAuth();
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit() {
    await login({ email, password });
    r.replace('/');
  }

  return (
    <View className="flex-1 bg-bg p-6 gap-4">
      <Text className="text-text text-2xl font-semibold">Sign in</Text>
      <TextInput className="bg-card text-text p-4 rounded" placeholder="Email" placeholderTextColor="#9AA4B2" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput className="bg-card text-text p-4 rounded" placeholder="Password" placeholderTextColor="#9AA4B2" value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable className="bg-primary rounded-xl p-4 items-center" disabled={loading} onPress={onSubmit}>
        {loading ? <ActivityIndicator /> : <Text className="text-white">Sign in</Text>}
      </Pressable>
      {error ? <Text className="text-danger">{error}</Text> : null}
      <Text className="text-muted">No account? <Link href="/(auth)/register" className="text-primary">Create one</Link></Text>
    </View>
  );
}
