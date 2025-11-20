/**
 * Comprehensive Settings Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { Colors } from '../../src/shared/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Notification Settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [mentionNotifications, setMentionNotifications] = useState(true);

  // Privacy Settings
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);

  // App Settings
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open link')
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Text style={styles.settingArrow}>›</Text>}
    </TouchableOpacity>
  );

  const SettingToggle = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
        thumbColor={value ? 'Colors.primary' : '#f3f4f6'}
      />
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Account Section */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.section}>
          <SettingItem
            icon="👤"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => router.push('/profile/edit')}
          />
          <SettingItem
            icon="🔒"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => Alert.alert('Coming Soon', 'Password change feature')}
          />
          <SettingItem
            icon="📧"
            title="Email Settings"
            subtitle={user?.email || 'Update your email'}
            onPress={() => Alert.alert('Coming Soon', 'Email settings feature')}
          />
        </View>

        {/* Notifications Section */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.section}>
          <SettingToggle
            icon="🔔"
            title="Push Notifications"
            subtitle="Receive push notifications"
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <SettingToggle
            icon="📬"
            title="Email Notifications"
            subtitle="Receive email notifications"
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />
          <SettingToggle
            icon="💬"
            title="Comment Notifications"
            subtitle="When someone comments on your posts"
            value={commentNotifications}
            onValueChange={setCommentNotifications}
          />
          <SettingToggle
            icon="@"
            title="Mention Notifications"
            subtitle="When someone mentions you"
            value={mentionNotifications}
            onValueChange={setMentionNotifications}
          />
        </View>

        {/* Privacy Section */}
        <SectionHeader title="PRIVACY & SECURITY" />
        <View style={styles.section}>
          <SettingToggle
            icon="👁️"
            title="Public Profile"
            subtitle="Make your profile visible to everyone"
            value={profileVisibility}
            onValueChange={setProfileVisibility}
          />
          <SettingToggle
            icon="📧"
            title="Show Email"
            subtitle="Display email on your profile"
            value={showEmail}
            onValueChange={setShowEmail}
          />
          <SettingToggle
            icon="✉️"
            title="Allow Messages"
            subtitle="Let other users send you messages"
            value={allowMessages}
            onValueChange={setAllowMessages}
          />
          <SettingItem
            icon="🚫"
            title="Blocked Users"
            subtitle="Manage blocked users"
            onPress={() => router.push('/blocked-users')}
          />
        </View>

        {/* App Settings */}
        <SectionHeader title="APP SETTINGS" />
        <View style={styles.section}>
          <SettingToggle
            icon="🌙"
            title="Dark Mode"
            subtitle="Enable dark theme"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <SettingItem
            icon="🌐"
            title="Language"
            subtitle="English (US)"
            onPress={() => Alert.alert('Coming Soon', 'Language selection')}
          />
          <SettingItem
            icon="💾"
            title="Data Usage"
            subtitle="Manage data and storage"
            onPress={() => Alert.alert('Coming Soon', 'Data usage settings')}
          />
        </View>

        {/* Legal & Support */}
        <SectionHeader title="LEGAL & SUPPORT" />
        <View style={styles.section}>
          <SettingItem
            icon="📜"
            title="Privacy Policy"
            subtitle="Learn how we protect your data"
            onPress={() => openLink('https://app.theconnection.app/privacy')}
          />
          <SettingItem
            icon="📋"
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            onPress={() => openLink('https://app.theconnection.app/terms')}
          />
          <SettingItem
            icon="👥"
            title="Community Guidelines"
            subtitle="Understand our community expectations"
            onPress={() =>
              openLink('https://app.theconnection.app/community-guidelines')
            }
          />
          <SettingItem
            icon="❓"
            title="Help & Support"
            subtitle="Get help with the app"
            onPress={() => openLink('https://app.theconnection.app/support')}
          />
          <SettingItem
            icon="📝"
            title="Send Feedback"
            subtitle="Help us improve"
            onPress={() => Alert.alert('Coming Soon', 'Feedback form')}
          />
        </View>

        {/* About */}
        <SectionHeader title="ABOUT" />
        <View style={styles.section}>
          <SettingItem
            icon="ℹ️"
            title="About The Connection"
            subtitle="Version 1.0.0"
            showArrow={false}
          />
          <SettingItem
            icon="⭐"
            title="Rate the App"
            subtitle="Share your experience"
            onPress={() => Alert.alert('Coming Soon', 'App store rating')}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backIcon: {
    fontSize: 24,
    color: 'Colors.primary',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 24,
    backgroundColor: '#f3f4f6',
  },
  section: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIconText: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
  },
  settingArrow: {
    fontSize: 24,
    color: '#d1d5db',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
