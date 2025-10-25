import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'The Connection',
        short_name: 'Connection',
        description: 'Christian Community Platform',
        theme_color: '#0B132B',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('client/src', import.meta.url)),
      '@shared': fileURLToPath(new URL('shared', import.meta.url)),
      '@assets': fileURLToPath(new URL('client/src/assets', import.meta.url)),
    },
  },
  root: fileURLToPath(new URL('client', import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL('dist/public', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast'
          ],
          'vendor-utils': ['clsx', 'tailwind-merge', 'date-fns'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-icons': ['lucide-react']
        }
      }
    },
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    }
  },
})
