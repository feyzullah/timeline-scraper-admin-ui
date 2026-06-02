/**
 * Production server: static Vite build + /scrapper-api reverse proxy.
 * Env: PORT (default 80), SCRAPPER_UPSTREAM, SCRAPPER_ADMIN_API_KEY.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const PORT = Number(process.env.PORT || 80);
const UPSTREAM = (process.env.SCRAPPER_UPSTREAM || 'http://timeline-scraper:4011').replace(/\/$/, '');
const ADMIN_API_KEY = process.env.SCRAPPER_ADMIN_API_KEY || '';
const API_PREFIX = '/scrapper-api';

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

function distPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
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

function serveStatic(req, res, pathname) {
  const filePath = distPath(pathname);
  if (!filePath) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const cache = ['.css', '.js', '.png', '.svg', '.woff2', '.ico'].includes(extname(filePath));
    sendFile(res, filePath, { cache });
    return;
  }

  if (extname(pathname)) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const indexPath = join(DIST, 'index.html');
  if (existsSync(indexPath)) {
    sendFile(res, indexPath);
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/healthz') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('ok');
    return;
  }

  if (url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`)) {
    await proxyToScrapper(req, res, url.pathname, url.search);
    return;
  }

  serveStatic(req, res, url.pathname);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`scrapper-admin-ui listening on :${PORT} upstream=${UPSTREAM}`);
});
