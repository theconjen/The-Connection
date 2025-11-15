/**
 * Platform-agnostic storage interface
 *
 * Provides unified API for:
 * - Web: localStorage
 * - Native: AsyncStorage + SecureStore
 */

export interface Storage {
  /**
   * Get an item from storage
   * @param key - Storage key
   * @returns Promise resolving to the value or null if not found
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Set an item in storage
   * @param key - Storage key
   * @param value - Value to store
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Remove an item from storage
   * @param key - Storage key
   */
  removeItem(key: string): Promise<void>;

  /**
   * Clear all items from storage
   */
  clear(): Promise<void>;

  /**
   * Get all keys in storage
   */
  getAllKeys(): Promise<string[]>;
}

// Platform-specific implementation will be imported based on .web.ts or .native.ts extension
export { storage } from './storage.native';
