import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return <Redirect href={user ? '/(tabs)/feed' : '/(auth)/login'} />;
}
