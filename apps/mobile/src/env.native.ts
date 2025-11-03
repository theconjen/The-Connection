import Constants from 'expo-constants';

const envApiBase =
  typeof globalThis !== 'undefined'
    ? (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_BASE
    : undefined;

export const API_BASE =
  (Constants?.expoConfig as any)?.extra?.apiBase ||
  envApiBase ||
  '';
