import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base muss zum GitHub-Pages-Projektpfad passen: https://<user>.github.io/steuerpilot-ai/
// https://vite.dev/config/
export default defineConfig({
  base: '/steuerpilot-ai/',
  plugins: [react(), tailwindcss()],
})
