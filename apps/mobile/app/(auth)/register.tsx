import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';

export default function Register() {
  const { register, loading, error } = useAuth();
  const r = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit() {
    await register({ name, email, password });
    r.replace('/');
  }

  return (
    <View className="flex-1 bg-bg p-6 gap-4">
      <Text className="text-text text-2xl font-semibold">Create account</Text>
      <TextInput className="bg-card text-text p-4 rounded" placeholder="Name" placeholderTextColor="#9AA4B2" value={name} onChangeText={setName} />
      <TextInput className="bg-card text-text p-4 rounded" placeholder="Email" placeholderTextColor="#9AA4B2" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput className="bg-card text-text p-4 rounded" placeholder="Password" placeholderTextColor="#9AA4B2" value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable className="bg-primary rounded-xl p-4 items-center" disabled={loading} onPress={onSubmit}>
        {loading ? <ActivityIndicator /> : <Text className="text-white">Sign up</Text>}
      </Pressable>
      {error ? <Text className="text-danger">{error}</Text> : null}
    </View>
  );
}
