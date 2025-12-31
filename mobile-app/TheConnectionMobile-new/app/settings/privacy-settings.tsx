/**
 * Privacy Settings Screen - The Connection App
 * 
 * Native privacy settings (not a WebView).
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/shared/ThemeProvider';
import { apiClient } from '../../src/lib/apiClient';

interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowDmsFrom: 'everyone' | 'followers' | 'none';
  allowGroupInvites: boolean;
  showInSearch: boolean;
  showInSuggestions: boolean;
  allowLocationSharing: boolean;
  showActivityStatus: boolean;
  showCommunitiesJoined: boolean;
}

type VisibilityOption = 'public' | 'followers' | 'private';
type DmOption = 'everyone' | 'followers' | 'none';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showOnlineStatus: true,
    showLastSeen: true,
    allowDmsFrom: 'everyone',
    allowGroupInvites: true,
    showInSearch: true,
    showInSuggestions: true,
    allowLocationSharing: false,
    showActivityStatus: true,
    showCommunitiesJoined: true,
  });

  const loadSettings = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/user/privacy-settings');
      if (response.data) setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/api/user/privacy-settings', settings);
      Alert.alert('Success', 'Privacy settings saved');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', 'Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Privacy</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  const visibilityLabels: Record<VisibilityOption, string> = { public: 'Everyone', followers: 'Followers Only', private: 'Only Me' };
  const dmLabels: Record<DmOption, string> = { everyone: 'Everyone', followers: 'Followers Only', none: 'No One' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={styles.infoBannerText}>Control who sees your profile and activity</Text>
        </View>

        <Text style={styles.sectionHeader}>PROFILE VISIBILITY</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem} onPress={() => {/* choose visibility */}}>
            <View style={styles.settingIcon}><Ionicons name="people-outline" size={20} color={colors.primary} /></View>
            <View style={styles.settingContent}><Text style={styles.settingTitle}>Profile Visibility</Text><Text style={styles.settingSubtitle}>{visibilityLabels[settings.profileVisibility]}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: 4 }, title: { fontSize: 20, fontWeight: 'bold', color: colors.text }, placeholder: { width: 40 }, content: { flex: 1 }, loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }, infoBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, margin: 16, marginBottom: 0, backgroundColor: `${colors.primary}15`, borderRadius: 10, gap: 10 }, infoBannerText: { flex: 1, fontSize: 13, color: colors.primary }, sectionHeader: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 24, backgroundColor: colors.background, letterSpacing: 0.5 }, section: { backgroundColor: colors.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border }, settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight || colors.border }, settingIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surfaceSecondary || `${colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }, settingContent: { flex: 1 }, settingTitle: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 2 }, settingSubtitle: { fontSize: 13, color: colors.textSecondary }, saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, margin: 16, padding: 16, borderRadius: 10, gap: 8 }, saveButtonDisabled: { opacity: 0.6 }, saveButtonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  });
}
