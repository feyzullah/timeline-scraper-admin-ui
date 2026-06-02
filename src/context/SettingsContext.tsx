import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

const LS_BASE = 'scrapper-admin:apiBaseUrl';
const LS_KEY = 'scrapper-admin:adminApiKey';
const LS_APP = 'scrapper-admin:defaultAppId';

export type Settings = {
  apiBaseUrl: string;
  adminApiKey: string;
  defaultAppId: string;
};

type SettingsContextValue = Settings & {
  setApiBaseUrl: (v: string) => void;
  setAdminApiKey: (v: string) => void;
  setDefaultAppId: (v: string) => void;
  resetToDefaults: () => void;
};

// Relative path keeps same-origin with the Vite dev server (localhost vs 127.0.0.1 safe).
const defaultBase =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SCRAPPER_API_BASE_URL) ||
  '/scrapper-api';

const defaultKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SCRAPPER_ADMIN_API_KEY) || '';

/** Legacy dev URLs break when Vite binds to localhost only or host ≠ page origin. */
function normalizeApiBaseUrl(url: string | null): string {
  const t = (url || '').trim();
  if (!t) return defaultBase;
  if (/^https?:\/\/(?:127\.0\.0\.1|localhost):5174\/scrapper-api\/?$/i.test(t)) {
    return '/scrapper-api';
  }
  return t;
}

function load(): Settings {
  try {
    return {
      apiBaseUrl: normalizeApiBaseUrl(localStorage.getItem(LS_BASE)),
      adminApiKey: localStorage.getItem(LS_KEY) ?? defaultKey,
      defaultAppId: localStorage.getItem(LS_APP) || 'bububet'
    };
  } catch {
    return { apiBaseUrl: defaultBase, adminApiKey: defaultKey, defaultAppId: 'bububet' };
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Settings>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(LS_BASE, state.apiBaseUrl);
      localStorage.setItem(LS_KEY, state.adminApiKey);
      localStorage.setItem(LS_APP, state.defaultAppId);
    } catch {
      /* ignore */
    }
  }, [state]);

  const setApiBaseUrl = useCallback((v: string) => {
    setState((s) => ({ ...s, apiBaseUrl: v.trim() || defaultBase }));
  }, []);

  const setAdminApiKey = useCallback((v: string) => {
    setState((s) => ({ ...s, adminApiKey: v }));
  }, []);

  const setDefaultAppId = useCallback((v: string) => {
    setState((s) => ({ ...s, defaultAppId: v.trim() || 'bububet' }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setState({
      apiBaseUrl: defaultBase,
      adminApiKey: defaultKey,
      defaultAppId: 'bububet'
    });
    try {
      localStorage.removeItem(LS_BASE);
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_APP);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      setApiBaseUrl,
      setAdminApiKey,
      setDefaultAppId,
      resetToDefaults
    }),
    [state, setApiBaseUrl, setAdminApiKey, setDefaultAppId, resetToDefaults]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
