import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthToken, saveAuthToken, clearAuthToken } from '../lib/secureStorage';
import apiClient from '../lib/apiClient';
import CookieManager from '@react-native-cookies/cookies';

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        const response = await apiClient.get('/user/me');
        setUser(response.data);
        
        // Set cookie for WebViews
        await CookieManager.set('https://theconnection.app', {
          name: 'session',
          value: token,
          domain: 'theconnection.app',
          path: '/',
          secure: true,
          httpOnly: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/api/login', { username, password });
      const { user: userData, token } = response.data;
      
      await saveAuthToken(token);
      setUser(userData);
      
      // Share session with WebViews
      await CookieManager.set('https://theconnection.app', {
        name: 'session',
        value: token,
        domain: 'theconnection.app',
        path: '/',
        secure: true,
        httpOnly: false,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/register', { username, email, password });
      const { user: userData, token } = response.data;
      
      await saveAuthToken(token);
      setUser(userData);
      
      // Share session with WebViews
      await CookieManager.set('https://theconnection.app', {
        name: 'session',
        value: token,
        domain: 'theconnection.app',
        path: '/',
        secure: true,
        httpOnly: false,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    await clearAuthToken();
    await CookieManager.clearAll();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
