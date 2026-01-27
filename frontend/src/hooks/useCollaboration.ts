/**
 * Collaboration Hook
 * Manages real-time collaboration features and state
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { collaborationService } from '../services/collaborationService'
import type {
  StudyGroup,
  CollaborationSession,
  CollaborationUser,
  ChatMessage,
  CursorPosition,
  CodeComment,
  ProgressShare,
  CollaborationSettings
} from '../types/collaboration'

interface UseCollaborationOptions {
  autoConnect?: boolean
  enableCursors?: boolean
  enableChat?: boolean
  enableProgressSharing?: boolean
}

interface CollaborationState {
  isConnected: boolean
  isConnecting: boolean
  currentSession: CollaborationSession | null
  participants: CollaborationUser[]
  messages: ChatMessage[]
  cursors: Map<string, CursorPosition>
  comments: CodeComment[]
  progressShares: ProgressShare[]
  settings: CollaborationSettings
  error: string | null
}

export const useCollaboration = (
  currentUser: CollaborationUser,
  options: UseCollaborationOptions = {}
) => {
  const {
    autoConnect = true,
    enableCursors = true,
    enableChat = true,
    enableProgressSharing = true
  } = options

  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    isConnecting: false,
    currentSession: null,
    participants: [],
    messages: [],
    cursors: new Map(),
    comments: [],
    progressShares: [],
    settings: collaborationService.getSettings(),
    error: null
  })

  const eventHandlersRef = useRef<Map<string, () => void>>(new Map())

  // Update state helper
  const updateState = useCallback((updates: Partial<CollaborationState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Connection management
  const connect = useCallback(async () => {
    if (state.isConnected || state.isConnecting) return

    updateState({ isConnecting: true, error: null })

    try {
      await collaborationService.connect()
      updateState({ 
        isConnected: true, 
        isConnecting: false,
        error: null 
      })
    } catch (error) {
      updateState({ 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      })
    }
  }, [state.isConnected, state.isConnecting, updateState])

  const disconnect = useCallback(() => {
    collaborationService.disconnect()
    updateState({
      isConnected: false,
      isConnecting: false,
      currentSession: null,
      participants: [],
      messages: [],
      cursors: new Map(),
      comments: [],
      error: null
    })
  }, [updateState])

  // Study group management
  const createStudyGroup = useCallback(async (data: Partial<StudyGroup>): Promise<StudyGroup> => {
    try {
      const group = await collaborationService.createStudyGroup(data)
      return group
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to create study group' })
      throw error
    }
  }, [updateState])

  const joinStudyGroup = useCallback(async (groupId: string): Promise<void> => {
    try {
      await collaborationService.joinStudyGroup(groupId)
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to join study group' })
      throw error
    }
  }, [updateState])

  const leaveStudyGroup = useCallback(async (groupId: string): Promise<void> => {
    try {
      await collaborationService.leaveStudyGroup(groupId)
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to leave study group' })
      throw error
    }
  }, [updateState])

  // Session management
  const createSession = useCallback(async (data: Partial<CollaborationSession>): Promise<CollaborationSession> => {
    try {
      const session = await collaborationService.createSession(data)
      updateState({ 
        currentSession: session,
        participants: session.participants,
        messages: [],
        cursors: new Map(),
        comments: []
      })
      return session
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to create session' })
      throw error
    }
  }, [updateState])

  const joinSession = useCallback(async (sessionId: string): Promise<CollaborationSession> => {
    try {
      const session = await collaborationService.joinSession(sessionId)
      updateState({ 
        currentSession: session,
        participants: session.participants,
        messages: [],
        cursors: new Map(),
        comments: []
      })
      return session
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to join session' })
      throw error
    }
  }, [updateState])

  const leaveSession = useCallback(async (): Promise<void> => {
    try {
      await collaborationService.leaveSession()
      updateState({
        currentSession: null,
        participants: [],
        messages: [],
        cursors: new Map(),
        comments: []
      })
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to leave session' })
      throw error
    }
  }, [updateState])

  // Chat functionality
  const sendMessage = useCallback((content: string, type: ChatMessage['type'] = 'text', metadata?: any) => {
    if (!enableChat) return
    
    try {
      collaborationService.sendChatMessage(content, type, metadata)
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to send message' })
    }
  }, [enableChat, updateState])

  const sendCodeSnippet = useCallback((code: string, language: string) => {
    if (!enableChat) return
    
    try {
      collaborationService.sendCodeSnippet(code, language)
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to send code snippet' })
    }
  }, [enableChat, updateState])

  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    if (!enableChat) return
    
    try {
      collaborationService.reactToMessage(messageId, emoji)
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to react to message' })
    }
  }, [enableChat, updateState])

  // Cursor sharing
  const updateCursor = useCallback((position: CursorPosition['position'], selection?: CursorPosition['selection']) => {
    if (!enableCursors) return
    
    try {
      collaborationService.updateCursor(position, selection)
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to update cursor' })
    }
  }, [enableCursors, updateState])

  // Code comments
  const addComment = useCallback(async (
    content: string,
    lineNumber: number,
    type: CodeComment['type'] = 'suggestion'
  ): Promise<CodeComment | null> => {
    try {
      const comment = await collaborationService.addCodeComment({
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        content,
        position: { lineNumber },
        resolved: false,
        type
      })
      
      setState(prev => ({
        ...prev,
        comments: [...prev.comments, comment]
      }))
      
      return comment
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to add comment' })
      return null
    }
  }, [currentUser, updateState])

  const resolveComment = useCallback(async (commentId: string): Promise<void> => {
    try {
      await collaborationService.resolveComment(commentId)
      setState(prev => ({
        ...prev,
        comments: prev.comments.map(c => 
          c.id === commentId ? { ...c, resolved: true } : c
        )
      }))
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to resolve comment' })
    }
  }, [updateState])

  // Progress sharing
  const shareProgress = useCallback((
    type: ProgressShare['type'],
    data: ProgressShare['data'],
    message?: string
  ) => {
    if (!enableProgressSharing) return
    
    try {
      collaborationService.shareProgress({
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        type,
        data,
        message
      })
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to share progress' })
    }
  }, [enableProgressSharing, currentUser, updateState])

  const celebrateProgress = useCallback((shareId: string, emoji: string = '🎉') => {
    if (!enableProgressSharing) return
    
    try {
      collaborationService.celebrateProgress(shareId, emoji)
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to celebrate progress' })
    }
  }, [enableProgressSharing, updateState])

  // Settings management
  const updateSettings = useCallback((newSettings: Partial<CollaborationSettings>) => {
    try {
      collaborationService.updateSettings(newSettings)
      updateState({ settings: collaborationService.getSettings() })
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Failed to update settings' })
    }
  }, [updateState])

  // Setup event listeners
  useEffect(() => {
    const setupEventHandlers = () => {
      // Clear existing handlers
      eventHandlersRef.current.forEach(unsubscribe => unsubscribe())
      eventHandlersRef.current.clear()

      // Connection status
      const unsubscribeConnection = collaborationService.on('connection_status', (data: { connected: boolean }) => {
        updateState({ isConnected: data.connected })
      })
      eventHandlersRef.current.set('connection_status', unsubscribeConnection)

      // User events
      const unsubscribeUserJoined = collaborationService.on('user_joined', (user: CollaborationUser) => {
        setState(prev => ({
          ...prev,
          participants: [...prev.participants.filter(p => p.id !== user.id), user]
        }))
      })
      eventHandlersRef.current.set('user_joined', unsubscribeUserJoined)

      const unsubscribeUserLeft = collaborationService.on('user_left', (data: { userId: string }) => {
        setState(prev => ({
          ...prev,
          participants: prev.participants.filter(p => p.id !== data.userId),
          cursors: new Map([...prev.cursors].filter(([userId]) => userId !== data.userId))
        }))
      })
      eventHandlersRef.current.set('user_left', unsubscribeUserLeft)

      // Chat events
      if (enableChat) {
        const unsubscribeChatMessage = collaborationService.on('chat_message', (message: ChatMessage) => {
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, message].slice(-100) // Keep last 100 messages
          }))
        })
        eventHandlersRef.current.set('chat_message', unsubscribeChatMessage)
      }

      // Cursor events
      if (enableCursors) {
        const unsubscribeCursorUpdate = collaborationService.on('cursor_update', (cursor: CursorPosition) => {
          if (cursor.userId !== currentUser.id) {
            setState(prev => ({
              ...prev,
              cursors: new Map(prev.cursors).set(cursor.userId, cursor)
            }))
          }
        })
        eventHandlersRef.current.set('cursor_update', unsubscribeCursorUpdate)
      }

      // Comment events
      const unsubscribeCommentAdded = collaborationService.on('comment_added', (comment: CodeComment) => {
        setState(prev => ({
          ...prev,
          comments: [...prev.comments, comment]
        }))
      })
      eventHandlersRef.current.set('comment_added', unsubscribeCommentAdded)

      const unsubscribeCommentResolved = collaborationService.on('comment_resolved', (data: { commentId: string }) => {
        setState(prev => ({
          ...prev,
          comments: prev.comments.map(c => 
            c.id === data.commentId ? { ...c, resolved: true } : c
          )
        }))
      })
      eventHandlersRef.current.set('comment_resolved', unsubscribeCommentResolved)

      // Progress events
      if (enableProgressSharing) {
        const unsubscribeProgressShared = collaborationService.on('progress_shared', (share: ProgressShare) => {
          setState(prev => ({
            ...prev,
            progressShares: [share, ...prev.progressShares].slice(0, 50) // Keep last 50 shares
          }))
        })
        eventHandlersRef.current.set('progress_shared', unsubscribeProgressShared)
      }

      // Session events
      const unsubscribeSessionUpdated = collaborationService.on('session_updated', (session: CollaborationSession) => {
        updateState({ 
          currentSession: session,
          participants: session.participants
        })
      })
      eventHandlersRef.current.set('session_updated', unsubscribeSessionUpdated)
    }

    setupEventHandlers()

    return () => {
      eventHandlersRef.current.forEach(unsubscribe => unsubscribe())
      eventHandlersRef.current.clear()
    }
  }, [currentUser.id, enableChat, enableCursors, enableProgressSharing, updateState])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !state.isConnected && !state.isConnecting) {
      connect()
    }
  }, [autoConnect, state.isConnected, state.isConnecting, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isConnected) {
        collaborationService.disconnect()
      }
    }
  }, []) // Only run on unmount

  return {
    // State
    ...state,
    
    // Connection
    connect,
    disconnect,
    
    // Study Groups
    createStudyGroup,
    joinStudyGroup,
    leaveStudyGroup,
    
    // Sessions
    createSession,
    joinSession,
    leaveSession,
    
    // Chat
    sendMessage,
    sendCodeSnippet,
    reactToMessage,
    
    // Cursors
    updateCursor,
    
    // Comments
    addComment,
    resolveComment,
    
    // Progress
    shareProgress,
    celebrateProgress,
    
    // Settings
    updateSettings,
    
    // Utilities
    clearError: () => updateState({ error: null }),
    refreshSession: () => {
      if (state.currentSession) {
        joinSession(state.currentSession.id)
      }
    }
  }
}

export default useCollaboration
