import type { UserConfig } from 'vite'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'
export default async function defineConfig(): Promise<UserConfig> {
  const [{ default: react }, { VitePWA }] = await Promise.all([
    import('@vitejs/plugin-react'),
    import('vite-plugin-pwa'),
  ])

  return {
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
        '@connection/shared': fileURLToPath(new URL('packages/shared/src', import.meta.url)),
        '@connection/ui': fileURLToPath(new URL('packages/ui/src', import.meta.url)),
        '@shared': fileURLToPath(new URL('packages/shared/src', import.meta.url)),
        '@assets': fileURLToPath(new URL('client/src/assets', import.meta.url)),
      },
    },
    esbuild: {
      drop: ['debugger'],
      pure: ['console.log', 'console.info'],
    },
    root: fileURLToPath(new URL('client', import.meta.url)),
    build: {
      outDir: fileURLToPath(new URL('dist/public', import.meta.url)),
      emptyOutDir: true,
      sourcemap: true, // Enable source maps for error tracking
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
              if (id.includes('@radix-ui/')) return 'vendor-radix';
              if (id.includes('@tiptap/') || id.includes('prosemirror') || id.includes('tiptap-markdown')) return 'vendor-tiptap';
              if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-core')) return 'vendor-query';
              if (id.includes('lucide-react')) return 'vendor-icons';
            }
          }
        }
      },
      target: 'es2020',
      minify: 'esbuild'
    }
  }
}
