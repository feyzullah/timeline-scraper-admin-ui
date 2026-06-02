/**
 * Forward UI-server /api/* requests to SCRAPPER_UPSTREAM (from k8s secret).
 *
 * Browser:  GET /sports-data-admin/api/admin/v1/stats  (Bearer ADMIN_UI_API_KEY)
 * Upstream:  GET http://timeline-scraper:4011/admin/v1/stats  (Bearer SCRAPPER_ADMIN_API_KEY)
 */

import { requireUiApiKey } from './auth.mjs';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {object} opts
 * @param {string} opts.pathname
 * @param {string} opts.search
 * @param {string} opts.matchedPrefix - e.g. /sports-data-admin/api
 * @param {string} opts.upstream - SCRAPPER_UPSTREAM without trailing slash
 * @param {string} opts.uiApiKey - ADMIN_UI_API_KEY (browser → this UI server)
 * @param {string} opts.scraperApiKey - SCRAPPER_ADMIN_API_KEY (this UI server → timeline-scraper)
 */
export async function proxyApiRequest(req, res, { pathname, search, matchedPrefix, upstream, uiApiKey, scraperApiKey }) {
  if (!requireUiApiKey(req, res, uiApiKey)) return;

  const apiPath = pathname.slice(matchedPrefix.length) || '/';
  const target = `${upstream}${apiPath}${search}`;

  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (!value || name === 'host' || name.toLowerCase() === 'authorization') continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  if (scraperApiKey) {
    headers.set('authorization', `Bearer ${scraperApiKey}`);
  }

  const init = { method: req.method, headers, redirect: 'manual' };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await readBody(req);
  }

  let upstreamRes;
  try {
    upstreamRes = await fetch(target, init);
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: 'Upstream unavailable',
        target,
        detail: String(err?.message || err),
      })
    );
    return;
  }

  res.statusCode = upstreamRes.status;
  upstreamRes.headers.forEach((value, name) => {
    if (HOP_BY_HOP.has(name.toLowerCase())) return;
    res.setHeader(name, value);
  });
  res.end(Buffer.from(await upstreamRes.arrayBuffer()));
}
