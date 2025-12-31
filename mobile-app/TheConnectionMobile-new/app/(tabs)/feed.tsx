/**
 * Feed Tab Screen
 * Native feed implementation with stories and posts
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FeedScreen from '../../src/screens/FeedScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

export default function FeedTab() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        <FeedScreen />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
