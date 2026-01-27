import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

/**
 * Development-specific Vite configuration
 * This configuration is optimized for development experience with:
 * - Enhanced hot reloading
 * - Better debugging capabilities
 * - Development-specific optimizations
 * - Mock API integration
 */
export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      babel: {
        plugins: [
          // Development-specific babel plugins
          ['@babel/plugin-transform-react-jsx-development', {}],
        ]
      }
    })
  ],
  
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow external connections
    open: true,
    cors: true,
    
    // Enhanced proxy configuration for development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🔴 Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔵 Proxying request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('🟢 Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
      // Mock API for development
      '/mock-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mock-api/, ''),
      }
    },
    
    // Hot Module Replacement
    hmr: {
      port: 24678,
      overlay: true, // Show error overlay
    },
    
    // File watching
    watch: {
      usePolling: false,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
  },
  
  // Development build settings
  build: {
    sourcemap: true,
    minify: false, // Don't minify in development
    target: 'es2020',
    
    rollupOptions: {
      output: {
        // Readable chunk names for development
        chunkFileNames: 'dev-chunks/[name].js',
        entryFileNames: 'dev-entry/[name].js',
        assetFileNames: 'dev-assets/[name].[ext]'
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
      '@test': resolve(__dirname, 'src/test'),
      '@mobile': resolve(__dirname, 'src/components/mobile'),
      '@styles': resolve(__dirname, 'src/styles')
    }
  },
  
  // Development optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@headlessui/react',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      'framer-motion',
      'zustand',
      'axios'
    ],
    force: true // Force re-optimization on every dev server start
  },
  
  // CSS configuration for development
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]' // Readable class names
    }
  },
  
  // Development-specific esbuild settings
  esbuild: {
    target: 'es2020',
    keepNames: true, // Preserve function names for debugging
    sourcemap: true,
  },
  
  // Environment variables
  define: {
    __DEV__: true,
    __PROD__: false,
    __TEST__: false,
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0-dev'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // Development preview settings
  preview: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
  }
})