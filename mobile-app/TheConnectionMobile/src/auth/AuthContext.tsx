import React, { createContext, useContext, useMemo } from 'react';
import { api, ApiUser } from '../lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type AuthContextType = {
  user: ApiUser | null;
  isLoading: boolean;
  error: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<ApiUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const { data: user, isLoading, error, refetch } = useQuery<ApiUser | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await api.get<ApiUser>('/user');
      } catch (e: any) {
        if (String(e?.message || '').toLowerCase().includes('not authenticated')) {
          return null;
        }
        throw e;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const u = await api.post<ApiUser>('/login', { username, password });
      return u;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/logout', {});
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const value = useMemo<AuthContextType>(() => ({
    user: user ?? null,
    isLoading,
    error: (error as any)?.message ?? null,
    login: async (usernameOrEmail: string, password: string) => {
      const u = await loginMutation.mutateAsync({ username: usernameOrEmail, password });
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      return u;
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    refresh: async () => {
      await refetch();
    },
  }), [user, isLoading, error, loginMutation, logoutMutation, qc, refetch]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
