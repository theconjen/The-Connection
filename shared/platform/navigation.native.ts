/**
 * Native implementation of platform navigation using expo-router
 */
import { usePathname, useRouter, router } from 'expo-router';

export interface NavigationAdapter {
  useLocation: () => [string, (path: string) => void];
  useNavigate: () => (path: string) => void;
  navigate: (path: string) => void;
}

export const useLocation = (): [string, (path: string) => void] => {
  const pathname = usePathname();
  const routerInstance = useRouter();

  const setLocation = (path: string) => {
    routerInstance.push(path as any);
  };

  return [pathname, setLocation];
};

export const useNavigate = (): ((path: string) => void) => {
  const routerInstance = useRouter();

  return (path: string) => {
    routerInstance.push(path as any);
  };
};

export const navigate = (path: string): void => {
  router.push(path as any);
};

const navigation: NavigationAdapter = {
  useLocation,
  useNavigate,
  navigate,
};

export default navigation;
