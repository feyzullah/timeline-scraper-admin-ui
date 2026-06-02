/** @param {string | undefined | null} path */
export function normalizeBasePath(path) {
  const raw = String(path ?? '').trim();
  if (!raw || raw === '/') return '';
  let p = raw.replace(/\/+$/, '');
  if (!p.startsWith('/')) p = `/${p}`;
  return p;
}

/** Vite `base` option (trailing slash). */
export function viteBase(path) {
  const p = normalizeBasePath(path);
  return p ? `${p}/` : '/';
}

/** Same-origin scrapper API prefix under the app base path. */
export function scrapperApiPrefix(basePath) {
  const base = normalizeBasePath(basePath);
  return base ? `${base}/scrapper-api` : '/scrapper-api';
}
