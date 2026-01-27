import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handler to prevent 404s from causing page redirects
window.addEventListener('error', (event) => {
  // Check if it's a resource loading error (404)
  if (event.target && (event.target as HTMLElement).tagName) {
    const target = event.target as HTMLScriptElement | HTMLLinkElement
    const src = 'src' in target ? target.src : 'href' in target ? target.href : ''
    
    // If it's a source file (.tsx, .ts, .jsx, .js, .map), prevent default behavior
    if (src && /\.(tsx?|jsx?|map)(\?.*)?$/.test(src)) {
      console.warn('[Error Handler] Prevented redirect due to missing source file:', src)
      event.preventDefault()
      event.stopPropagation()
      return false
    }
  }
}, true)

// Prevent unhandled promise rejections from causing issues
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's a fetch error for source files
  if (event.reason && event.reason.message) {
    const message = event.reason.message
    if (message.includes('.tsx') || message.includes('.ts') || message.includes('.jsx') || message.includes('.map')) {
      console.warn('[Error Handler] Prevented unhandled rejection for source file:', message)
      event.preventDefault()
      return false
    }
  }
})

// Initialize React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
