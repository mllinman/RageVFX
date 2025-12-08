// Vite configuration for RageVFX Marketing Website
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 8000,
    open: true,
  },
  preview: {
    port: 8000,
  },
});
