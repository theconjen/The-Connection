import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { ensurePushTokenRegistered } from '../lib/pushNotifications';
import { useAuth } from '../contexts/AuthContext';

type NotificationContextValue = {
  permissionStatus: Notifications.PermissionStatus | 'unknown';
  expoPushToken: string | null;
  requestPermission: () => Promise<boolean>;
  lastNotification?: Notifications.Notification;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

async function ensureAndroidChannelAsync() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | 'unknown'>('unknown');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | undefined>(undefined);

  useEffect(() => {
    ensureAndroidChannelAsync();

    const bootstrapAsync = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted' && user) {
        try {
          const token = await ensurePushTokenRegistered();
          setExpoPushToken(token ?? null);
        } catch (error) {
          console.warn('Unable to register push token on startup', error);
        }
      }
    };

    bootstrapAsync();

    const receiveSub = Notifications.addNotificationReceivedListener((notification) => {
      setLastNotification(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      setLastNotification(response.notification);
      const deepLink = response.notification.request.content.data?.link as string | undefined;
      if (deepLink) {
        Linking.openURL(deepLink).catch((error) => {
          console.warn('Unable to open deep link from notification', error);
        });
      }
    });

    return () => {
      receiveSub.remove();
      responseSub.remove();
    };
  }, [user]);

  const requestPermission = async () => {
    const request = await Notifications.requestPermissionsAsync();
    setPermissionStatus(request.status);

    if (request.status === 'granted' && user) {
      try {
        const token = await ensurePushTokenRegistered();
        setExpoPushToken(token ?? null);
      } catch (error) {
        console.warn('Unable to register token after permission prompt', error);
      }
    }

    return request.status === 'granted';
  };

  const value = useMemo(
    () => ({ permissionStatus, expoPushToken, requestPermission, lastNotification }),
    [permissionStatus, expoPushToken, lastNotification]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

