import { getRuntimeConfig } from './runtimeConfig';

export function normalizeBasePath(path: string | undefined | null): string {
  const raw = (path ?? '').trim();
  if (!raw || raw === '/') return '';
  let p = raw.replace(/\/+$/, '');
  if (!p.startsWith('/')) p = `/${p}`;
  return p;
}

/** App mount path, e.g. `/sports-data-admin`. Empty string = site root. */
export const appBasePath = normalizeBasePath(
  typeof import.meta !== 'undefined' ? import.meta.env.VITE_APP_BASE_PATH : ''
);

/** React Router basename (`undefined` at site root). */
export const routerBasename = appBasePath || undefined;

/** Pathname with APP_BASE stripped, e.g. `/sports-data-admin/fixtures` → `/fixtures`. */
export function stripAppBasePath(pathname: string): string {
  if (!appBasePath) return pathname;
  if (pathname === appBasePath) return '/';
  if (pathname.startsWith(`${appBasePath}/`)) {
    return pathname.slice(appBasePath.length) || '/';
  }
  return pathname;
}

/** Same-origin proxy prefix; Node forwards to SCRAPPER_UPSTREAM from k8s secrets. */
export function defaultScrapperApiBase(): string {
