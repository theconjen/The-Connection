/**
 * Settings Screen
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
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/shared/ThemeProvider';
import { LEGAL_URLS, SUPPORT_EMAIL } from '../src/config';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, preference, setThemePreference } = useTheme();
  const styles = createStyles(colors);

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

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() =>
      Alert.alert('Error', 'Could not open email client')
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
            onPress={() => router.push('/settings/change-password')}
          />
          <SettingItem
            icon="🚫"
            title="Blocked Users"
            subtitle="Manage blocked users"
            onPress={() => router.push('/blocked-users')}
          />
        </View>

        {/* Preferences Section */}
        <SectionHeader title="PREFERENCES" />
        <View style={styles.section}>
          <SettingItem
            icon="🔔"
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingItem
            icon="🔒"
            title="Privacy"
            subtitle="Control who sees your information"
            onPress={() => router.push('/settings/privacy')}
          />
          <SettingItem
            icon="🌙"
            title="Theme"
            subtitle={
              preference === 'system' ? 'System (Auto)' :
              preference === 'dark' ? 'Dark Mode' : 'Light Mode'
            }
            onPress={() => {
              Alert.alert(
                'Choose Theme',
                'Select your preferred theme',
                [
                  {
                    text: 'Light',
                    onPress: () => setThemePreference('light'),
                  },
                  {
                    text: 'Dark',
                    onPress: () => setThemePreference('dark'),
                  },
                  {
                    text: 'System (Auto)',
                    onPress: () => setThemePreference('system'),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          />
        </View>

        {/* Legal & Support */}
        <SectionHeader title="LEGAL & SUPPORT" />
        <View style={styles.section}>
          <SettingItem
            icon="📜"
            title="Privacy Policy"
            subtitle="Learn how we protect your data"
            onPress={() => openLink(LEGAL_URLS.privacy)}
          />
          <SettingItem
            icon="📋"
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            onPress={() => openLink(LEGAL_URLS.terms)}
          />
          <SettingItem
            icon="👥"
            title="Community Guidelines"
            subtitle="Understand our community expectations"
            onPress={() => openLink(LEGAL_URLS.community)}
          />
          <SettingItem
            icon="❓"
            title="Help & Support"
            subtitle="Get help with the app"
            onPress={() => openLink(LEGAL_URLS.support)}
          />
          <SettingItem
            icon="✉️"
            title="Email Support"
            subtitle={SUPPORT_EMAIL}
            onPress={() => openEmail(SUPPORT_EMAIL)}
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

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 60,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backIcon: {
      fontSize: 24,
      color: colors.text,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 24,
      backgroundColor: colors.surfaceSecondary,
    },
    section: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceSecondary,
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
      color: colors.text,
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    settingArrow: {
      fontSize: 24,
      color: colors.mutedForeground,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      margin: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.destructive,
    },
    logoutIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.destructive,
    },
  });
}
