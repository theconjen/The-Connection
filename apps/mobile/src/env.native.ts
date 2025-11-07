import Constants from 'expo-constants';

function getEnv(key: string): string | undefined {
  const maybeProcess = (globalThis as any)?.process;
  return maybeProcess?.env?.[key] ?? undefined;
}

const expoExtraApiBase =
  (Constants as any)?.expoConfig?.extra?.apiBase ??
  (Constants as any)?.manifest?.extra?.apiBase ??
  undefined;

export const API_BASE =
  expoExtraApiBase ??
  getEnv('EXPO_PUBLIC_API_BASE') ??
  '';
