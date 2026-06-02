import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { normalizeBasePath, scrapperApiPrefix, viteBase } from './shared/appPaths.mjs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBase = normalizeBasePath(env.VITE_APP_BASE_PATH);
  const apiPrefix = scrapperApiPrefix(appBase);

  return {
    base: viteBase(appBase),
    plugins: [react()],
    server: {
      host: true,
      port: 5174,
      proxy: {
        [apiPrefix]: {
          target: 'http://127.0.0.1:4011',
          changeOrigin: true,
          rewrite: (path) =>
            path.startsWith(apiPrefix) ? path.slice(apiPrefix.length) || '/' : path,
        },
      },
    },
  };
});
