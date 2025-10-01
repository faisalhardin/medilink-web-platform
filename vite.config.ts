import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import dotenv from 'dotenv';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  build: {
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          router: ['react-router-dom']
        }
      }
    },
    // Reduce bundle size
    chunkSizeWarningLimit: 1000
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    // Domain configuration for build-time
    'import.meta.env.VITE_APP_DOMAIN': JSON.stringify('medianne.id'),
    'import.meta.env.VITE_APP_WWW_DOMAIN': JSON.stringify('www.medianne.id'),
    'import.meta.env.VITE_APP_FIREBASE_URL': JSON.stringify('medianne-web.web.app')
  }
})