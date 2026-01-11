import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ApologeticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apologetics</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F8FA' },
  title: { fontSize: 24, fontWeight: '600', color: '#0B132B' },
  subtitle: { fontSize: 16, color: '#637083', marginTop: 8 },
});
