import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'VibeProof Studio',
        short_name: 'VibeProof',
        description: 'A local-first browser AI app builder with WebLLM, LocalKit, PGlite, and a proof workspace.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#eef4f8',
        theme_color: '#f8fbff',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,ico,wasm,data}'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname === 'huggingface.co' ||
              url.hostname.endsWith('.huggingface.co') ||
              url.hostname === 'cdn-lfs.huggingface.co',
            handler: 'CacheFirst',
            options: {
              cacheName: 'vibeproof-model-assets',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
