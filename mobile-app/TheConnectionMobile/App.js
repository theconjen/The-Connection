import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>The Connection</Text>
        <Text style={styles.subtitle}>Christian Community Platform</Text>
      </View>
      
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
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Prayer Requests</Text>
        <View style={styles.prayerItem}>
          <Text style={styles.prayerText}>Please pray for healing and strength...</Text>
          <TouchableOpacity style={styles.prayButton}>
            <Text style={styles.prayButtonText}>🙏 Pray (23)</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.prayerItem}>
          <Text style={styles.prayerText}>Seeking God's guidance for my family...</Text>
          <TouchableOpacity style={styles.prayButton}>
            <Text style={styles.prayButtonText}>🙏 Pray (15)</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Built with love for the Christian community ❤️</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#E91E63',
    borderRadius: 10,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  verseText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#444',
    lineHeight: 24,
    marginBottom: 8,
  },
  verseReference: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
  },
  prayerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  prayerText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
  prayButton: {
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E91E63',
  },
  prayButtonText: {
    color: '#E91E63',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
