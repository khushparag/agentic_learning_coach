import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { handle404Plugin } from './vite-plugins/handle-404'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    handle404Plugin() // Prevent 404s from causing redirects
  ],
  
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    
    // Custom middleware to handle 404s gracefully
    middlewareMode: false,
    
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      }
    },
    
    // Prevent Vite from trying to load non-existent source files
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate mermaid into its own chunk to avoid bundling issues
          mermaid: ['mermaid'],
        }
      }
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@services': resolve(__dirname, 'src/services'),
      '@types': resolve(__dirname, 'src/types'),
      // Fix cytoscape resolution for mermaid
      'cytoscape/dist/cytoscape.umd.js': 'cytoscape',
    }
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'cytoscape',
    ],
    exclude: [
      'mermaid',
    ],
    esbuildOptions: {
      // Handle mermaid's cytoscape import
      define: {
        global: 'globalThis'
      }
    }
  }
})