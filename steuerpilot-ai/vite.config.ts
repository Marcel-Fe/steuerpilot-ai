import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// base muss zum GitHub-Pages-Projektpfad passen: https://<user>.github.io/steuerpilot-ai/
// https://vite.dev/config/
export default defineConfig({
  base: '/steuerpilot-ai/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Manifest liegt bereits unter public/manifest.webmanifest und ist im HTML verlinkt
      manifest: false,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-180.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
})
