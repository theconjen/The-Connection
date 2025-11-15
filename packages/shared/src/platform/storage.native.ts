/**
 * React Native implementation of storage using AsyncStorage and SecureStore
 *
 * Keys prefixed with "secure:" will use SecureStore (encrypted)
 * All other keys will use AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Storage } from './storage';

class NativeStorage implements Storage {
  private isSecureKey(key: string): boolean {
    return key.startsWith('secure:');
  }

  private getActualKey(key: string): string {
    return this.isSecureKey(key) ? key.slice(7) : key;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isSecureKey(key)) {
        return await SecureStore.getItemAsync(this.getActualKey(key));
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('NativeStorage.getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isSecureKey(key)) {
        await SecureStore.setItemAsync(this.getActualKey(key), value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('NativeStorage.setItem error:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isSecureKey(key)) {
        await SecureStore.deleteItemAsync(this.getActualKey(key));
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('NativeStorage.removeItem error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      // AsyncStorage only - SecureStore items need to be cleared individually
      await AsyncStorage.clear();
    } catch (error) {
      console.error('NativeStorage.clear error:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      // AsyncStorage only - SecureStore doesn't support key enumeration
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('NativeStorage.getAllKeys error:', error);
      return [];
    }
  }
}

export const storage = new NativeStorage();
