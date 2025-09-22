import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
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
    rollupOptions: {
      output: {
        // Split major vendor libraries into separate chunks to avoid very large bundles
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('@radix-ui') || id.includes('@radix')) return 'vendor-radix';
            if (id.includes('react-dom')) return 'vendor-react-dom';
            if (id.includes('react') && !id.includes('react-dom')) return 'vendor-react';
            if (id.includes('date-fns')) return 'vendor-date-fns';
            if (id.includes('tiny-invariant')) return 'vendor-invariant';
            if (id.includes('clsx')) return 'vendor-clsx';
            // fallback: group other node_modules into vendor chunk
            return 'vendor';
          }
        },
      },
    },
    // keep default chunk size warning limit or adjust if you prefer
    chunkSizeWarningLimit: 600,
  },
});
