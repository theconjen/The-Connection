import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/shared/ThemeProvider';
import apiClient from '../../src/lib/apiClient';
import { ensurePushTokenRegistered, unregisterStoredPushToken } from '../../src/lib/pushNotifications';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notifyDms, setNotifyDms] = useState(true);
  const [notifyCommunities, setNotifyCommunities] = useState(true);
  const [notifyForums, setNotifyForums] = useState(true);
  const [notifyFeed, setNotifyFeed] = useState(true);
  const attemptedRegistration = useRef(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get('/user/settings');
      const data = response.data;
      setNotifyDms(data.notifyDms !== false);
      setNotifyCommunities(data.notifyCommunities !== false);
      setNotifyForums(data.notifyForums !== false);
      setNotifyFeed(data.notifyFeed !== false);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/user/settings', {
        notifyDms,
        notifyCommunities,
        notifyForums,
        notifyFeed,
      });

      const shouldReceivePushes = notifyDms || notifyCommunities || notifyForums || notifyFeed;
      if (shouldReceivePushes) {
        const token = await ensurePushTokenRegistered();
        if (!token) {
          Alert.alert('Permission needed', 'Enable push notifications for The Connection in your device settings.');
        }
      } else {
        await unregisterStoredPushToken();
      }

      Alert.alert('Success', 'Notification preferences updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const styles = StyleSheet.create({
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
    backButton: {
      padding: 8,
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
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.surface,
      marginTop: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 24,
      backgroundColor: colors.surfaceSecondary,
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
    saveButton: {
      backgroundColor: colors.primary,
      margin: 16,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  useEffect(() => {
    if (isLoading) return;
    if (attemptedRegistration.current) return;

    if (notifyDms || notifyCommunities || notifyForums || notifyFeed) {
      attemptedRegistration.current = true;
      ensurePushTokenRegistered().catch(error => {
        console.warn('Unable to register push token on load', error);
      });
    }
  }, [isLoading, notifyDms, notifyCommunities, notifyForums, notifyFeed]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Notification Preferences */}
        <Text style={styles.sectionHeader}>NOTIFICATION PREFERENCES</Text>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingIconText}>💬</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Direct Messages</Text>
              <Text style={styles.settingSubtitle}>
                Get notified when someone sends you a message
              </Text>
            </View>
            <Switch
              value={notifyDms}
              onValueChange={setNotifyDms}
              trackColor={{ false: colors.muted, true: colors.accent }}
              thumbColor={notifyDms ? colors.primary : colors.surface}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingIconText}>👥</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Communities</Text>
              <Text style={styles.settingSubtitle}>
                Get notified about community activity and updates
              </Text>
            </View>
            <Switch
              value={notifyCommunities}
              onValueChange={setNotifyCommunities}
              trackColor={{ false: colors.muted, true: colors.accent }}
              thumbColor={notifyCommunities ? colors.primary : colors.surface}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingIconText}>💭</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Forums</Text>
              <Text style={styles.settingSubtitle}>
                Get notified about replies and discussions
              </Text>
            </View>
            <Switch
              value={notifyForums}
              onValueChange={setNotifyForums}
              trackColor={{ false: colors.muted, true: colors.accent }}
              thumbColor={notifyForums ? colors.primary : colors.surface}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingIconText}>📰</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Feed Updates</Text>
              <Text style={styles.settingSubtitle}>
                Get notified about new posts in your feed
              </Text>
            </View>
            <Switch
              value={notifyFeed}
              onValueChange={setNotifyFeed}
              trackColor={{ false: colors.muted, true: colors.accent }}
              thumbColor={notifyFeed ? colors.primary : colors.surface}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
