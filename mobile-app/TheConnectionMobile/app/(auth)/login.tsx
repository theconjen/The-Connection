import React from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 gap-3">
        <Text className="text-2xl font-semibold mb-2">Log in</Text>
        <Input placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Button title="Sign In" onPress={() => router.push('/(tabs)/feed')} />
        <Button variant="link" title="Back to Feed" onPress={() => router.push('/(tabs)/feed')} />
      </View>
    </ScrollView>
  );
}
