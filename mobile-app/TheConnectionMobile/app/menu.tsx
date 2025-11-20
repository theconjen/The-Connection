/**
 * Hamburger Menu Screen
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { Colors } from '../../src/shared/colors';

export default function MenuScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const MenuItem = ({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Menu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FEATURES</Text>
          <MenuItem icon="🙏" title="Prayer Requests" onPress={() => router.push('/(tabs)/prayers')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <MenuItem icon="👤" title="Profile" onPress={() => router.push('/(tabs)/profile')} />
          <MenuItem icon="⚙️" title="Settings" onPress={() => router.push('/settings')} />
          <MenuItem icon="🚫" title="Blocked Users" onPress={() => router.push('/blocked-users')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backIcon: { fontSize: 24, color: Colors.primary },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  content: { flex: 1 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#9ca3af', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f3f4f6' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIcon: { fontSize: 24, marginRight: 16 },
  menuTitle: { flex: 1, fontSize: 16, color: '#1f2937' },
  menuArrow: { fontSize: 20, color: '#9ca3af' },
});
