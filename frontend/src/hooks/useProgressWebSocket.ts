import { useEffect, useRef, useState, useCallback } from 'react'

interface ProgressWebSocketMessage {
  type: 'progress_update' | 'task_completed' | 'module_completed' | 'achievement_unlocked' | 'streak_updated'
  data: {
    userId?: string
    moduleId?: string
    taskId?: string
    progress?: number
    points?: number
    streak?: number
    achievement?: {
      id: string
      name: string
      description: string
    }
  }
  timestamp: string
}

interface UseProgressWebSocketOptions {
  userId?: string
  enabled?: boolean
  onMessage?: (message: ProgressWebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

interface UseProgressWebSocketReturn {
  isConnected: boolean
  lastMessage: ProgressWebSocketMessage | null
  sendMessage: (message: any) => void
  reconnect: () => void
  disconnect: () => void
}

export const useProgressWebSocket = (options: UseProgressWebSocketOptions = {}): UseProgressWebSocketReturn => {
  const {
    userId,
    enabled = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<ProgressWebSocketMessage | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = useRef(1000)

  const connect = useCallback(() => {
    if (!enabled || !userId) return

    try {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/progress/${userId}`
      console.log('Connecting to progress WebSocket:', wsUrl)
      
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('Progress WebSocket connected')
        setIsConnected(true)
        reconnectAttempts.current = 0
        reconnectDelay.current = 1000
        
        // Send initial sync message
        ws.send(JSON.stringify({
          type: 'sync_request',
          timestamp: new Date().toISOString()
        }))
        
        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: ProgressWebSocketMessage = JSON.parse(event.data)
          console.log('Received progress update:', message)
          
          setLastMessage(message)
          onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('Progress WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        wsRef.current = null
        
        onDisconnect?.()
        
        // Attempt to reconnect if not a normal closure and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && enabled) {
          reconnectAttempts.current++
          
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts}) in ${reconnectDelay.current}ms`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay.current)
          
          // Exponential backoff with jitter
          reconnectDelay.current = Math.min(
            reconnectDelay.current * 2 + Math.random() * 1000,
            30000
          )
        }
      }

      ws.onerror = (error) => {
        console.error('Progress WebSocket error:', error)
        setIsConnected(false)
        onError?.(error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [enabled, userId, onMessage, onConnect, onDisconnect, onError])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }))
    } else {
      console.warn('WebSocket not connected, cannot send message:', message)
    }
  }, [])

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectAttempts.current = 0
    reconnectDelay.current = 1000
    connect()
  }, [connect])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    setIsConnected(false)
  }, [])

  // Initialize connection
  useEffect(() => {
    if (enabled && userId) {
      connect()
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect, enabled, userId])

  // Handle visibility change to reconnect when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && userId && !isConnected) {
        console.log('Tab became visible, attempting to reconnect WebSocket')
        reconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, userId, isConnected, reconnect])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect,
    disconnect
  }
}

export type { ProgressWebSocketMessage, UseProgressWebSocketOptions }