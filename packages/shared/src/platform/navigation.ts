/**
 * Platform-agnostic navigation interface
 *
 * Provides unified API for:
 * - Web: wouter (SPA routing)
 * - Native: expo-router (native navigation)
 */

export interface Navigation {
  /**
   * Navigate to a route
   * @param path - Route path (e.g., "/home", "/profile/123")
   */
  navigate(path: string): void;

  /**
   * Go back to previous route
   */
  goBack(): void;

  /**
   * Replace current route
   * @param path - Route path
   */
  replace(path: string): void;

  /**
   * Get current route path
   */
  getCurrentPath(): string;

  /**
   * Check if can go back
   */
  canGoBack(): boolean;
}

// Platform-specific implementation will be imported based on .web.ts or .native.ts extension
export { navigation } from './navigation.native';
