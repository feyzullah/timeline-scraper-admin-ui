import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { normalizeBasePath, uiApiMount, viteBase } from './shared/appPaths.mjs';
import { readBearerToken } from './server/uiAuth.mjs';
import { toScrapperApiPath } from './shared/upstreamApiPath.mjs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBase = normalizeBasePath(env.VITE_APP_BASE_PATH);
  const apiMount = uiApiMount(appBase);
  const requireBearer = env.UI_REQUIRE_BEARER !== 'false';

  return {
    base: viteBase(appBase),
    plugins: [
      react(),
      {
        name: 'admin-ui-api-gate',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const urlPath = req.url?.split('?')[0] || '';
            if (!urlPath.startsWith(apiMount)) return next();

            const relPath = urlPath.slice(apiMount.length) || '/';
            const upstreamPath = toScrapperApiPath(relPath);

            if (upstreamPath === '/admin/v1/auth/me') {
              // Let Vite proxy handle auth/me → scrapper (after bearer check).
            }

            if (requireBearer && !readBearerToken(req.headers.authorization)) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: 'Unauthorized' }));
              return;
            }

            next();
          });
        },
      },
    ],
    server: {
      host: true,
      port: 5174,
      proxy: {
        [apiMount]: {
          target: 'http://127.0.0.1:4011',
          changeOrigin: true,
          rewrite: (path) => {
            const rel = path.startsWith(apiMount) ? path.slice(apiMount.length) || '/' : path;
            return toScrapperApiPath(rel);
          },
        },
      },
    },
  };
});
