import { createContext, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { me, login as apiLogin, logout as apiLogout, register as apiRegister } from 'shared/services/auth';
import { getFeedPage } from 'shared/services/feed';
import type { ApiUser } from 'shared/app-schema';

type Ctx = {
  user: ApiUser | null | undefined;
  login: (p: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (p: { email: string; password: string; name?: string }) => Promise<void>;
  loading: boolean;
  error?: string | null;
};
const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: me });

  const loginM = useMutation({
    mutationFn: apiLogin,
    onSuccess: async () => {
      // Refresh user and prefetch first page of feed for faster landing
      await qc.invalidateQueries({ queryKey: ['me'] });
      await qc.prefetchQuery({ queryKey: ['feed', null], queryFn: () => getFeedPage(null) });
    },
  });

  const logoutM = useMutation({
    mutationFn: apiLogout,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  const registerM = useMutation({
    mutationFn: apiRegister,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  const value = useMemo<Ctx>(() => ({
    user,
    loading: isLoading || loginM.isPending || logoutM.isPending || registerM.isPending,
    error: (loginM.error as any)?.message || (registerM.error as any)?.message || null,
    login: async ({ email, password }) => { await loginM.mutateAsync({ email, password }); },
    logout: async () => { await logoutM.mutateAsync(); },
    register: async ({ email, password, name }) => { await registerM.mutateAsync({ email, password, name }); },
  }), [user, isLoading, loginM.isPending, logoutM.isPending, registerM.isPending, loginM.error, registerM.error]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
};
