/**
 * Collaboration Service
 * Handles real-time collaboration features including study groups, chat, and code sharing
 */

import { webSocketManager, WebSocketService } from './webSocketService'
import type {
  StudyGroup,
  CollaborationSession,
  ChatMessage,
  CursorPosition,
  CodeComment,
  CodeReview,
  ProgressShare,
  CollaborationUser,
  CollaborationSettings,
} from '../types/collaboration'
import { DEFAULT_COLLABORATION_SETTINGS } from '../types/collaboration'

export class CollaborationService {
  private wsService: WebSocketService
  private currentSession: CollaborationSession | null = null
  private settings: CollaborationSettings = DEFAULT_COLLABORATION_SETTINGS
  private eventHandlers = new Map<string, Set<(data: any) => void>>()

  constructor() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/collaboration'
    this.wsService = webSocketManager.getConnection('collaboration', {
      url: wsUrl,
      protocols: ['collaboration-v1'],
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.wsService.on('connected', () => {
      console.log('Collaboration WebSocket connected')
      this.emit('connection_status', { connected: true })
    })

    this.wsService.on('disconnected', () => {
      console.log('Collaboration WebSocket disconnected')
      this.emit('connection_status', { connected: false })
    })

    this.wsService.on('message', (message) => {
      this.handleWebSocketMessage(message)
    })
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'user_joined':
        this.emit('user_joined', message.data)
        break
      case 'user_left':
        this.emit('user_left', message.data)
        break
      case 'chat_message':
        this.emit('chat_message', message.data)
        break
      case 'cursor_update':
        this.emit('cursor_update', message.data)
        break
      case 'code_change':
        this.emit('code_change', message.data)
        break
      case 'comment_added':
        this.emit('comment_added', message.data)
        break
      case 'comment_updated':
        this.emit('comment_updated', message.data)
        break
      case 'comment_resolved':
        this.emit('comment_resolved', message.data)
        break
      case 'progress_shared':
        this.emit('progress_shared', message.data)
        break
      case 'session_updated':
        this.emit('session_updated', message.data)
        break
      default:
        console.warn('Unknown collaboration message type:', message.type)
    }
  }

  // Event handling
  on(event: string, handler: (data: any) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)

    return () => {
      const handlers = this.eventHandlers.get(event)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.eventHandlers.delete(event)
        }
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error('Error in collaboration event handler:', error)
        }
      })
    }
  }

  // Connection management
  async connect(): Promise<void> {
    await this.wsService.connect()
  }

  disconnect(): void {
    this.wsService.disconnect()
    this.currentSession = null
  }

  isConnected(): boolean {
    return this.wsService.getState().isConnected
  }

  // Study Groups
  async createStudyGroup(data: Partial<StudyGroup>): Promise<StudyGroup> {
    const response = await fetch('/api/collaboration/study-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Failed to create study group')
    }

    return response.json()
  }

  async getStudyGroups(filters?: {
    search?: string
    difficulty?: string
    language?: string
    isPublic?: boolean
  }): Promise<StudyGroup[]> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }

    const response = await fetch(`/api/collaboration/study-groups?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch study groups')
    }

    return response.json()
  }

  async joinStudyGroup(groupId: string): Promise<void> {
    const response = await fetch(`/api/collaboration/study-groups/${groupId}/join`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to join study group')
    }

    // Subscribe to group events
    this.wsService.send({
      type: 'join_group',
      data: { groupId }
    })
  }

  async leaveStudyGroup(groupId: string): Promise<void> {
    const response = await fetch(`/api/collaboration/study-groups/${groupId}/leave`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to leave study group')
    }

    // Unsubscribe from group events
    this.wsService.send({
      type: 'leave_group',
      data: { groupId }
    })
  }

  // Collaboration Sessions
  async createSession(data: Partial<CollaborationSession>): Promise<CollaborationSession> {
    const response = await fetch('/api/collaboration/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Failed to create collaboration session')
    }

    const session = await response.json()
    this.currentSession = session
    return session
  }

  async joinSession(sessionId: string): Promise<CollaborationSession> {
    const response = await fetch(`/api/collaboration/sessions/${sessionId}/join`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to join collaboration session')
    }

    const session = await response.json()
    this.currentSession = session

    // Subscribe to session events
    this.wsService.send({
      type: 'join_session',
      data: { sessionId }
    })

    return session
  }

  async leaveSession(): Promise<void> {
    if (!this.currentSession) return

    const sessionId = this.currentSession.id
    
    const response = await fetch(`/api/collaboration/sessions/${sessionId}/leave`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to leave collaboration session')
    }

    // Unsubscribe from session events
    this.wsService.send({
      type: 'leave_session',
      data: { sessionId }
    })

    this.currentSession = null
  }

  getCurrentSession(): CollaborationSession | null {
    return this.currentSession
  }

  // Chat functionality
  sendChatMessage(content: string, type: ChatMessage['type'] = 'text', metadata?: any): void {
    if (!this.currentSession) {
      throw new Error('No active collaboration session')
    }

    this.wsService.send({
      type: 'chat_message',
      data: {
        sessionId: this.currentSession.id,
        content,
        messageType: type,
        metadata
      }
    })
  }

  sendCodeSnippet(code: string, language: string): void {
    this.sendChatMessage(code, 'code', { language, codeSnippet: code })
  }

  // Send typing status
  sendTypingStatus(isTyping: boolean): void {
    if (!this.currentSession) return

    this.wsService.send({
      type: 'user_typing',
      data: {
        sessionId: this.currentSession.id,
        isTyping
      }
    })
  }

  reactToMessage(messageId: string, emoji: string): void {
    if (!this.currentSession) return

    this.wsService.send({
      type: 'message_reaction',
      data: {
        sessionId: this.currentSession.id,
        messageId,
        emoji
      }
    })
  }

  // Cursor sharing
  updateCursor(position: CursorPosition['position'], selection?: CursorPosition['selection']): void {
    if (!this.currentSession || !this.settings.showCursors) return

    this.wsService.send({
      type: 'cursor_update',
      data: {
        sessionId: this.currentSession.id,
        position,
        selection,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Code sharing
  shareCodeChange(content: string, language: string, operation: 'insert' | 'delete' | 'replace', range?: any): void {
    if (!this.currentSession) return

    this.wsService.send({
      type: 'code_change',
      data: {
        sessionId: this.currentSession.id,
        content,
        language,
        operation,
        range,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Code comments and reviews
  async addCodeComment(data: Omit<CodeComment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>): Promise<CodeComment> {
    const response = await fetch('/api/collaboration/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        sessionId: this.currentSession?.id
      })
    })

    if (!response.ok) {
      throw new Error('Failed to add code comment')
    }

    const comment = await response.json()

    // Notify other participants
    this.wsService.send({
      type: 'comment_added',
      data: {
        sessionId: this.currentSession?.id,
        comment
      }
    })

    return comment
  }

  async resolveComment(commentId: string): Promise<void> {
    const response = await fetch(`/api/collaboration/comments/${commentId}/resolve`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to resolve comment')
    }

    // Notify other participants
    this.wsService.send({
      type: 'comment_resolved',
      data: {
        sessionId: this.currentSession?.id,
        commentId
      }
    })
  }

  async createCodeReview(submissionId: string, comments: CodeComment[], summary?: string): Promise<CodeReview> {
    const response = await fetch('/api/collaboration/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId,
        comments,
        summary,
        sessionId: this.currentSession?.id
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create code review')
    }

    return response.json()
  }

  // Progress sharing
  shareProgress(data: Omit<ProgressShare, 'id' | 'timestamp' | 'reactions' | 'celebrationCount'>): void {
    if (!this.currentSession || !this.settings.enableProgressSharing) return

    this.wsService.send({
      type: 'progress_shared',
      data: {
        sessionId: this.currentSession.id,
        ...data,
        timestamp: new Date().toISOString()
      }
    })
  }

  celebrateProgress(shareId: string, emoji: string = '🎉'): void {
    if (!this.currentSession) return

    this.wsService.send({
      type: 'progress_celebration',
      data: {
        sessionId: this.currentSession.id,
        shareId,
        emoji
      }
    })
  }

  // Settings management
  updateSettings(newSettings: Partial<CollaborationSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    
    // Save to localStorage
    localStorage.setItem('collaboration_settings', JSON.stringify(this.settings))

    // Notify server of relevant setting changes
    this.wsService.send({
      type: 'settings_updated',
      data: {
        sessionId: this.currentSession?.id,
        settings: {
          showCursors: this.settings.showCursors,
          showUsernames: this.settings.showUsernames,
          enableProgressSharing: this.settings.enableProgressSharing
        }
      }
    })
  }

  getSettings(): CollaborationSettings {
    return { ...this.settings }
  }

  loadSettings(): void {
    const saved = localStorage.getItem('collaboration_settings')
    if (saved) {
      try {
        this.settings = { ...DEFAULT_COLLABORATION_SETTINGS, ...JSON.parse(saved) }
      } catch (error) {
        console.error('Failed to load collaboration settings:', error)
      }
    }
  }

  // Utility methods
  async getSessionParticipants(sessionId?: string): Promise<CollaborationUser[]> {
    const id = sessionId || this.currentSession?.id
    if (!id) return []

    const response = await fetch(`/api/collaboration/sessions/${id}/participants`)
    if (!response.ok) {
      throw new Error('Failed to fetch session participants')
    }

    return response.json()
  }

  async inviteToSession(sessionId: string, userIds: string[]): Promise<void> {
    const response = await fetch(`/api/collaboration/sessions/${sessionId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds })
    })

    if (!response.ok) {
      throw new Error('Failed to invite users to session')
    }
  }

  // Cleanup
  destroy(): void {
    this.disconnect()
    this.eventHandlers.clear()
  }
}

// Singleton instance
export const collaborationService = new CollaborationService()

// Initialize settings on load
collaborationService.loadSettings()