```tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient, setAccessToken } from '../api/client';
import { tokenStorage } from './tokenStorage';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  display_name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // بازیابی نشست در بارگذاری اولیه
  useEffect(() => {
    (async () => {
      try {
        const token = tokenStorage.getAccess();
        if (token) setAccessToken(token);

        // امتحان کن /auth/me — اگر access توکن معتبر نبود، apiClient خودش refresh می‌کنه
        const { user } = await apiClient.me();
        setUser(user);
      } catch {
        tokenStorage.clear();
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, accessToken } = await apiClient.login({ email, password });
    setAccessToken(accessToken);
    tokenStorage.setAccess(accessToken);
    setUser(user);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const { user, accessToken } = await apiClient.register({ email, password, displayName });
    setAccessToken(accessToken);
    tokenStorage.setAccess(accessToken);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try { await apiClient.logout(); } catch {}
    tokenStorage.clear();
    setAccessToken(null);
    setUser(null);
  }, []);

  const logoutAll = useCallback(async () => {
    try { await apiClient.logoutAll(); } catch {}
    tokenStorage.clear();
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, logoutAll }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}
```
