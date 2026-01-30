import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let lucideResolved: string | undefined;
try {
  lucideResolved = require.resolve('lucide-react/dist/esm/lucide-react.js');
} catch (e) {
  lucideResolved = undefined;
}
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: [],
        babelrc: false,
        configFile: false,
      }
    }),
    basicSsl(),
  ],
  server: {
    https: true,
    port: 5173,
    allowedHosts: ['narthecal-doughy-nicholas.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@connection/shared": path.resolve(__dirname, "../packages/shared/src"),
      "@connection/ui": path.resolve(__dirname, "../packages/ui/src"),
      "@shared": path.resolve(__dirname, "../packages/shared/src"),
      "@assets": path.resolve(__dirname, "src/assets"),
      // Force lucide-react to its ESM bundle to avoid package entry resolution issues
      ...(lucideResolved ? { 'lucide-react': lucideResolved } : {}),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'lucide-react',
      'zod',
      'zod/v4',
      '@tanstack/react-query',
      'wouter',
      'clsx',
      'tailwind-merge',
      '@sentry/react',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'date-fns',
      'drizzle-orm',
      'drizzle-zod'
    ],
    esbuildOptions: {
      target: ['es2019', 'safari12'],
    },
    force: true,
  },
  esbuild: {
    target: ['es2019', 'safari12'],
  },
  ssr: {
    noExternal: [
      'lucide-react',
      'drizzle-orm',
      'drizzle-zod'
    ],
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.resolve(__dirname, '../tailwind.config.ts') }),
        autoprefixer,
      ],
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('@radix-ui') || id.includes('@radix')) return 'vendor-radix';
            if (id.includes('react-dom')) return 'vendor-react-dom';
            if (id.includes('react') && !id.includes('react-dom')) return 'vendor-react';
            if (id.includes('date-fns')) return 'vendor-date-fns';
            if (id.includes('tiny-invariant')) return 'vendor-invariant';
            if (id.includes('clsx')) return 'vendor-clsx';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
