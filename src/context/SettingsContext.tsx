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
import { getRuntimeConfig, isServerManagedApi } from '../lib/runtimeConfig';

const LS_BASE = 'scrapper-admin:apiBaseUrl';
const LS_KEY = 'scrapper-admin:adminApiKey';

export type Settings = {
  apiBaseUrl: string;
  adminApiKey: string;
};

type SettingsContextValue = Settings & {
  setApiBaseUrl: (v: string) => void;
  saveAdminApiKey: (key: string) => void;
  resetToDefaults: () => void;
  serverManagedApi: boolean;
};

const defaultBase = defaultScrapperApiBase();

const defaultKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SCRAPPER_ADMIN_API_KEY) || '';

function isStaleApiBase(url: string): boolean {
  const t = url.trim();
  if (!t || t === '/scrapper-api' || t === '/scrapper-api/') return true;
  if (appBasePath && !t.startsWith(appBasePath)) {
    return t === '/scrapper-api' || t.startsWith('/scrapper-api/');
  }
  return false;
}

/** Legacy dev URLs break when Vite binds to localhost only or host ≠ page origin. */
function normalizeApiBaseUrl(url: string | null): string {
  const runtime = getRuntimeConfig();
  if (runtime?.apiBaseUrl) return runtime.apiBaseUrl;

  const resolvedDefault = defaultScrapperApiBase();
  const t = (url || '').trim();
  if (!t || isStaleApiBase(t)) return resolvedDefault;
  if (/^https?:\/\/(?:127\.0\.0\.1|localhost):5174\/scrapper-api\/?$/i.test(t)) {
    return resolvedDefault;
  }
  if (appBasePath) {
    const escaped = appBasePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `^https?:\\/\\/(?:127\\.0\\.0\\.1|localhost):5174${escaped}\\/scrapper-api\\/?$`,
      'i'
    );
    if (re.test(t)) return resolvedDefault;
  }
  return t;
}

function load(): Settings {
  const serverManaged = isServerManagedApi();
  try {
    return {
      apiBaseUrl: normalizeApiBaseUrl(localStorage.getItem(LS_BASE)),
      adminApiKey: serverManaged ? '' : (localStorage.getItem(LS_KEY) ?? defaultKey),
    };
  } catch {
    return {
      apiBaseUrl: defaultBase,
      adminApiKey: serverManaged ? '' : defaultKey,
    };
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Settings>(() => load());
  const serverManagedApi = isServerManagedApi();

  useEffect(() => {
    if (serverManagedApi) return;
    try {
      localStorage.setItem(LS_BASE, state.apiBaseUrl);
    } catch {
      /* ignore */
    }
  }, [state.apiBaseUrl, serverManagedApi]);

  // Drop legacy global appId filter (fixtures list all apps by default now).
  useEffect(() => {
    try {
      localStorage.removeItem('scrapper-admin:defaultAppId');
    } catch {
      /* ignore */
    }
  }, []);

  const setApiBaseUrl = useCallback(
    (v: string) => {
      if (serverManagedApi) return;
      setState((s) => ({ ...s, apiBaseUrl: v.trim() || defaultScrapperApiBase() }));
    },
    [serverManagedApi]
  );

  const saveAdminApiKey = useCallback(
    (key: string) => {
      if (serverManagedApi) return;
      setState((s) => ({ ...s, adminApiKey: key }));
      try {
        localStorage.setItem(LS_KEY, key);
      } catch {
        /* ignore */
      }
    },
    [serverManagedApi]
  );

  const resetToDefaults = useCallback(() => {
    setState({
      apiBaseUrl: defaultScrapperApiBase(),
      adminApiKey: serverManagedApi ? '' : defaultKey,
    });
    if (!serverManagedApi) {
      try {
        localStorage.removeItem(LS_BASE);
        localStorage.removeItem(LS_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [serverManagedApi]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      setApiBaseUrl,
      saveAdminApiKey,
      resetToDefaults,
      serverManagedApi,
    }),
    [state, setApiBaseUrl, saveAdminApiKey, resetToDefaults, serverManagedApi]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
