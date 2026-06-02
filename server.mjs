/**
 * Production server: static Vite build + scrapper API reverse proxy.
 * Env: PORT, APP_BASE_PATH, SCRAPPER_UPSTREAM, SCRAPPER_ADMIN_API_KEY.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeBasePath, scrapperApiPrefix } from './shared/appPaths.mjs';

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const PORT = Number(process.env.PORT || 80);
const UPSTREAM = (process.env.SCRAPPER_UPSTREAM || 'http://timeline-scraper:4011').replace(/\/$/, '');
const ADMIN_API_KEY = process.env.SCRAPPER_ADMIN_API_KEY || '';
const APP_BASE = normalizeBasePath(process.env.APP_BASE_PATH || '/sports-data-admin');
const API_PREFIX = scrapperApiPrefix(APP_BASE);

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

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

function distPath(relativePath) {
  const decoded = decodeURIComponent(relativePath.split('?')[0] || '/');
  let rel = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  if (rel === '/' || rel === '.') {
    return join(DIST, 'index.html');
  }
  if (rel.startsWith('/')) rel = rel.slice(1);
  const filePath = join(DIST, rel);
  if (!filePath.startsWith(DIST)) return null;
  return filePath;
}

function sendFile(res, filePath, { cache = false } = {}) {
  const stream = createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[extname(filePath)] || 'application/octet-stream');
  if (cache) {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  }
  stream.pipe(res);
}

let indexHtmlTemplate = null;

function runtimeConfigJson() {
  return JSON.stringify({
    apiBaseUrl: API_PREFIX,
    appBasePath: APP_BASE || '/',
    serverAuth: Boolean(ADMIN_API_KEY),
  }).replace(/</g, '\\u003c');
}

function sendIndexHtml(res) {
  if (!indexHtmlTemplate) {
    indexHtmlTemplate = readFileSync(join(DIST, 'index.html'), 'utf8');
  }
  const snippet = `<script>window.__SCRAPPER_ADMIN_CONFIG__=${runtimeConfigJson()};</script>`;
  const html = indexHtmlTemplate.includes('</head>')
    ? indexHtmlTemplate.replace('</head>', `${snippet}\n</head>`)
    : `${snippet}${indexHtmlTemplate}`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(html);
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}

/** Strip APP_BASE from pathname; null if request is outside the mount. */
function stripAppBase(pathname) {
  if (!APP_BASE) return pathname;
  if (pathname === APP_BASE) return '/';
  if (pathname.startsWith(`${APP_BASE}/`)) return pathname.slice(APP_BASE.length) || '/';
  return null;
}

async function proxyToScrapper(req, res, pathname, search) {
  const upstreamPath = pathname.slice(API_PREFIX.length) || '/';
  const target = `${UPSTREAM}${upstreamPath}${search}`;

  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (!value || name === 'host') continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  if (ADMIN_API_KEY) {
    headers.set('authorization', `Bearer ${ADMIN_API_KEY}`);
  }

  const init = { method: req.method, headers, redirect: 'manual' };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await readBody(req);
  }

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Upstream unavailable', detail: String(err?.message || err) }));
    return;
  }

  res.statusCode = upstream.status;
  upstream.headers.forEach((value, name) => {
    if (HOP_BY_HOP.has(name.toLowerCase())) return;
    res.setHeader(name, value);
  });
  const body = Buffer.from(await upstream.arrayBuffer());
  res.end(body);
}

function serveStatic(res, relativePath) {
  const filePath = distPath(relativePath);
  if (!filePath) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    if (filePath === join(DIST, 'index.html')) {
      sendIndexHtml(res);
      return;
    }
    const cache = ['.css', '.js', '.png', '.svg', '.woff2', '.ico'].includes(extname(filePath));
    sendFile(res, filePath, { cache });
    return;
  }

  if (extname(relativePath)) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const indexPath = join(DIST, 'index.html');
  if (existsSync(indexPath)) {
    sendIndexHtml(res);
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const { pathname, search } = url;

  if (pathname === '/healthz') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('ok');
    return;
  }

  if (pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`)) {
    await proxyToScrapper(req, res, pathname, search);
    return;
  }

  if (APP_BASE && pathname === '/') {
    redirect(res, `${APP_BASE}/`);
    return;
  }

  const relative = stripAppBase(pathname);
  if (relative === null) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  serveStatic(res, relative);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `scrapper-admin-ui listening on :${PORT} base=${APP_BASE || '/'} api=${API_PREFIX} upstream=${UPSTREAM}`
  );
});
