import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Installable app: web manifest + service worker (production builds only)
    VitePWA({
      // Ask before switching to a new version, so an open form is never reloaded away
      registerType: 'prompt',
      // Registered from React (PwaUpdatePrompt), not by an injected script
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Expense Tracker',
        short_name: 'Expenses',
        description: 'Track your expenses, accounts and monthly spending.',
        lang: 'en-IN',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#0f766e',
        background_color: '#f6f7f9',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell only. API responses are personal and must always be fresh,
        // so /api is never cached and never answered with the offline page.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    // Same-origin in dev so HTTP-only auth cookies work
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
