/**
 * WebSocket Hook - React hook for WebSocket connections
 * Provides a clean interface for components to use WebSocket functionality
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { WebSocketService, WebSocketConfig, ConnectionState, webSocketManager } from '../services/webSocketService'

export interface UseWebSocketOptions extends Partial<WebSocketConfig> {
  enabled?: boolean
  connectionName?: string
  onConnect?: () => void
  onDisconnect?: (event?: CloseEvent) => void
  onError?: (error: Event | Error) => void
  onMessage?: (message: any) => void
}

export interface UseWebSocketReturn {
  connectionState: ConnectionState
  isConnected: boolean
  lastMessage: any | null
  send: (type: string, data: any) => void
  subscribe: (messageType: string, callback: (data: any) => void) => () => void
  unsubscribe: (messageType: string, callback: (data: any) => void) => void
  reconnect: () => void
  disconnect: () => void
}

export function useWebSocket(
  url?: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    enabled = true,
    connectionName = 'default',
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    ...wsConfig
  } = options

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0
  })

  const [lastMessage, setLastMessage] = useState<any | null>(null)

  const wsServiceRef = useRef<WebSocketService | null>(null)
  const subscriptionsRef = useRef<(() => void)[]>([])
  const messageHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())

  // Initialize WebSocket service
  useEffect(() => {
    if (!enabled || !url) return

    const config: WebSocketConfig = {
      url,
      ...wsConfig
    }

    wsServiceRef.current = webSocketManager.getConnection(connectionName, config)
    
    // Set up event listeners
    const handleStateChange = () => {
      if (wsServiceRef.current) {
        setConnectionState(wsServiceRef.current.getState())
      }
    }

    const handleConnect = () => {
      handleStateChange()
      onConnect?.()
    }

    const handleDisconnect = (event?: CloseEvent) => {
      handleStateChange()
      onDisconnect?.(event)
    }

    const handleError = (error: Event | Error) => {
      handleStateChange()
      onError?.(error)
    }

    const handleMessage = (message: any) => {
      setLastMessage(message)
      onMessage?.(message)
    }

    // Add event listeners using EventEmitter methods
    const ws = wsServiceRef.current
    ws.on('connected', handleConnect)
    ws.on('disconnected', handleDisconnect)
    ws.on('error', handleError)
    ws.on('message', handleMessage)
    ws.on('connecting', handleStateChange)

    // Connect
    ws.connect()

    // Cleanup function
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.off('connected', handleConnect)
        wsServiceRef.current.off('disconnected', handleDisconnect)
        wsServiceRef.current.off('error', handleError)
        wsServiceRef.current.off('message', handleMessage)
        wsServiceRef.current.off('connecting', handleStateChange)
      }
      
      // Clean up subscriptions
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe())
      subscriptionsRef.current = []
    }
  }, [enabled, url, connectionName])

  // Send message function
  const send = useCallback((type: string, data: any) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.send({ type, data })
    }
  }, [])

  // Subscribe to message types
  const subscribe = useCallback((messageType: string, callback: (data: any) => void) => {
    // Track handlers locally for unsubscribe
    if (!messageHandlersRef.current.has(messageType)) {
      messageHandlersRef.current.set(messageType, new Set())
    }
    messageHandlersRef.current.get(messageType)!.add(callback)

    if (wsServiceRef.current) {
      const unsubscribe = wsServiceRef.current.subscribe(messageType, callback)
      subscriptionsRef.current.push(unsubscribe)
      return unsubscribe
    }
    return () => {}
  }, [])

  // Unsubscribe from message types
  const unsubscribe = useCallback((messageType: string, callback: (data: any) => void) => {
    const handlers = messageHandlersRef.current.get(messageType)
    if (handlers) {
      handlers.delete(callback)
    }
    // Note: The actual WebSocket unsubscription happens via the returned function from subscribe
  }, [])

  // Reconnect function
  const reconnect = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.reconnect()
    }
  }, [])

  // Disconnect function
  const disconnect = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect()
    }
  }, [])

  return {
    connectionState,
    isConnected: connectionState.isConnected,
    lastMessage,
    send,
    subscribe,
    unsubscribe,
    reconnect,
    disconnect
  }
}

/**
 * Hook for real-time progress updates
 */
export function useProgressWebSocketUpdates(userId?: string) {
  const { connectionState, send, subscribe } = useWebSocket(
    `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/progress/${userId}`,
    {
      enabled: !!userId,
      connectionName: 'progress',
      reconnectAttempts: 5,
      reconnectDelay: 1000
    }
  )

  const [progressUpdates, setProgressUpdates] = useState<any[]>([])

  useEffect(() => {
    const unsubscribes = [
      subscribe('progress_update', (data) => {
        setProgressUpdates(prev => [...prev.slice(-9), data])
      }),
      subscribe('task_completed', (data) => {
        setProgressUpdates(prev => [...prev.slice(-9), { type: 'task_completed', ...data }])
      }),
      subscribe('module_completed', (data) => {
        setProgressUpdates(prev => [...prev.slice(-9), { type: 'module_completed', ...data }])
      })
    ]

    return () => {
      unsubscribes.forEach(fn => fn())
    }
  }, [subscribe])

  return {
    connectionState,
    progressUpdates,
    sendProgressUpdate: (data: any) => send('progress_update', data)
  }
}

/**
 * Hook for real-time achievement notifications
 */
export function useAchievementWebSocket(userId?: string) {
  const { connectionState, subscribe } = useWebSocket(
    `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/achievements/${userId}`,
    {
      enabled: !!userId,
      connectionName: 'achievements',
      reconnectAttempts: 5,
      reconnectDelay: 1000
    }
  )

  const [achievements, setAchievements] = useState<any[]>([])

  useEffect(() => {
    const unsubscribe = subscribe('achievement_unlocked', (data) => {
      setAchievements(prev => [...prev, data])
    })

    return unsubscribe
  }, [subscribe])

  return {
    connectionState,
    achievements,
    clearAchievements: () => setAchievements([])
  }
}

/**
 * Hook for real-time leaderboard updates
 */
export function useLeaderboardWebSocket(leaderboardId?: string) {
  const { connectionState, send, subscribe } = useWebSocket(
    `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/leaderboard/${leaderboardId}`,
    {
      enabled: !!leaderboardId,
      connectionName: `leaderboard-${leaderboardId}`,
      reconnectAttempts: 3,
      reconnectDelay: 2000
    }
  )

  const [leaderboardData, setLeaderboardData] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = subscribe('leaderboard_update', (data) => {
      setLeaderboardData(data)
    })

    return unsubscribe
  }, [subscribe])

  return {
    connectionState,
    leaderboardData,
    joinLeaderboard: () => send('join_leaderboard', {}),
    leaveLeaderboard: () => send('leave_leaderboard', {})
  }
}

/**
 * Hook for real-time collaboration features
 */
export function useCollaborationWebSocket(roomId?: string, userId?: string) {
  const { connectionState, send, subscribe } = useWebSocket(
    `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/collaboration/${roomId}`,
    {
      enabled: !!(roomId && userId),
      connectionName: `collaboration-${roomId}`,
      reconnectAttempts: 5,
      reconnectDelay: 1000
    }
  )

  const [participants, setParticipants] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [cursors, setCursors] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    const unsubscribes = [
      subscribe('user_joined', (data) => {
        setParticipants(prev => [...prev.filter(p => p.id !== data.id), data])
      }),
      subscribe('user_left', (data) => {
        setParticipants(prev => prev.filter(p => p.id !== data.id))
        setCursors(prev => {
          const newCursors = new Map(prev)
          newCursors.delete(data.id)
          return newCursors
        })
      }),
      subscribe('chat_message', (data) => {
        setMessages(prev => [...prev.slice(-49), data])
      }),
      subscribe('cursor_update', (data) => {
        setCursors(prev => new Map(prev).set(data.userId, data))
      }),
      subscribe('participants_list', (data) => {
        setParticipants(data.participants || [])
      })
    ]

    // Join room when connected
    if (connectionState.isConnected) {
      send('join_room', { userId, roomId })
    }

    return () => {
      unsubscribes.forEach(fn => fn())
    }
  }, [subscribe, connectionState.isConnected, userId, roomId, send])

  return {
    connectionState,
    participants,
    messages,
    cursors,
    sendMessage: (message: string) => send('chat_message', { message, userId }),
    updateCursor: (position: any) => send('cursor_update', { position, userId }),
    joinRoom: () => send('join_room', { userId, roomId }),
    leaveRoom: () => send('leave_room', { userId, roomId })
  }
}