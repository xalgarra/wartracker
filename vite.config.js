import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/wartracker/',
  test: {
    environment: 'node',
  },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      // Sólo precachea el shell. Los runtime caches (fotos, queries) se gestionan abajo.
      includeAssets: ['icon.svg', 'icon-maskable.svg', 'favicon.svg'],
      manifest: {
        name: 'WarTracker',
        short_name: 'WarTracker',
        description: 'Tu colección de miniaturas, en orden.',
        start_url: '/wartracker/',
        scope: '/wartracker/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1a1410',
        theme_color: '#cb6a45',
        lang: 'es',
        icons: [
          { src: 'icon.svg',          sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precachea el app shell. Excluye source maps y assets pesados.
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: '/wartracker/index.html',
        navigateFallbackDenylist: [/^\/wartracker\/api/],
        runtimeCaching: [
          {
            // Fotos de Supabase Storage: cache-first con expiración
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'wt-storage-photos',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Queries REST a Supabase: network-first con timeout, fallback a cache si offline
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'wt-supabase-rest',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 1 día
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Edge functions (cámara): nunca cachear
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/functions/'),
            handler: 'NetworkOnly',
          },
          {
            // Google Fonts CSS: stale-while-revalidate
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'wt-google-fonts-css' },
          },
          {
            // Google Fonts archivos: cache-first largo
            urlPattern: ({ url }) => url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'wt-google-fonts-static',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
