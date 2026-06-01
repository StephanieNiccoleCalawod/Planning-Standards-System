import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    watch: {
      usePolling: true,
    },
    proxy: {
      // Service Catalogue service runs on port 3000
      '/api/services': {
        target: process.env.PROXY_CATALOGUE_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      // OPCR Commitment service runs on port 3002
      '/api/commitments': {
        target: process.env.PROXY_COMMITMENT_URL || 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
      '/api/opcr': {
        target: process.env.PROXY_COMMITMENT_URL || 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
      '/api/dashboard': {
        target: process.env.PROXY_COMMITMENT_URL || 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
      // All other API endpoints go to KPI/SLA standards service on port 3001
      '/api': {
        target: process.env.PROXY_KPI_SLA_URL || 'http://127.0.0.1:3001',
        changeOrigin: true,
      }
    }
  }
})

