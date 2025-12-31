import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'web',
  base: './',
  build: {
    outDir: '../dist-web',
    emptyOutDir: true,
    sourcemap: true,
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'web/index.html'),
      },
      output: {
        manualChunks: {
          'three': ['three'],
          'gl-matrix': ['gl-matrix'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    strictPort: false,
  },
  preview: {
    port: 4000,
    open: true,
    strictPort: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    // Provide polyfills for Node.js globals
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['three', 'gl-matrix'],
    exclude: ['electron'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  esbuild: {
    target: 'esnext',
    keepNames: true,
    legalComments: 'none',
  },
  css: {
    devSourcemap: true,
  },
  json: {
    stringify: false,
  },
});
