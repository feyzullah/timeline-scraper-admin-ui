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

export function defaultScrapperApiBase(): string {
  const override =
    typeof import.meta !== 'undefined' ? import.meta.env.VITE_SCRAPPER_API_BASE_URL?.trim() : '';
  if (override) return override;
  return appBasePath ? `${appBasePath}/scrapper-api` : '/scrapper-api';
}
