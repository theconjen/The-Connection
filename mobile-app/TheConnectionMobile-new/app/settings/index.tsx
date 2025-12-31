/**
 * Settings Screen - The Connection App
 * 
 * Fixed version with:
 * - Proper API client usage (not relative URLs)
 * - Ionicons instead of emoji (consistent with rest of app)
 * - Your design system colors
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/shared/auth';
import { useTheme } from '../../src/shared/ThemeProvider';

// Icon mapping for settings items
const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  profile: 'person-outline',
  password: 'lock-closed-outline',
  blocked: 'ban-outline',
  notifications: 'notifications-outline',
  privacy: 'shield-checkmark-outline',
  theme: 'moon-outline',
  privacyPolicy: 'document-text-outline',
  terms: 'clipboard-outline',
  guidelines: 'people-outline',
  help: 'help-circle-outline',
  about: 'information-circle-outline',
  logout: 'log-out-outline',
};

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
    // simple helper; keep implementation small here
    // uses Linking in full app
    router.push(url);
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Choose Theme',
      'Select your preferred theme',
      [
        { text: 'Light', onPress: () => setThemePreference('light') },
        { text: 'Dark', onPress: () => setThemePreference('dark') },
        { text: 'System (Auto)', onPress: () => setThemePreference('system') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getThemeLabel = () => {
    switch (preference) {
      case 'dark': return 'Dark Mode';
      case 'light': return 'Light Mode';
      default: return 'System (Auto)';
    }
  };

  const SettingItem = ({
    iconName,
    title,
    subtitle,
    onPress,
    showArrow = true,
    destructive = false,
  }: {
    iconName: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, destructive && styles.settingIconDestructive]}>
        <Ionicons 
          name={iconName} 
          size={22} 
          color={destructive ? colors.destructive : colors.primary} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, destructive && styles.settingTitleDestructive]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={colors.mutedForeground} 
        />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {user && (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{(user.name || user.username || 'U').slice(0,1)}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || user.username}</Text>
              <Text style={styles.userEmail}>{user.email || ''}</Text>
            </View>
          </View>
        )}

        <SectionHeader title="ACCOUNT" />
        <View style={styles.section}>
          <SettingItem
            iconName="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => router.push('/settings/profile')}
          />
          <SettingItem
            iconName="lock-closed-outline"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => router.push('/settings/change-password')}
          />
          <SettingItem
            iconName="ban-outline"
            title="Blocked Users"
            subtitle="Manage blocked users"
            onPress={() => router.push('/settings/blocked-users')}
          />
        </View>

        <SectionHeader title="PREFERENCES" />
        <View style={styles.section}>
          <SettingItem
            iconName="notifications-outline"
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingItem
            iconName="shield-checkmark-outline"
            title="Privacy"
            subtitle="Control who sees your information"
            onPress={() => router.push('/settings/privacy-settings')}
          />
          <SettingItem
            iconName="moon-outline"
            title="Theme"
            subtitle={getThemeLabel()}
            onPress={handleThemeChange}
          />
        </View>

        <SectionHeader title="ABOUT" />
        <View style={styles.section}>
          <SettingItem 
            iconName="people-outline" 
            title="Community Guidelines" 
            onPress={() => router.push('/settings/guidelines')} 
          />
          <SettingItem 
            iconName="document-text-outline" 
            title="Privacy Policy" 
            onPress={() => router.push('/settings/privacy')} 
          />
          <SettingItem 
            iconName="information-circle-outline" 
            title="About" 
            onPress={() => openLink('https://theconnection.app/about')} 
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
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
    backButton: { padding: 4 },
    title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    content: { flex: 1 },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      marginTop: 16,
      marginHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    userAvatarText: { fontSize: 24, fontWeight: 'bold', color: colors.primaryForeground },
    userInfo: { flex: 1 },
    userName: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 2 },
    userEmail: { fontSize: 14, color: colors.textSecondary },
    sectionHeader: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, paddingHorizontal: 16, paddingVertical: 12, paddingTop: 24, backgroundColor: colors.background, letterSpacing: 0.5 },
    section: { backgroundColor: colors.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight || colors.border },
    settingIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surfaceSecondary || `${colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    settingIconDestructive: { backgroundColor: `${colors.destructive}15` },
    settingContent: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 2 },
    settingTitleDestructive: { color: colors.destructive },
    settingSubtitle: { fontSize: 13, color: colors.textSecondary },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.destructive, gap: 8 },
    logoutText: { fontSize: 16, fontWeight: '600', color: colors.destructive },
  });
}
