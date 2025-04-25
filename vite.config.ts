import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { notBundle } from 'vite-plugin-electron/plugin';
import { rmSync } from 'node:fs';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // Main process entry file
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron', 'electron-updater'],
              output: {
                format: 'cjs'
              }
            },
            minify: false,
            commonjsOptions: {
              ignoreDynamicRequires: true,
            },
            lib: {
              entry: 'electron/main/index.ts',
              formats: ['cjs'],
            },
          },
        },
        onstart({ startup }) {
          if (process.env.VSCODE_DEBUG) {
            console.log('[startup] Electron App');
          } else {
            startup();
          }
        },
      },
      {
        // Preload scripts entry file
        entry: 'electron/preload/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs'
              }
            },
            minify: false,
            commonjsOptions: {
              ignoreDynamicRequires: true,
            },
            lib: {
              entry: 'electron/preload/index.ts',
              formats: ['cjs'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}); 