import { Linking } from 'react-native';
import * as Location from 'expo-location';

export interface LocationPermissionState {
  foreground: Location.PermissionStatus;
  background: Location.PermissionStatus;
}

export const defaultPermissionState: LocationPermissionState = {
  foreground: Location.PermissionStatus.UNDETERMINED,
  background: Location.PermissionStatus.UNDETERMINED,
};

export async function loadLocationPermissionState(): Promise<LocationPermissionState> {
  const [foreground, background] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
  ]);

  return {
    foreground: foreground.status,
    background: background.status,
  };
}

export async function requestForegroundPermission(): Promise<Location.PermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status;
}

export async function requestBackgroundPermission(): Promise<Location.PermissionStatus> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status;
}

export function formatPermissionStatus(status: Location.PermissionStatus): string {
  switch (status) {
    case Location.PermissionStatus.GRANTED:
      return 'Granted';
    case Location.PermissionStatus.DENIED:
      return 'Denied';
    case Location.PermissionStatus.UNDETERMINED:
    default:
      return 'Not requested';
  }
}

export function hasForegroundPermission(state: LocationPermissionState): boolean {
  return state.foreground === Location.PermissionStatus.GRANTED;
}

export function hasBackgroundPermission(state: LocationPermissionState): boolean {
  return state.background === Location.PermissionStatus.GRANTED;
}

export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (error) {
    console.warn('Unable to open app settings', error);
  }
}
