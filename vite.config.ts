import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 800,
    },
  },
  build: {
    assetsDir: 'assets',
    sourcemap: true,
  },
});
