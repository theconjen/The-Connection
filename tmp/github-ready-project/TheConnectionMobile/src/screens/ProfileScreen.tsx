import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MobileCard from '../components/MobileCard';
import TouchFeedback from '../components/TouchFeedback';
import { useAuth } from '../hooks/useAuth';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Please sign in to view your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#E91E63', '#9C27B0']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.displayName}>{user.displayName || user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </LinearGradient>

        {/* User Stats */}
        <MobileCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Communities</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Prayers</Text>
            </View>
          </View>
        </MobileCard>

        {/* Account Info */}
        <MobileCard style={styles.infoCard}>
          <Text style={styles.cardTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {user.city && user.state && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{user.city}, {user.state}</Text>
            </View>
          )}

          {user.isVerifiedApologeticsAnswerer && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badge}>✅ Verified Apologetics Answerer</Text>
            </View>
          )}

          {user.isAdmin && (
            <View style={styles.badgeContainer}>
              <Text style={styles.adminBadge}>🛡️ Administrator</Text>
            </View>
          )}
        </MobileCard>

        {/* Settings */}
        <MobileCard style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Settings</Text>
          
          <TouchFeedback style={styles.settingItem} hapticType="light">
            <Text style={styles.settingText}>Edit Profile</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchFeedback>
          
          <TouchFeedback style={styles.settingItem} hapticType="light">
            <Text style={styles.settingText}>Notification Preferences</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchFeedback>
          
          <TouchFeedback style={styles.settingItem} hapticType="light">
            <Text style={styles.settingText}>Privacy Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchFeedback>
          
          <TouchFeedback 
            style={[styles.settingItem, styles.logoutItem]} 
            onPress={handleLogout}
            hapticType="warning"
          >
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchFeedback>
        </MobileCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsCard: {
    margin: 20,
    marginTop: -20,
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1D29',
    fontWeight: '500',
  },
  badgeContainer: {
    marginTop: 12,
  },
  badge: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  adminBadge: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  settingsCard: {
    margin: 20,
    marginTop: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingText: {
    fontSize: 16,
    color: '#1A1D29',
  },
  chevron: {
    fontSize: 16,
    color: '#64748B',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
});