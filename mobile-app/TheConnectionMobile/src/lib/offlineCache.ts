import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryKey } from '@tanstack/react-query';

const PREFIX = 'tc_offline_cache:';

const serializeKey = (queryKey: QueryKey) => `${PREFIX}${JSON.stringify(queryKey)}`;

export async function writeCache<T>(queryKey: QueryKey, data: T) {
  try {
    const serialized = JSON.stringify({ data, cachedAt: Date.now() });
    await AsyncStorage.setItem(serializeKey(queryKey), serialized);
  } catch (error) {
    console.warn('Failed to persist offline cache', error);
  }
}

export async function readCache<T>(queryKey: QueryKey): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(serializeKey(queryKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data as T;
  } catch (error) {
    console.warn('Failed to read offline cache', error);
    return null;
  }
}

