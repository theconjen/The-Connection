import React from 'react';
import { View, Text } from 'react-native';

export function MessageDetail({ onBack, user }: { onBack?: () => void; user?: any }) {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: '600', marginBottom: 8 }}>{user?.name || 'Conversation'}</Text>
      <Text style={{ color: '#666' }}>Message thread preview (stub)</Text>
    </View>
  );
}
