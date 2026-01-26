/**
 * Deep Link Health Debug Screen
 *
 * DEV-ONLY screen to diagnose deep linking issues.
 * Shows:
 * - Whether app received the link
 * - Parsed route + params
 * - Whether auth redirected
 * - URL scheme configuration
 * - Recent deep link history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Share,
  RefreshControl,
  Platform,
} from 'react-native';
import { Stack, useRouter, useSegments, usePathname, useLocalSearchParams, useGlobalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Deep link event history (in-memory for this session)
interface DeepLinkEvent {
  id: string;
  timestamp: Date;
  url: string;
  parsedPath: string;
  params: Record<string, string>;
  handled: boolean;
  authState: 'authenticated' | 'unauthenticated' | 'loading';
  redirected: boolean;
  redirectTo?: string;
}

const deepLinkHistory: DeepLinkEvent[] = [];

export default function DeepLinkDebugScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [testResults, setTestResults] = useState<{
    schemeRegistered: boolean;
    universalLinksConfigured: boolean;
    authState: string;
    currentRoute: string;
  } | null>(null);

  // Get app configuration
  const appScheme = Constants.expoConfig?.scheme || 'theconnection';
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier || 'app.theconnection.mobile';
  const packageName = Constants.expoConfig?.android?.package || 'app.theconnection.mobile';
  const associatedDomains = Constants.expoConfig?.ios?.associatedDomains || [];

  // Check initial URL on mount
  useEffect(() => {
    checkInitialUrl();
    runDiagnostics();
  }, []);

  // Listen for incoming deep links
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [user, authLoading]);

  const checkInitialUrl = async () => {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        setCurrentUrl(initialUrl);
        recordDeepLinkEvent(initialUrl, false);
      }
    } catch (error) {
      console.error('Error getting initial URL:', error);
    }
  };

  const handleDeepLink = useCallback(({ url }: { url: string }) => {
    setCurrentUrl(url);
    recordDeepLinkEvent(url, true);
  }, [user, authLoading]);

  const recordDeepLinkEvent = (url: string, handled: boolean) => {
    const parsedUrl = new URL(url);
    const params: Record<string, string> = {};
    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const event: DeepLinkEvent = {
      id: Date.now().toString(),
      timestamp: new Date(),
      url,
      parsedPath: parsedUrl.pathname,
      params,
      handled,
      authState: authLoading ? 'loading' : (user ? 'authenticated' : 'unauthenticated'),
      redirected: !user && !authLoading,
      redirectTo: !user && !authLoading ? '/(auth)/login' : undefined,
    };

    deepLinkHistory.unshift(event);
    // Keep only last 20 events
    if (deepLinkHistory.length > 20) {
      deepLinkHistory.pop();
    }
  };

  const runDiagnostics = async () => {
    const results = {
      schemeRegistered: !!appScheme,
      universalLinksConfigured: associatedDomains.length > 0,
      authState: authLoading ? 'loading' : (user ? 'authenticated' : 'unauthenticated'),
      currentRoute: pathname,
    };
    setTestResults(results);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    runDiagnostics();
    checkInitialUrl();
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const testDeepLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot Open', `Device cannot handle URL: ${url}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open URL: ${error}`);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Copied to clipboard');
  };

  const shareDebugInfo = async () => {
    const info = {
      platform: Platform.OS,
      appScheme,
      bundleId,
      packageName,
      associatedDomains,
      currentRoute: pathname,
      segments,
      authState: authLoading ? 'loading' : (user ? 'authenticated' : 'unauthenticated'),
      recentLinks: deepLinkHistory.slice(0, 5),
    };

    await Share.share({
      message: `Deep Link Debug Info:\n${JSON.stringify(info, null, 2)}`,
      title: 'Deep Link Debug Info',
    });
  };

  const styles = createStyles(colors);

  // Test URLs
  const testUrls = [
    { label: 'Custom Scheme - Apologetics', url: `${appScheme}://apologetics/1` },
    { label: 'Custom Scheme - Events', url: `${appScheme}://events/123` },
    { label: 'Custom Scheme - Posts', url: `${appScheme}://posts/456` },
    { label: 'Custom Scheme - Profile', url: `${appScheme}://profile/testuser` },
    { label: 'Custom Scheme - Reset Password', url: `${appScheme}://reset-password?token=test123&email=test@example.com` },
    { label: 'Universal Link - Apologetics', url: 'https://theconnection.app/a/1' },
    { label: 'Universal Link - Event', url: 'https://theconnection.app/e/123' },
    { label: 'Universal Link - Post', url: 'https://theconnection.app/p/456' },
    { label: 'Universal Link - Profile', url: 'https://theconnection.app/u/testuser' },
    { label: 'Universal Link - Reset Password', url: 'https://theconnection.app/reset-password?token=test123' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Deep Link Debug',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="link" size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Deep Link Health</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Diagnose deep linking issues
          </Text>
        </View>

        {/* Configuration Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Configuration
          </Text>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Platform</Text>
            <Text style={[styles.value, { color: colors.text }]}>{Platform.OS}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Custom Scheme</Text>
            <TouchableOpacity onPress={() => copyToClipboard(`${appScheme}://`)}>
              <Text style={[styles.value, styles.copyable, { color: colors.primary }]}>
                {appScheme}://
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {Platform.OS === 'ios' ? 'Bundle ID' : 'Package Name'}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {Platform.OS === 'ios' ? bundleId : packageName}
            </Text>
          </View>

          {Platform.OS === 'ios' && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Associated Domains</Text>
              <View style={styles.listValue}>
                {associatedDomains.map((domain, i) => (
                  <Text key={i} style={[styles.value, { color: colors.text }]}>
                    {domain}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Current State Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Current State
          </Text>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Auth State</Text>
            <View style={styles.statusBadge}>
              <View style={[
                styles.statusDot,
                { backgroundColor: user ? '#22c55e' : (authLoading ? '#f59e0b' : '#ef4444') }
              ]} />
              <Text style={[styles.value, { color: colors.text }]}>
                {authLoading ? 'Loading' : (user ? 'Authenticated' : 'Unauthenticated')}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Current Route</Text>
            <Text style={[styles.value, { color: colors.text }]}>{pathname}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Segments</Text>
            <Text style={[styles.value, { color: colors.text }]}>{segments.join(' → ')}</Text>
          </View>

          {Object.keys(localParams).length > 0 && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Local Params</Text>
              <Text style={[styles.value, styles.code, { color: colors.text, backgroundColor: colors.border }]}>
                {JSON.stringify(localParams, null, 2)}
              </Text>
            </View>
          )}

          {Object.keys(globalParams).length > 0 && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Global Params</Text>
              <Text style={[styles.value, styles.code, { color: colors.text, backgroundColor: colors.border }]}>
                {JSON.stringify(globalParams, null, 2)}
              </Text>
            </View>
          )}
        </View>

        {/* Health Check Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Health Check
          </Text>

          <View style={styles.healthRow}>
            <Ionicons
              name={testResults?.schemeRegistered ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={testResults?.schemeRegistered ? '#22c55e' : '#ef4444'}
            />
            <Text style={[styles.healthLabel, { color: colors.text }]}>
              Custom URL Scheme Registered
            </Text>
          </View>

          <View style={styles.healthRow}>
            <Ionicons
              name={testResults?.universalLinksConfigured ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={testResults?.universalLinksConfigured ? '#22c55e' : '#ef4444'}
            />
            <Text style={[styles.healthLabel, { color: colors.text }]}>
              Universal Links Configured {Platform.OS === 'ios' ? '(iOS)' : '(Android)'}
            </Text>
          </View>

          <View style={styles.healthRow}>
            <Ionicons
              name={user ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={user ? '#22c55e' : '#f59e0b'}
            />
            <Text style={[styles.healthLabel, { color: colors.text }]}>
              User Authenticated {!user && '(some links may redirect to login)'}
            </Text>
          </View>
        </View>

        {/* Test Links Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Test Deep Links
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Tap to test. On simulator, custom scheme links may not work.
          </Text>

          {testUrls.map((test, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.testButton, { borderColor: colors.border }]}
              onPress={() => testDeepLink(test.url)}
              onLongPress={() => copyToClipboard(test.url)}
            >
              <View style={styles.testButtonContent}>
                <Text style={[styles.testLabel, { color: colors.text }]}>{test.label}</Text>
                <Text style={[styles.testUrl, { color: colors.textSecondary }]} numberOfLines={1}>
                  {test.url}
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Links Section */}
        {deepLinkHistory.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Deep Links
            </Text>

            {deepLinkHistory.slice(0, 10).map((event) => (
              <View key={event.id} style={[styles.historyItem, { borderColor: colors.border }]}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                    {event.timestamp.toLocaleTimeString()}
                  </Text>
                  <View style={[
                    styles.historyBadge,
                    { backgroundColor: event.handled ? '#22c55e20' : '#ef444420' }
                  ]}>
                    <Text style={{
                      color: event.handled ? '#22c55e' : '#ef4444',
                      fontSize: 10,
                      fontWeight: '600',
                    }}>
                      {event.handled ? 'HANDLED' : 'INITIAL'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.historyUrl, { color: colors.text }]} numberOfLines={2}>
                  {event.url}
                </Text>

                <View style={styles.historyMeta}>
                  <Text style={[styles.historyMetaText, { color: colors.textSecondary }]}>
                    Path: {event.parsedPath}
                  </Text>
                  <Text style={[styles.historyMetaText, { color: colors.textSecondary }]}>
                    Auth: {event.authState}
                  </Text>
                  {event.redirected && (
                    <Text style={[styles.historyMetaText, { color: '#f59e0b' }]}>
                      Redirected to: {event.redirectTo}
                    </Text>
                  )}
                </View>

                {Object.keys(event.params).length > 0 && (
                  <Text style={[styles.code, { color: colors.text, backgroundColor: colors.border, marginTop: 4 }]}>
                    {JSON.stringify(event.params, null, 2)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={shareDebugInfo}
          >
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Share Debug Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.border, marginTop: 8 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Back to Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          This screen is for development debugging only.
          {'\n'}Pull down to refresh.
        </Text>
      </ScrollView>
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  copyable: {
    textDecorationLine: 'underline',
  },
  listValue: {
    alignItems: 'flex-end',
    flex: 1,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    padding: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  healthLabel: {
    fontSize: 14,
    flex: 1,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  testButtonContent: {
    flex: 1,
    marginRight: 8,
  },
  testLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  testUrl: {
    fontSize: 11,
    marginTop: 2,
  },
  historyItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyTime: {
    fontSize: 11,
  },
  historyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyUrl: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  historyMeta: {
    gap: 2,
  },
  historyMetaText: {
    fontSize: 11,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    padding: 24,
  },
});
