import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { defaultScrapperApiBase } from '../lib/appPaths';
import { getRuntimeConfig, hasRuntimeApiBase } from '../lib/runtimeConfig';

const LS_BASE = 'scrapper-admin:apiBaseUrl';

export type Settings = {
  apiBaseUrl: string;
};

type SettingsContextValue = Settings & {
  setApiBaseUrl: (v: string) => void;
  resetToDefaults: () => void;
  apiBaseFromServer: boolean;
};

const defaultBase = defaultScrapperApiBase();

function isStaleApiBase(url: string): boolean {
  const t = url.trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (t.includes('/scrapper-api')) return true;
  if (defaultScrapperApiBase() && (t === '/api' || t === '/api/')) return true;
  return false;
}

function normalizeApiBaseUrl(url: string | null): string {
  const runtime = getRuntimeConfig();
  if (runtime?.apiBaseUrl) return runtime.apiBaseUrl;

  const resolvedDefault = defaultScrapperApiBase();
  const t = (url || '').trim();
  if (!t || isStaleApiBase(t)) return resolvedDefault;
  if (/^https?:\/\/(?:127\.0\.0\.1|localhost):5174\//i.test(t)) {
    return resolvedDefault;
  }
  return t;
}

function load(): Settings {
  try {
    return {
      apiBaseUrl: normalizeApiBaseUrl(localStorage.getItem(LS_BASE)),
    };
  } catch {
    return { apiBaseUrl: defaultBase };
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Settings>(() => load());
  const apiBaseFromServer = hasRuntimeApiBase();

  useEffect(() => {
    if (apiBaseFromServer) return;
    try {
      localStorage.setItem(LS_BASE, state.apiBaseUrl);
    } catch {
      /* ignore */
    }
  }, [state.apiBaseUrl, apiBaseFromServer]);

  useEffect(() => {
    try {
      localStorage.removeItem('scrapper-admin:defaultAppId');
      if (apiBaseFromServer) {
        localStorage.removeItem(LS_BASE);
      }
    } catch {
      /* ignore */
    }
  }, [apiBaseFromServer]);

  const setApiBaseUrl = useCallback(
    (v: string) => {
      if (apiBaseFromServer) return;
      setState({ apiBaseUrl: v.trim() || defaultScrapperApiBase() });
    },
    [apiBaseFromServer]
  );

  const resetToDefaults = useCallback(() => {
    setState({ apiBaseUrl: defaultScrapperApiBase() });
    try {
      if (!apiBaseFromServer) {
        localStorage.removeItem(LS_BASE);
      }
    } catch {
      /* ignore */
    }
  }, [apiBaseFromServer]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      setApiBaseUrl,
      resetToDefaults,
      apiBaseFromServer,
    }),
    [state, setApiBaseUrl, resetToDefaults, apiBaseFromServer]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
