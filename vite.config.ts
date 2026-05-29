import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Rpixel/',
  build: {
    chunkSizeWarningLimit: 1800,
  },
  server: {
    host: '0.0.0.0',
    port: 5180,
    strictPort: true,
  },
});
