export type ScrapperAdminRuntimeConfig = {
  /** Same-origin path proxied to SCRAPPER_UPSTREAM by the Node server. */
  apiBaseUrl: string;
  appBasePath: string;
  /** When true, Bearer auth is injected server-side from SCRAPPER_ADMIN_API_KEY. */
  serverAuth: boolean;
};

declare global {
  interface Window {
    __SCRAPPER_ADMIN_CONFIG__?: ScrapperAdminRuntimeConfig;
  }
}

export function getRuntimeConfig(): ScrapperAdminRuntimeConfig | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.__SCRAPPER_ADMIN_CONFIG__;
}

export function isServerManagedApi(): boolean {
  return Boolean(getRuntimeConfig()?.serverAuth);
}
