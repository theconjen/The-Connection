import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Network from 'expo-network';

type OfflineContextValue = {
  isOffline: boolean;
  lastOnline: Date | null;
  isMonitoring: boolean;
};

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    let subscription: Network.NetworkStateSubscription | undefined;

    const handleNetworkState = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const offline = state.isConnected === false || state.isInternetReachable === false;
        setIsOffline(offline);
        if (!offline) {
          setLastOnline(new Date());
        }
      } catch (error) {
        console.warn('Unable to read network state', error);
      } finally {
        setIsMonitoring(false);
      }
    };

    handleNetworkState();
    subscription = Network.addNetworkStateListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
      if (!offline) {
        setLastOnline(new Date());
      }
    });

    return () => subscription?.remove?.();
  }, []);

  const value = useMemo(
    () => ({
      isOffline,
      lastOnline,
      isMonitoring,
    }),
    [isOffline, lastOnline, isMonitoring]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

export function OfflineNotice() {
  const { isOffline, lastOnline } = useOffline();

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerTitle}>You are offline</Text>
      <Text style={styles.bannerSubtitle}>
        Changes will be queued when possible. Last online {lastOnline ? lastOnline.toLocaleTimeString() : 'recently'}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bannerTitle: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 14,
  },
  bannerSubtitle: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 2,
  },
});

