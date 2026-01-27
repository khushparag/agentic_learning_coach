/**
 * WebSocket Context Provider
 * Manages global WebSocket connections and provides real-time updates across the application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'

interface WebSocketContextValue {
  isConnected: boolean
  connectionStates: Record<string, boolean>
  subscribe: (connectionName: string, messageType: string, callback: (data: unknown) => void) => () => void
  send: (connectionName: string, type: string, data: unknown) => void
  reconnect: (connectionName?: string) => void
  disconnect: (connectionName?: string) => void
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined)

interface WebSocketProviderProps {
  children: ReactNode
}

// Simple WebSocket wrapper
class SimpleWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private handlers: Map<string, Set<(data: unknown) => void>> = new Map()
  private eventHandlers: Map<string, Set<() => void>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(url: string) {
    this.url = url
  }

  connect(): void {
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.emit('connected')
      }

      this.ws.onclose = () => {
        this.emit('disconnected')
        this.attemptReconnect()
      }

      this.ws.onerror = () => {
        this.emit('error')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type && this.handlers.has(data.type)) {
            this.handlers.get(data.type)?.forEach(handler => handler(data.data || data))
          }
        } catch {
          console.warn('Failed to parse WebSocket message')
        }
      }
    } catch {
      console.warn('Failed to create WebSocket connection')
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts)
    }
  }

  subscribe(messageType: string, callback: (data: unknown) => void): () => void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, new Set())
    }
    this.handlers.get(messageType)?.add(callback)
    
    return () => {
      this.handlers.get(messageType)?.delete(callback)
    }
  }

  on(event: string, callback: () => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)?.add(callback)
  }

  private emit(event: string): void {
    this.eventHandlers.get(event)?.forEach(handler => handler())
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  close(): void {
    this.maxReconnectAttempts = 0 // Prevent reconnection
    this.ws?.close()
    this.ws = null
  }

  reconnect(): void {
    this.maxReconnectAttempts = 5
    this.reconnectAttempts = 0
    this.close()
    this.connect()
  }
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  
  const [connectionStates, setConnectionStates] = useState<Record<string, boolean>>({})
  const [connections, setConnections] = useState<Record<string, SimpleWebSocket>>({})

  // Initialize WebSocket connections when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // Disconnect all connections when user logs out
      Object.values(connections).forEach(conn => conn.close())
      setConnections({})
      setConnectionStates({})
      return
    }

    const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
    
    // Define core connections
    const coreConnections = [
      {
        name: 'progress',
        url: `${wsBaseUrl}/ws/progress/${user.id}`,
        handlers: {
          progress_update: () => handleProgressUpdate(),
          task_completed: () => handleTaskCompleted(),
          module_completed: () => handleModuleCompleted()
        }
      },
      {
        name: 'gamification',
        url: `${wsBaseUrl}/ws/gamification/${user.id}`,
        handlers: {
          xp_awarded: () => handleXPAwarded(),
          achievement_unlocked: () => handleAchievementUnlocked(),
          level_up: () => handleLevelUp(),
          streak_updated: () => handleStreakUpdated()
        }
      },
      {
        name: 'social',
        url: `${wsBaseUrl}/ws/social/${user.id}`,
        handlers: {
          friend_request: () => handleFriendRequest(),
          challenge_received: () => handleChallengeReceived(),
          group_invitation: () => handleGroupInvitation()
        }
      }
    ]

    // Initialize connections
    const newConnections: Record<string, SimpleWebSocket> = {}
    
    coreConnections.forEach(({ name, url, handlers }) => {
      const connection = new SimpleWebSocket(url)
      
      // Set up event handlers
      connection.on('connected', () => {
        setConnectionStates(prev => ({ ...prev, [name]: true }))
        console.log(`WebSocket ${name} connected`)
      })

      connection.on('disconnected', () => {
        setConnectionStates(prev => ({ ...prev, [name]: false }))
        console.log(`WebSocket ${name} disconnected`)
      })

      connection.on('error', () => {
        console.error(`WebSocket ${name} error`)
        setConnectionStates(prev => ({ ...prev, [name]: false }))
      })

      // Subscribe to message handlers
      Object.entries(handlers).forEach(([messageType, handler]) => {
        connection.subscribe(messageType, handler)
      })

      // Connect
      connection.connect()
      newConnections[name] = connection
    })

    setConnections(newConnections)

    // Cleanup on unmount or user change
    return () => {
      Object.values(newConnections).forEach(conn => conn.close())
    }
  }, [isAuthenticated, user?.id])

  // Message handlers - invalidate relevant queries
  const handleProgressUpdate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
  }

  const handleTaskCompleted = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
  }

  const handleModuleCompleted = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
  }

  const handleXPAwarded = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.gamification.all })
  }

  const handleAchievementUnlocked = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.gamification.all })
  }

  const handleLevelUp = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.gamification.all })
  }

  const handleStreakUpdated = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.gamification.all })
  }

  const handleFriendRequest = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.social.all })
  }

  const handleChallengeReceived = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.social.all })
  }

  const handleGroupInvitation = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.social.all })
  }

  // Context methods
  const subscribe = (connectionName: string, messageType: string, callback: (data: unknown) => void) => {
    const connection = connections[connectionName]
    if (connection) {
      return connection.subscribe(messageType, callback)
    }
    return () => {}
  }

  const send = (connectionName: string, type: string, data: unknown) => {
    const connection = connections[connectionName]
    if (connection) {
      connection.send({ type, data })
    }
  }

  const reconnect = (connectionName?: string) => {
    if (connectionName) {
      const connection = connections[connectionName]
      if (connection) {
        connection.reconnect()
      }
    } else {
      // Reconnect all connections
      Object.values(connections).forEach(connection => {
        connection.reconnect()
      })
    }
  }

  const disconnect = (connectionName?: string) => {
    if (connectionName) {
      connections[connectionName]?.close()
      setConnectionStates(prev => ({ ...prev, [connectionName]: false }))
    } else {
      // Disconnect all connections
      Object.values(connections).forEach(conn => conn.close())
      setConnectionStates({})
    }
  }

  const isConnected = Object.values(connectionStates).some(state => state)

  const value: WebSocketContextValue = {
    isConnected,
    connectionStates,
    subscribe,
    send,
    reconnect,
    disconnect
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocketContext = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}

export default WebSocketProvider
