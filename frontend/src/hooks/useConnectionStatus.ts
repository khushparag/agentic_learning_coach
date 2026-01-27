import { useState, useEffect, useCallback } from 'react'

export interface ConnectionStatus {
  isConnected: boolean
  isChecking: boolean
  lastChecked: Date | null
  error: string | null
  backendUrl: string
}

const HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
const HEALTH_CHECK_TIMEOUT = 5000 // 5 seconds

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isChecking: true,
    lastChecked: null,
    error: null,
    backendUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  })

  const checkConnection = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true }))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT)

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
      const response = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        setStatus(prev => ({
          ...prev,
          isConnected: true,
          isChecking: false,
          lastChecked: new Date(),
          error: null,
        }))
      } else {
        setStatus(prev => ({
          ...prev,
          isConnected: false,
          isChecking: false,
          lastChecked: new Date(),
          error: `Server returned ${response.status}`,
        }))
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      const errorMessage = error instanceof Error 
        ? error.name === 'AbortError' 
          ? 'Connection timeout'
          : error.message
        : 'Unknown error'

      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isChecking: false,
        lastChecked: new Date(),
        error: errorMessage,
      }))
    }
  }, [])

  // Initial check and periodic polling
  useEffect(() => {
    checkConnection()

    const intervalId = setInterval(checkConnection, HEALTH_CHECK_INTERVAL)

    return () => clearInterval(intervalId)
  }, [checkConnection])

  // Re-check on window focus
  useEffect(() => {
    const handleFocus = () => {
      checkConnection()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [checkConnection])

  return {
    ...status,
    refresh: checkConnection,
  }
}

export default useConnectionStatus
