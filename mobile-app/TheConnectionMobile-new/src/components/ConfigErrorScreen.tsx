/**
 * Configuration Error Screen
 *
 * PRODUCTION HARDENING: Displayed when critical config is missing.
 * Blocks app usage until configuration is fixed.
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { getConfigErrors } from '../lib/config';

export function ConfigErrorScreen() {
  const errors = getConfigErrors();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>Configuration Error</Text>
        <Text style={styles.subtitle}>
          The app cannot start due to missing configuration.
        </Text>

        <View style={styles.errorList}>
          {errors.map((error, index) => (
            <Text key={index} style={styles.errorItem}>
              • {error}
            </Text>
          ))}
        </View>

        <Text style={styles.footer}>
          Please contact support if this issue persists.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a2a4a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#637083',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorList: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  errorItem: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 8,
  },
  footer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
