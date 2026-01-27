/**
 * Collaboration Types
 * Type definitions for real-time collaboration features
 */

export interface CollaborationUser {
  id: string
  username: string
  avatar?: string
  color: string
  isOnline: boolean
  role: 'owner' | 'moderator' | 'member'
  joinedAt: Date
  lastActivity: Date
}

export interface StudyGroup {
  id: string
  name: string
  description?: string
  isPublic: boolean
  maxMembers: number
  currentMembers: number
  ownerId: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  language?: string
  members: CollaborationUser[]
}

export interface ChatMessage {
  id: string
  userId: string
  username: string
  avatar?: string
  content: string
  type: 'text' | 'code' | 'system' | 'celebration' | 'code_change'
  timestamp: Date
  edited?: boolean
  editedAt?: Date
  replyTo?: string
  reactions?: Array<{
    emoji: string
    users: string[]
    count: number
  }>
  metadata?: {
    language?: string
    codeSnippet?: string
    achievement?: {
      id: string
      name: string
      badge: string
    }
  }
}

export interface CursorPosition {
  userId: string
  username: string
  color: string
  position: {
    lineNumber: number
    column: number
  }
  selection?: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }
  timestamp: Date
}

export interface CodeComment {
  id: string
  userId: string
  username: string
  avatar?: string
  content: string
  position: {
    lineNumber: number
    column?: number
  }
  resolved: boolean
  createdAt: Date
  updatedAt: Date
  replies: Array<{
    id: string
    userId: string
    username: string
    content: string
    createdAt: Date
  }>
  type: 'suggestion' | 'question' | 'issue' | 'praise'
}

export interface CodeReview {
  id: string
  submissionId: string
  reviewerId: string
  reviewerName: string
  status: 'pending' | 'in_progress' | 'completed'
  overallRating: number // 1-5 stars
  comments: CodeComment[]
  summary?: string
  suggestions: string[]
  createdAt: Date
  completedAt?: Date
}

export interface ProgressShare {
  id: string
  userId: string
  username: string
  avatar?: string
  type: 'task_completed' | 'milestone_reached' | 'streak_achieved' | 'level_up'
  data: {
    taskName?: string
    milestoneName?: string
    streakDays?: number
    newLevel?: number
    xpGained?: number
    badge?: {
      id: string
      name: string
      image: string
    }
  }
  message?: string
  timestamp: Date
  reactions: Array<{
    emoji: string
    userId: string
    username: string
  }>
  celebrationCount: number
}

export interface CollaborationSession {
  id: string
  studyGroupId: string
  type: 'code_review' | 'pair_programming' | 'study_session' | 'challenge'
  title: string
  description?: string
  hostId: string
  participants: CollaborationUser[]
  maxParticipants: number
  status: 'waiting' | 'active' | 'paused' | 'completed'
  startedAt?: Date
  endedAt?: Date
  scheduledFor?: Date
  duration?: number // minutes
  settings: {
    allowChat: boolean
    allowVoice: boolean
    allowScreenShare: boolean
    recordSession: boolean
    requireApproval: boolean
  }
  sharedCode?: {
    language: string
    content: string
    lastModifiedBy: string
    lastModifiedAt: Date
  }
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'chat_message' | 'cursor_update' | 'code_change' | 'comment_added' | 'progress_shared'
  data: any
  timestamp: Date
  userId?: string
}

// WebSocket message types for collaboration
export interface CollaborationWebSocketMessage {
  type: 'collaboration_event'
  sessionId: string
  event: CollaborationEvent
}

export interface CursorUpdateMessage {
  type: 'cursor_update'
  sessionId: string
  cursor: CursorPosition
}

export interface ChatMessageEvent {
  type: 'chat_message'
  sessionId: string
  message: ChatMessage
}

export interface CodeChangeEvent {
  type: 'code_change'
  sessionId: string
  change: {
    userId: string
    content: string
    language: string
    timestamp: Date
    operation: 'insert' | 'delete' | 'replace'
    range?: {
      startLineNumber: number
      startColumn: number
      endLineNumber: number
      endColumn: number
    }
  }
}

export interface CommentEvent {
  type: 'comment_added' | 'comment_updated' | 'comment_resolved'
  sessionId: string
  comment: CodeComment
}

export interface ProgressShareEvent {
  type: 'progress_shared'
  sessionId: string
  share: ProgressShare
}

// Collaboration settings
export interface CollaborationSettings {
  showCursors: boolean
  showUsernames: boolean
  enableChat: boolean
  enableVoice: boolean
  enableProgressSharing: boolean
  autoJoinSessions: boolean
  notificationPreferences: {
    userJoined: boolean
    userLeft: boolean
    newMessage: boolean
    codeComments: boolean
    progressShares: boolean
  }
  privacy: {
    shareProgress: boolean
    showOnlineStatus: boolean
    allowDirectMessages: boolean
  }
}

export const DEFAULT_COLLABORATION_SETTINGS: CollaborationSettings = {
  showCursors: true,
  showUsernames: true,
  enableChat: true,
  enableVoice: false,
  enableProgressSharing: true,
  autoJoinSessions: false,
  notificationPreferences: {
    userJoined: true,
    userLeft: false,
    newMessage: true,
    codeComments: true,
    progressShares: true
  },
  privacy: {
    shareProgress: true,
    showOnlineStatus: true,
    allowDirectMessages: true
  }
}

// Collaboration permissions
export interface CollaborationPermissions {
  canEdit: boolean
  canComment: boolean
  canInvite: boolean
  canKick: boolean
  canModerate: boolean
  canChangeSettings: boolean
}

export const getPermissionsForRole = (role: CollaborationUser['role']): CollaborationPermissions => {
  switch (role) {
    case 'owner':
      return {
        canEdit: true,
        canComment: true,
        canInvite: true,
        canKick: true,
        canModerate: true,
        canChangeSettings: true
      }
    case 'moderator':
      return {
        canEdit: true,
        canComment: true,
        canInvite: true,
        canKick: true,
        canModerate: true,
        canChangeSettings: false
      }
    case 'member':
      return {
        canEdit: true,
        canComment: true,
        canInvite: false,
        canKick: false,
        canModerate: false,
        canChangeSettings: false
      }
    default:
      return {
        canEdit: false,
        canComment: false,
        canInvite: false,
        canKick: false,
        canModerate: false,
        canChangeSettings: false
      }
  }
}
