import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permet l'accès depuis d'autres appareils sur le réseau
    port: 5173,
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    }
  },
  build: {
    minify: 'terser'
  }
})
