import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/scrapper-api': {
        target: 'http://127.0.0.1:4011',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/scrapper-api/, '')
      }
    }
  }
});
