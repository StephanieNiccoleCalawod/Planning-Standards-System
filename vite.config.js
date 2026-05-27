import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Service Catalogue service runs on port 3000
      '/api/services': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // All other API endpoints go to KPI/SLA standards service on port 3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})

