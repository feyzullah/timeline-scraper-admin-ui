import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { appBasePath, defaultScrapperApiBase } from '../lib/appPaths';
import { getRuntimeConfig, hasRuntimeApiBase } from '../lib/runtimeConfig';

const LS_BASE = 'scrapper-admin:apiBaseUrl';
const LS_KEY = 'scrapper-admin:adminApiKey';

export type Settings = {
  apiBaseUrl: string;
  /** Bearer token for this UI server's /api/* (ADMIN_UI_API_KEY in prod). */
  uiAccessKey: string;
};

type SettingsContextValue = Settings & {
  setApiBaseUrl: (v: string) => void;
  saveUiAccessKey: (key: string) => void;
  resetToDefaults: () => void;
  /** Prod: apiBaseUrl is the same-origin proxy path from the UI server. */
  apiBaseFromServer: boolean;
};

const defaultBase = defaultScrapperApiBase();

const defaultUiAccessKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_UI_API_KEY) || '';

function isStaleApiBase(url: string): boolean {
  const t = url.trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t)) return true;
  // Legacy proxy paths before /api mount.
  if (t.includes('/scrapper-api')) return true;
  if (appBasePath && (t === '/api' || t === '/api/')) return true;
  return false;
}

/** Legacy dev URLs break when Vite binds to localhost only or host ≠ page origin. */
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
      uiAccessKey: localStorage.getItem(LS_KEY) ?? defaultUiAccessKey,
    };
  } catch {
    return {
      apiBaseUrl: defaultBase,
      uiAccessKey: defaultUiAccessKey,
    };
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
      setState((s) => ({ ...s, apiBaseUrl: v.trim() || defaultScrapperApiBase() }));
    },
    [apiBaseFromServer]
  );

  const saveUiAccessKey = useCallback((key: string) => {
    setState((s) => ({ ...s, uiAccessKey: key }));
    try {
      localStorage.setItem(LS_KEY, key);
    } catch {
      /* ignore */
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setState({
      apiBaseUrl: defaultScrapperApiBase(),
      uiAccessKey: defaultUiAccessKey,
    });
    try {
      if (!apiBaseFromServer) {
        localStorage.removeItem(LS_BASE);
      }
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  }, [apiBaseFromServer]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      setApiBaseUrl,
      saveUiAccessKey,
      resetToDefaults,
      apiBaseFromServer,
    }),
    [state, setApiBaseUrl, saveUiAccessKey, resetToDefaults, apiBaseFromServer]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
