import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../src/lib/apiClient';
import { useTheme } from '../src/contexts/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { theme, setTheme, colorScheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [isPrivateAccount, setIsPrivateAccount] = React.useState(
    user?.profileVisibility === 'private'
  );

  const updatePrivacyMutation = useMutation({
    mutationFn: async (isPrivate: boolean) => {
      const response = await apiClient.patch('/user/profile-visibility', {
        visibility: isPrivate ? 'private' : 'public',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update privacy setting';
      Alert.alert('Error', message);
      // Revert the toggle
      setIsPrivateAccount(!isPrivateAccount);
    },
  });

  const handlePrivacyToggle = (value: boolean) => {
    setIsPrivateAccount(value);
    updatePrivacyMutation.mutate(value);
  };

  const handleThemePress = () => {
    Alert.alert(
      'Appearance',
      'Choose your app theme',
      [
        {
          text: 'Light',
          onPress: () => setTheme('light'),
        },
        {
          text: 'Dark',
          onPress: () => setTheme('dark'),
        },
        {
          text: 'System Default',
          onPress: () => setTheme('system'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const getThemeLabel = () => {
    if (theme === 'system') return `System (${colorScheme === 'dark' ? 'Dark' : 'Light'})`;
    return theme === 'dark' ? 'Dark' : 'Light';
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const SettingsItem = ({ 
    icon, 
    label, 
    onPress, 
    showArrow = true,
    rightElement,
    danger = false,
  }: {
    icon: string;
    label: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <Ionicons 
        name={icon as any} 
        size={22} 
        color={danger ? '#DC2626' : '#0B132B'} 
      />
      <Text style={[styles.settingsLabel, danger && styles.dangerText]}>
        {label}
      </Text>
      {rightElement ? rightElement : (
        showArrow && <Ionicons name="chevron-forward" size={20} color="#637083" />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0B132B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.section}>
          <SettingsItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => router.push('/edit-profile')}
          />
          <SettingsItem
            icon="mail-outline"
            label="Email"
            onPress={() => Alert.alert('Email', user?.email || 'Not logged in')}
          />
          <SettingsItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => router.push('/change-password')}
          />
        </View>

        {/* Appearance Section */}
        <SectionHeader title="APPEARANCE" />
        <View style={styles.section}>
          <SettingsItem
            icon="moon-outline"
            label="Dark Mode"
            onPress={handleThemePress}
            rightElement={
              <View style={styles.themeValue}>
                <Text style={styles.themeValueText}>{getThemeLabel()}</Text>
                <Ionicons name="chevron-forward" size={20} color="#637083" />
              </View>
            }
          />
        </View>

        {/* Notifications Section */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.section}>
          <SettingsItem
            icon="notifications-outline"
            label="Notification Preferences"
            onPress={() => router.push('/notification-settings')}
          />
          <SettingsItem
            icon="mail-outline"
            label="Email Notifications"
            showArrow={false}
            rightElement={
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#D1D8DE', true: '#222D99' }}
              />
            }
          />
        </View>

        {/* Privacy Section */}
        <SectionHeader title="PRIVACY" />
        <View style={styles.section}>
          <SettingsItem
            icon="eye-off-outline"
            label="Private Account"
            showArrow={false}
            rightElement={
              <Switch
                value={isPrivateAccount}
                onValueChange={handlePrivacyToggle}
                trackColor={{ false: '#D1D8DE', true: '#222D99' }}
                disabled={updatePrivacyMutation.isPending}
              />
            }
          />
          <SettingsItem
            icon="ban-outline"
            label="Blocked Users"
            onPress={() => router.push('/blocked-users')}
          />
          <SettingsItem
            icon="trash-outline"
            label="Delete Account"
            onPress={() => router.push('/delete-account')}
            danger
          />
        </View>

        {/* Support Section */}
        <SectionHeader title="SUPPORT" />
        <View style={styles.section}>
          <SettingsItem
            icon="help-circle-outline"
            label="Help Center"
            onPress={() => Alert.alert('Help', 'Contact support@theconnection.app for help.')}
          />
          <SettingsItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://theconnection.app/terms')}
          />
          <SettingsItem
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://theconnection.app/privacy')}
          />
        </View>

        {/* About Section */}
        <SectionHeader title="ABOUT" />
        <View style={styles.section}>
          <SettingsItem
            icon="information-circle-outline"
            label="App Version"
            showArrow={false}
            rightElement={<Text style={styles.versionText}>1.0.0</Text>}
          />
        </View>

        {/* Logout */}
        <View style={[styles.section, styles.logoutSection]}>
          <SettingsItem
            icon="log-out-outline"
            label="Log Out"
            onPress={handleLogout}
            showArrow={false}
            danger
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B132B',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#637083',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D1D8DE',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    color: '#0B132B',
    marginLeft: 12,
  },
  dangerText: {
    color: '#DC2626',
  },
  versionText: {
    fontSize: 16,
    color: '#637083',
  },
  themeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  themeValueText: {
    fontSize: 16,
    color: '#637083',
  },
  logoutSection: {
    marginTop: 24,
  },
  bottomPadding: {
    height: 40,
  },
});
