/**
 * WebSocket Service - Centralized WebSocket connection management
 * Handles real-time updates for progress, achievements, collaboration, and leaderboards
 */

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  userId?: string
  sessionId?: string
}

export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
  timeout?: number
}

export interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  reconnectAttempts: number
  lastError?: string
  lastConnected?: Date
  lastDisconnected?: Date
}

type EventCallback = (...args: any[]) => void

export class WebSocketService {
  private ws: WebSocket | null = null
  private config: Required<WebSocketConfig>
  private state: ConnectionState
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private messageQueue: WebSocketMessage[] = []
  private subscriptions = new Map<string, Set<(data: any) => void>>()
  private eventListeners = new Map<string, Set<EventCallback>>()

  constructor(config: WebSocketConfig) {
    this.config = {
      protocols: [],
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      timeout: 10000,
      ...config
    }

    this.state = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0
    }
  }

  /**
   * Add event listener
   */
  on(event: string, listener: EventCallback): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
    return this
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: EventCallback): this {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
    return this
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state.isConnected || this.state.isConnecting) {
      return
    }

    this.state.isConnecting = true
    this.emit('connecting')

    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols)
      
      // Set up event handlers
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)

      // Set connection timeout
      setTimeout(() => {
        if (this.state.isConnecting) {
          this.ws?.close()
          this.handleError(new Error('Connection timeout'))
        }
      }, this.config.timeout)

    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearTimeouts()
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }

    this.state = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      lastDisconnected: new Date()
    }

    this.emit('disconnected')
  }

  /**
   * Send message to WebSocket server
   */
  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date().toISOString()
    }

    if (this.state.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(fullMessage))
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        this.messageQueue.push(fullMessage)
      }
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(fullMessage)
    }
  }

  /**
   * Subscribe to specific message types
   */
  subscribe(messageType: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(messageType)) {
      this.subscriptions.set(messageType, new Set())
    }
    
    this.subscriptions.get(messageType)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(messageType)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscriptions.delete(messageType)
        }
      }
    }
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state }
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.disconnect()
    this.state.reconnectAttempts = 0
    this.connect()
  }

  private handleOpen(): void {
    console.log('WebSocket connected to:', this.config.url)
    
    this.state = {
      isConnected: true,
      isConnecting: false,
      reconnectAttempts: 0,
      lastConnected: new Date()
    }

    this.emit('connected')
    this.startHeartbeat()
    this.processMessageQueue()
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      // Handle heartbeat responses
      if (message.type === 'pong') {
        return
      }

      // Emit to general listeners
      this.emit('message', message)

      // Emit to specific type subscribers
      const callbacks = this.subscriptions.get(message.type)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(message.data)
          } catch (error) {
            console.error('Error in WebSocket message callback:', error)
          }
        })
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason)
    
    this.clearTimeouts()
    
    this.state = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: this.state.reconnectAttempts,
      lastDisconnected: new Date()
    }

    this.emit('disconnected', event)

    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000 && this.state.reconnectAttempts < this.config.reconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  private handleError(error: Event | Error): void {
    console.error('WebSocket error:', error)
    
    this.state.lastError = error instanceof Error ? error.message : 'Unknown error'
    this.state.isConnecting = false
    
    this.emit('error', error)
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts),
      30000 // Max 30 seconds
    )

    console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.state.reconnectAttempts + 1}/${this.config.reconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.state.reconnectAttempts++
      this.connect()
    }, delay)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.state.isConnected) {
        this.send({ type: 'ping', data: {} })
      }
    }, this.config.heartbeatInterval)
  }

  private clearTimeouts(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.state.isConnected) {
      const message = this.messageQueue.shift()!
      try {
        this.ws?.send(JSON.stringify(message))
      } catch (error) {
        console.error('Failed to send queued message:', error)
        // Put message back at front of queue
        this.messageQueue.unshift(message)
        break
      }
    }
  }
}

// Singleton instance for global WebSocket management
class WebSocketManager {
  private connections = new Map<string, WebSocketService>()
  
  getConnection(name: string, config: WebSocketConfig): WebSocketService {
    if (!this.connections.has(name)) {
      this.connections.set(name, new WebSocketService(config))
    }
    return this.connections.get(name)!
  }

  closeConnection(name: string): void {
    const connection = this.connections.get(name)
    if (connection) {
      connection.disconnect()
      this.connections.delete(name)
    }
  }

  closeAllConnections(): void {
    this.connections.forEach((connection) => {
      connection.disconnect()
    })
    this.connections.clear()
  }

  getConnectionNames(): string[] {
    return Array.from(this.connections.keys())
  }
}

export const webSocketManager = new WebSocketManager()
