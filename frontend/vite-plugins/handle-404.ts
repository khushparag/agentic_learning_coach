/**
 * Vite Plugin: Handle 404s Gracefully
 * 
 * This plugin prevents 404 errors for non-existent source files from causing
 * page redirects. It intercepts 404 responses for source files and converts
 * them to 204 No Content responses.
 * 
 * This is particularly useful when browser extensions or source maps try to
 * load files that don't exist.
 */

import type { Plugin } from 'vite'
import { existsSync } from 'fs'
import { join } from 'path'

export function handle404Plugin(): Plugin {
  return {
    name: 'handle-404',
    configureServer(server) {
      // Add middleware at the end to catch 404s
      return () => {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''
          
          // Only intercept source file requests
          const isSourceFile = /\.(tsx?|jsx?)(\?.*)?$/.test(url)
          const isMapFile = /\.map(\?.*)?$/.test(url)
          
          if (isSourceFile || isMapFile) {
            // Check if file exists
            const cleanUrl = url.split('?')[0]
            const filePath = join(server.config.root, cleanUrl)
            
            if (!existsSync(filePath)) {
              // File doesn't exist - return 204 instead of 404
              console.warn(`[404-Handler] Blocked 404 for non-existent file: ${url}`)
              res.statusCode = 204
              res.end()
              return
            }
          }
          
          next()
        })
      }
    }
  }
}
