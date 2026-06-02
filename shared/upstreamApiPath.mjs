/**
 * Map browser-facing UI API paths to timeline-scraper admin paths.
 * @param {string} apiPath - path after /api mount, e.g. /auth/me or /admin/v1/stats
 */
export function toScrapperApiPath(apiPath) {
  const pathOnly = String(apiPath || '/').split('?')[0] || '/';
  if (pathOnly === '/auth/me') {
    return '/admin/v1/auth/me';
  }
  return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
}
