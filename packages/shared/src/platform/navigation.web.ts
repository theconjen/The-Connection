/**
 * Web implementation of navigation using wouter
 */

import { Navigation } from './navigation';

class WebNavigation implements Navigation {
  navigate(path: string): void {
    // Use native browser navigation for web
    window.history.pushState({}, '', path);
    // Trigger a popstate event to notify wouter
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  goBack(): void {
    window.history.back();
  }

  replace(path: string): void {
    window.history.replaceState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  getCurrentPath(): string {
    return window.location.pathname;
  }

  canGoBack(): boolean {
    // In web, we can always attempt to go back (browser handles it)
    return window.history.length > 1;
  }
}

export const navigation = new WebNavigation();
