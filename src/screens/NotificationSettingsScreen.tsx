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

export function NotificationSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifyDms: true,
    notifyCommunities: true,
    notifyForums: true,
    notifyFeed: true,
  });

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/user');
      const user = response.data;

      setPreferences({
        notifyDms: user.notifyDms ?? true,
        notifyCommunities: user.notifyCommunities ?? true,
        notifyForums: user.notifyForums ?? true,
        notifyFeed: user.notifyFeed ?? true,
      });
    } catch (error) {
      console.error('Error loading notification preferences:', error);
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
      await apiClient.put('/user', { [key]: value });

      console.info(`[NotificationSettings] Updated ${key} to ${value}`);
    } catch (error) {
      console.error('Error updating notification preference:', error);
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !value }));
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
