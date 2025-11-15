/**
 * Web implementation of platform navigation using wouter
 */
import { useLocation as useWouterLocation, useNavigate as useWouterNavigate } from 'wouter';

export interface NavigationAdapter {
  useLocation: () => [string, (path: string) => void];
  useNavigate: () => (path: string) => void;
  navigate: (path: string) => void;
}

// Store navigate function for imperative navigation
let navigateFn: ((path: string) => void) | null = null;

export const useLocation = (): [string, (path: string) => void] => {
  return useWouterLocation();
};

export const useNavigate = (): ((path: string) => void) => {
  const navigate = useWouterNavigate();

  // Store for imperative navigation
  if (!navigateFn) {
    navigateFn = navigate;
  }

  return navigate;
};

export const navigate = (path: string): void => {
  if (navigateFn) {
    navigateFn(path);
  } else {
    // Fallback to window.history if hook not initialized
    window.history.pushState({}, '', path);
  }
};

const navigation: NavigationAdapter = {
  useLocation,
  useNavigate,
  navigate,
};

export default navigation;
