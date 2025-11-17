/**
 * React Native implementation of navigation using expo-router
 */

import { router } from 'expo-router';
import { Navigation } from './navigation';

class NativeNavigation implements Navigation {
  navigate(path: string): void {
    router.push(path as any);
  }

  goBack(): void {
    if (router.canGoBack()) {
      router.back();
    }
  }

  replace(path: string): void {
    router.replace(path as any);
  }

  getCurrentPath(): string {
    // expo-router doesn't expose current path directly
    // This is a best-effort implementation
    return '';
  }

  canGoBack(): boolean {
    return router.canGoBack();
  }
}

export const navigation = new NativeNavigation();
