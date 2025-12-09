import { Linking } from 'react-native';

export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
} as const;
export type PermissionStatus = typeof PermissionStatus[keyof typeof PermissionStatus];

export interface LocationPermissionState {
  foreground: PermissionStatus;
  background: PermissionStatus;
}

export const defaultPermissionState: LocationPermissionState = {
  foreground: PermissionStatus.UNDETERMINED,
  background: PermissionStatus.UNDETERMINED,
};

function getLocationModule() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-location');
  } catch (e) {
    return null;
  }
}

export async function loadLocationPermissionState(): Promise<LocationPermissionState> {
  const Location = getLocationModule();
  if (!Location) return defaultPermissionState;

  const [foreground, background] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
  ]);

  return {
    foreground: (foreground?.status as PermissionStatus) ?? PermissionStatus.UNDETERMINED,
    background: (background?.status as PermissionStatus) ?? PermissionStatus.UNDETERMINED,
  };
}

export async function requestForegroundPermission(): Promise<PermissionStatus> {
  const Location = getLocationModule();
  if (!Location) return PermissionStatus.UNDETERMINED;

  const { status } = await Location.requestForegroundPermissionsAsync();
  return (status as PermissionStatus) ?? PermissionStatus.UNDETERMINED;
}

export async function requestBackgroundPermission(): Promise<PermissionStatus> {
  const Location = getLocationModule();
  if (!Location) return PermissionStatus.UNDETERMINED;

  const { status } = await Location.requestBackgroundPermissionsAsync();
  return (status as PermissionStatus) ?? PermissionStatus.UNDETERMINED;
}

export function formatPermissionStatus(status: PermissionStatus): string {
  switch (status) {
    case PermissionStatus.GRANTED:
      return 'Granted';
    case PermissionStatus.DENIED:
      return 'Denied';
    case PermissionStatus.UNDETERMINED:
    default:
      return 'Not requested';
  }
}

export function hasForegroundPermission(state: LocationPermissionState): boolean {
  return state.foreground === PermissionStatus.GRANTED;
}

export function hasBackgroundPermission(state: LocationPermissionState): boolean {
  return state.background === PermissionStatus.GRANTED;
}

export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (error) {
    console.warn('Unable to open app settings', error);
  }
}
