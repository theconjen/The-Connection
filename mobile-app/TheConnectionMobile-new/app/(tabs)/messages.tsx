/**
 * Messages Tab - Direct Messages
 */

import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import MessagesScreen from '../../src/screens/Messages';

export default function MessagesTab() {
  const router = useRouter();

  return (
    <MessagesScreen
      onConversationPress={(userId) => {
        router.push(`/messages/${userId}`);
      }}
      onSettingsPress={() => {
        router.push('/settings');
      }}
      onNewMessagePress={() => {
        // Navigate to new message screen (Instagram-style)
        router.push('/new-message');
      }}
      onProfilePress={() => {
        router.push('/(tabs)/profile');
      }}
    />
  );
}
