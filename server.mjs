/**
 * Production: Vite static UI + /api/* → SCRAPPER_UPSTREAM (k8s secret).
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchUiApiRoute, normalizeBasePath, uiApiMount } from './shared/appPaths.mjs';
import { proxyApiRequest } from './server/proxy.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 80);
const UPSTREAM = (process.env.SCRAPPER_UPSTREAM || 'http://timeline-scraper:4011').replace(/\/$/, '');
const REQUIRE_BEARER = process.env.UI_REQUIRE_BEARER !== 'false';
const APP_BASE = normalizeBasePath(process.env.APP_BASE_PATH || '/sports-data-admin');
const CLIENT_API_BASE = uiApiMount(APP_BASE);

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

let indexHtmlTemplate = null;

function runtimeConfigJson() {
  return JSON.stringify({
    apiBaseUrl: CLIENT_API_BASE,
    appBasePath: APP_BASE || '/',
    proxyMode: true,
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

function distPath(relativePath) {
  const decoded = decodeURIComponent(relativePath.split('?')[0] || '/');
  let rel = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  if (rel === '/' || rel === '.') return join(DIST, 'index.html');
  if (rel.startsWith('/')) rel = rel.slice(1);
  const filePath = join(DIST, rel);
  if (!filePath.startsWith(DIST)) return null;
  return filePath;
}

function stripAppBase(pathname) {
  if (!APP_BASE) return pathname;
  if (pathname === APP_BASE) return '/';
  if (pathname.startsWith(`${APP_BASE}/`)) return pathname.slice(APP_BASE.length) || '/';
  return null;
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
  if (existsSync(join(DIST, 'index.html'))) {
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

  const apiMount = matchUiApiRoute(pathname, APP_BASE);
  if (apiMount) {
    await proxyApiRequest(req, res, {
      pathname,
      search,
      matchedPrefix: apiMount,
      upstream: UPSTREAM,
      requireBearer: REQUIRE_BEARER,
    });
    return;
  }

  if (APP_BASE && pathname === '/') {
    res.statusCode = 302;
    res.setHeader('Location', `${APP_BASE}/`);
    res.end();
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
    `scrapper-admin-ui :${PORT} ui=${CLIENT_API_BASE}/* → ${UPSTREAM}/* (APP_BASE=${APP_BASE || '/'} bearer=${REQUIRE_BEARER ? 'required' : 'optional'})`
  );
});
