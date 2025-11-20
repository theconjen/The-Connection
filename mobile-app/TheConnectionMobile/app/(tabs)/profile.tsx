/**
 * Profile Screen
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors } from '../../src/shared/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.displayName}>{user?.displayName || user?.username}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/edit')}>
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Privacy</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Help Center</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('https://app.theconnection.app/privacy')}
          >
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('https://app.theconnection.app/community-guidelines')}
          >
            <Text style={styles.menuItemText}>Community Guidelines</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>About</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  content: { flex: 1 },
  profileSection: { backgroundColor: '#fff', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'Colors.primary', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  displayName: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  username: { fontSize: 16, color: '#6b7280', marginBottom: 4 },
  email: { fontSize: 14, color: '#9ca3af' },
  section: { backgroundColor: '#fff', marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', padding: 16, paddingBottom: 8 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  menuItemText: { fontSize: 16, color: '#1f2937' },
  menuItemIcon: { fontSize: 24, color: '#9ca3af' },
  logoutButton: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  logoutButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
