import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { normalizeBasePath, uiApiMount, viteBase } from './shared/appPaths.mjs';

function readBearerToken(headerValue: string | string[] | undefined): string {
  const auth = Array.isArray(headerValue) ? headerValue[0] : headerValue || '';
  if (!auth.startsWith('Bearer ')) return '';
  return auth.slice(7).trim();
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBase = normalizeBasePath(env.VITE_APP_BASE_PATH);
  const apiMount = uiApiMount(appBase);
  const uiApiKey = env.ADMIN_UI_API_KEY || env.VITE_ADMIN_UI_API_KEY || '';
  const scraperApiKey = env.SCRAPPER_ADMIN_API_KEY || '';

  return {
    base: viteBase(appBase),
    plugins: [
      react(),
      {
        name: 'admin-ui-api-gate',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url?.split('?')[0] || '';
            if (!url.startsWith(apiMount)) return next();

            if (uiApiKey) {
              const token = readBearerToken(req.headers.authorization);
              if (token !== uiApiKey) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ error: 'Unauthorized' }));
                return;
              }
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
          rewrite: (path) => (path.startsWith(apiMount) ? path.slice(apiMount.length) || '/' : path),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (scraperApiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${scraperApiKey}`);
              }
            });
          },
        },
      },
    },
  };
});
