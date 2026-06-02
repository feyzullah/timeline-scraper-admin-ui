import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { defaultScrapperApiBase } from '../lib/appPaths';
import { getRuntimeConfig } from '../lib/runtimeConfig';

const LS_KEY = 'scrapper-admin:adminApiKey';

type AuthContextValue = {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  adminApiKey: string;
  login: (key: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function apiBaseUrl() {
  return getRuntimeConfig()?.apiBaseUrl || defaultScrapperApiBase();
}

async function verifyAdminKey(key: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 403) {
    throw new Error('This key is for settler/operator use only. Admin access required.');
  }
  if (!res.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : `HTTP ${res.status}`);
  }
  if (body.role !== 'admin') {
    throw new Error('Admin access required');
  }
}

function readStoredKey(): string {
  try {
    const fromLs = localStorage.getItem(LS_KEY);
    if (fromLs) return fromLs;
  } catch {
    /* ignore */
  }
  return (import.meta.env?.VITE_SCRAPPER_ADMIN_API_KEY as string | undefined) || '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [adminApiKey, setAdminApiKey] = useState('');

  const applySession = useCallback((key: string) => {
    setAdminApiKey(key);
    setStatus('authenticated');
    try {
      localStorage.setItem(LS_KEY, key);
    } catch {
      /* ignore */
    }
  }, []);

  const clearSession = useCallback(() => {
    setAdminApiKey('');
    setStatus('unauthenticated');
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const stored = readStoredKey().trim();
    if (!stored) {
      setStatus('unauthenticated');
      return;
    }

    verifyAdminKey(stored)
      .then(() => {
        if (!cancelled) applySession(stored);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });

    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (key: string) => {
      const trimmed = key.trim();
      if (!trimmed) throw new Error('Admin API key required');
      await verifyAdminKey(trimmed);
      applySession(trimmed);
    },
    [applySession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, adminApiKey, login, logout }),
    [status, adminApiKey, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
