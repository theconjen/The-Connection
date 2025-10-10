import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { API_BASE, apiGet } from './src/services/api';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

function Home() {
  const { data: health, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet('/health'),
  });
  const { data: apologetics, isLoading: apLoading, error: apError } = useQuery({
    queryKey: ['apologetics'],
    queryFn: () => apiGet('/apologetics'),
  });

  const loading = healthLoading || apLoading;
  const error = (healthError || apError);
  const apologeticsCount = Array.isArray(apologetics) ? apologetics.length : 0;

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />

      <ImageBackground
        source={require('./assets/icon.png')}
        style={styles.header}
        imageStyle={styles.headerImage}
      >
        <Text style={styles.title}>The Connection</Text>
        <Text style={styles.subtitle}>Christian Community Platform</Text>
      </ImageBackground>

      {loading ? (
        <View style={styles.card}><ActivityIndicator /></View>
      ) : error ? (
        <View style={styles.card}><Text style={styles.error}>{String(error?.message || error)}</Text></View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>API Connected</Text>
          <Text style={styles.cardText}>Health: {JSON.stringify(health)}</Text>
          <Text style={styles.cardText}>Apologetics topics: {apologeticsCount}</Text>
          <Text style={styles.cardText}>API Base: {API_BASE}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome to Faith Community!</Text>
        <Text style={styles.cardText}>
          Connect with fellow believers, share prayer requests, join Bible studies, and grow together in faith.
        </Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>🙏 Join Prayer Circle</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>📖 Bible Study Groups</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>⛪ Find Communities</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>📅 Upcoming Events</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Verse</Text>
        <Text style={styles.verseText}>
          "For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you, to give you hope and a future."
        </Text>
        <Text style={styles.verseReference}>- Jeremiah 29:11</Text>
      </View>

      {/* NativeWind demo block */}
      <View className="mx-4 mb-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
        <Text className="text-lg font-semibold">NativeWind is working</Text>
        <Text className="text-sm text-gray-600">Tailwind classes are applied in React Native.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Built with love for the Christian community ❤️</Text>
      </View>
    </ScrollView>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30, backgroundColor: '#fff', marginBottom: 20 },
  headerImage: { opacity: 0.15, resizeMode: 'cover' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#E91E63', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 12 },
  cardText: { fontSize: 16, color: '#666', lineHeight: 24 },
  error: { color: '#b00020' },
  button: { backgroundColor: '#E91E63', borderRadius: 10, padding: 18, marginHorizontal: 16, marginBottom: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  verseText: { fontSize: 16, fontStyle: 'italic', color: '#444', lineHeight: 24, marginBottom: 8 },
  verseReference: { fontSize: 14, color: '#888', textAlign: 'right' },
  footer: { padding: 20, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#888', textAlign: 'center' },
});
