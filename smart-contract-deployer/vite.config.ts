import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'contractforge.io',
      'www.contractforge.io',
      'localhost',
      '127.0.0.1',
      '192.168.1.188'
    ],
    hmr: {
      port: 5173,
      clientPort: 5173,
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  assetsInclude: []
})