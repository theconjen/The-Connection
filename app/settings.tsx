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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../src/lib/apiClient';
import { useTheme } from '../src/contexts/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { theme, setTheme, colorScheme, colors } = useTheme();
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [isPrivateAccount, setIsPrivateAccount] = React.useState(
    user?.profileVisibility === 'private'
  );

  // Birthday state
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [birthday, setBirthday] = React.useState<Date | null>(
    user?.dateOfBirth ? new Date(user.dateOfBirth) : null
  );
  const maxDate = new Date(); // Can't select future dates

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

  const updateBirthdayMutation = useMutation({
    mutationFn: async (dateOfBirth: string) => {
      const response = await apiClient.patch('/api/user/settings', {
        dateOfBirth,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      Alert.alert('Success', 'Your birthday has been updated.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update birthday';
      Alert.alert('Error', message);
    },
  });

  const handleBirthdayChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setBirthday(selectedDate);
      // Format as ISO date string (YYYY-MM-DD)
      const dobString = selectedDate.toISOString().split('T')[0];
      updateBirthdayMutation.mutate(dobString);
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const formatBirthday = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
      style={[
        styles.settingsItem,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle,
        }
      ]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <Ionicons
        name={icon as any}
        size={22}
        color={danger ? colors.destructive : colors.textPrimary}
      />
      <Text style={[
        styles.settingsLabel,
        { color: danger ? colors.destructive : colors.textPrimary }
      ]}>
        {label}
      </Text>
      {rightElement ? rightElement : (
        showArrow && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <SectionHeader title="ACCOUNT" />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
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
          <SettingsItem
            icon="calendar-outline"
            label="Birthday"
            onPress={() => setShowDatePicker(true)}
            rightElement={
              <View style={styles.themeValue}>
                <Text style={[styles.themeValueText, { color: colors.textSecondary }]}>
                  {formatBirthday(birthday)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            }
          />
        </View>

        {/* Birthday Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={birthday || new Date(new Date().getFullYear() - 18, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={maxDate}
            onChange={handleBirthdayChange}
            themeVariant={colorScheme}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <View style={[styles.datePickerDoneContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.datePickerDoneButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={[styles.datePickerDoneText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Appearance Section */}
        <SectionHeader title="APPEARANCE" />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <SettingsItem
            icon="moon-outline"
            label="Dark Mode"
            onPress={handleThemePress}
            rightElement={
              <View style={styles.themeValue}>
                <Text style={[styles.themeValueText, { color: colors.textSecondary }]}>{getThemeLabel()}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            }
          />
        </View>

        {/* Notifications Section */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
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
                trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
              />
            }
          />
        </View>

        {/* Privacy Section */}
        <SectionHeader title="PRIVACY" />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <SettingsItem
            icon="eye-off-outline"
            label="Private Account"
            showArrow={false}
            rightElement={
              <Switch
                value={isPrivateAccount}
                onValueChange={handlePrivacyToggle}
                trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
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
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
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
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <SettingsItem
            icon="information-circle-outline"
            label="App Version"
            showArrow={false}
            rightElement={<Text style={[styles.versionText, { color: colors.textSecondary }]}>1.0.0</Text>}
          />
        </View>

        {/* Logout */}
        <View style={[styles.section, styles.logoutSection, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  section: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  versionText: {
    fontSize: 16,
  },
  themeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  themeValueText: {
    fontSize: 16,
  },
  logoutSection: {
    marginTop: 24,
  },
  bottomPadding: {
    height: 40,
  },
  datePickerDoneContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  datePickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
