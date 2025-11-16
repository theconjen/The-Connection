/**
 * Create Tab - Placeholder/Redirect
 * The actual create functionality is handled by /create-post route
 * This file exists to satisfy Expo Router's requirements
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function CreateScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the create-post screen
    router.replace('/create-post');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8b5cf6" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#637083',
  },
});
