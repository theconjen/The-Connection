import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import apiClient from '../lib/apiClient';

/**
 * Notification Settings Screen
 *
 * Allows users to control which types of notifications they receive
 */

interface NotificationPreferences {
  notifyDms: boolean;
  notifyCommunities: boolean;
  notifyForums: boolean;
  notifyFeed: boolean;
}

interface EmailNotificationPreferences {
  emailEventReminders: boolean;
  emailPrayerUpdates: boolean;
  emailCommunityDigest: boolean;
}

export function NotificationSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifyDms: true,
    notifyCommunities: true,
    notifyForums: true,
    notifyFeed: true,
  });
  const [emailPreferences, setEmailPreferences] = useState<EmailNotificationPreferences>({
    emailEventReminders: true,
    emailPrayerUpdates: true,
    emailCommunityDigest: true,
  });

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/user');
      const user = response.data;

      setPreferences({
        notifyDms: user.notifyDms ?? true,
        notifyCommunities: user.notifyCommunities ?? true,
        notifyForums: user.notifyForums ?? true,
        notifyFeed: user.notifyFeed ?? true,
      });

      // Load email notification preferences
      try {
        const emailResponse = await apiClient.get('/api/user/notification-preferences');
        const emailPrefs = emailResponse.data;
        setEmailPreferences({
          emailEventReminders: emailPrefs.emailEventReminders ?? true,
          emailPrayerUpdates: emailPrefs.emailPrayerUpdates ?? true,
          emailCommunityDigest: emailPrefs.emailCommunityDigest ?? true,
        });
      } catch {
        // Fall back to user object if notification-preferences endpoint fails
        setEmailPreferences({
          emailEventReminders: user.emailEventReminders ?? true,
          emailPrayerUpdates: user.emailPrayerUpdates ?? true,
          emailCommunityDigest: user.emailCommunityDigest ?? true,
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      // Optimistically update UI
      setPreferences(prev => ({ ...prev, [key]: value }));
      setSaving(true);

      // Send update to server
      await apiClient.put('/api/user', { [key]: value });

    } catch (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(false);
    }
  };

  const updateEmailPreference = async (key: keyof EmailNotificationPreferences, value: boolean) => {
    try {
      setEmailPreferences(prev => ({ ...prev, [key]: value }));
      setSaving(true);
      await apiClient.patch('/api/user/notification-preferences', { [key]: value });
    } catch (error) {
      setEmailPreferences(prev => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Settings</Text>
        <Text style={styles.subtitle}>
          Choose which notifications you want to receive
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Direct Messages</Text>
            <Text style={styles.settingDescription}>
              Get notified when someone sends you a message
            </Text>
          </View>
          <Switch
            value={preferences.notifyDms}
            onValueChange={(value) => updatePreference('notifyDms', value)}
            disabled={saving}
            trackColor={{ false: '#ccc', true: '#818cf8' }}
            thumbColor={preferences.notifyDms ? '#6366f1' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Communities & Events</Text>
            <Text style={styles.settingDescription}>
              New posts, events, and event updates in your communities
            </Text>
          </View>
          <Switch
            value={preferences.notifyCommunities}
            onValueChange={(value) => updatePreference('notifyCommunities', value)}
            disabled={saving}
            trackColor={{ false: '#ccc', true: '#818cf8' }}
            thumbColor={preferences.notifyCommunities ? '#6366f1' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Post Comments & Replies</Text>
            <Text style={styles.settingDescription}>
              When someone comments on or replies to your posts
            </Text>
          </View>
          <Switch
            value={preferences.notifyForums}
            onValueChange={(value) => updatePreference('notifyForums', value)}
            disabled={saving}
            trackColor={{ false: '#ccc', true: '#818cf8' }}
            thumbColor={preferences.notifyForums ? '#6366f1' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Likes & Activity</Text>
            <Text style={styles.settingDescription}>
              When someone likes or interacts with your content
            </Text>
          </View>
          <Switch
            value={preferences.notifyFeed}
            onValueChange={(value) => updatePreference('notifyFeed', value)}
            disabled={saving}
            trackColor={{ false: '#ccc', true: '#818cf8' }}
            thumbColor={preferences.notifyFeed ? '#6366f1' : '#f4f3f4'}
          />
        </View>
      </View>

      <Text style={styles.sectionHeader}>EMAIL NOTIFICATIONS</Text>

      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Event Reminders</Text>
            <Text style={styles.settingDescription}>
              Receive email reminders for upcoming events you've RSVP'd to
            </Text>
          </View>
          <Switch
            value={emailPreferences.emailEventReminders}
            onValueChange={(value) => updateEmailPreference('emailEventReminders', value)}
            disabled={saving}
            trackColor={{ false: '#ccc', true: '#818cf8' }}
            thumbColor={emailPreferences.emailEventReminders ? '#6366f1' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Prayer Updates</Text>
            <Text style={styles.settingDescription}>
              Email updates when someone responds to your prayer requests
            </Text>
          </View>
          <Switch
            value={emailPreferences.emailPrayerUpdates}
            onValueChange={(value) => updateEmailPreference('emailPrayerUpdates', value)}
            disabled={saving}
            trackColor={{ false: '#ccc', true: '#818cf8' }}
            thumbColor={emailPreferences.emailPrayerUpdates ? '#6366f1' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Community Digest</Text>
            <Text style={styles.settingDescription}>
              Weekly email digest of activity in your communities
            </Text>
          </View>
          <Switch
            value={emailPreferences.emailCommunityDigest}
            onValueChange={(value) => updateEmailPreference('emailCommunityDigest', value)}
            disabled={saving}
            trackColor={{ false: '#ccc', true: '#818cf8' }}
            thumbColor={emailPreferences.emailCommunityDigest ? '#6366f1' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ℹ️ Even if push notifications are disabled, you'll still see notifications in your notification center.
        </Text>
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
    paddingHorizontal: 4,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  savingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#6366f1',
  },
});
