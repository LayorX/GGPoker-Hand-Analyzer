/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  test: {
    // ...
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',

      devOptions: {
        enabled: true,
        type: 'module',
      },

      manifest: {
        name: 'GGPoker Hand Analyzer',
        short_name: 'ggpokerAnalyzer',
        description: 'A completely free, privacy-focused, and lightweight web-based tool for analyzing your GGPoker hands anytime, anywhere.',
        theme_color: '#EC4899',
        background_color: '#0c0a18',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: './index.html',
        scope: './',
        icons: [
          {
            src: 'icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          }
        ],
      },
    }),
  ]

});