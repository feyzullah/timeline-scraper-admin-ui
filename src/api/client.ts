import { useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';

export function joinApiUrl(baseUrl: string, path: string) {
  const b = baseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

export class ScrapperApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ScrapperApiError';
    this.status = status;
    this.body = body;
  }
}

export async function scrapperRequest<T>(
  apiBaseUrl: string,
  adminApiKey: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = joinApiUrl(apiBaseUrl, path);
  const headers = new Headers(init.headers);
  if (adminApiKey) {
    headers.set('Authorization', `Bearer ${adminApiKey}`);
  }
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error?: string }).error)
        : res.statusText;
    throw new ScrapperApiError(msg || `HTTP ${res.status}`, res.status, data);
  }
  return data as T;
}

export function useScrapperClient() {
  const { apiBaseUrl, adminApiKey } = useSettings();

  const get = useCallback(
    <T,>(path: string, query?: Record<string, string | number | boolean | undefined | null>) => {
      const qs = query ? buildQuery(query) : '';
      const full = qs ? `${path}?${qs}` : path;
      return scrapperRequest<T>(apiBaseUrl, adminApiKey, full, { method: 'GET' });
    },
    [apiBaseUrl, adminApiKey]
  );

  const patch = useCallback(
    <T,>(path: string, body: unknown) =>
      scrapperRequest<T>(apiBaseUrl, adminApiKey, path, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    [apiBaseUrl, adminApiKey]
  );

  const post = useCallback(
    <T,>(path: string, body: unknown = {}) =>
      scrapperRequest<T>(apiBaseUrl, adminApiKey, path, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    [apiBaseUrl, adminApiKey]
  );

  const put = useCallback(
    <T,>(path: string, body: unknown) =>
      scrapperRequest<T>(apiBaseUrl, adminApiKey, path, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    [apiBaseUrl, adminApiKey]
  );

  return { get, patch, post, put, apiBaseUrl, adminApiKey };
}
