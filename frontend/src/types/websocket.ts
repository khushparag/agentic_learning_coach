/**
 * WebSocket Types
 * Type definitions for real-time WebSocket communication
 */

export interface WebSocketConnectionState {
  isConnected: boolean
  isConnecting: boolean
  reconnectAttempts: number
  lastError?: string
  lastConnected?: Date
  lastDisconnected?: Date
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  userId?: string
  sessionId?: string
}

// Progress Update Types
export interface ProgressUpdateMessage extends WebSocketMessage {
  type: 'progress_update' | 'task_completed' | 'module_completed' | 'streak_updated'
  data: {
    userId: string
    taskId?: string
    moduleId?: string
    taskName?: string
    moduleName?: string
    progress?: number
    xp?: number
    streak?: number
    completionTime?: string
    difficulty?: string
  }
}

// Achievement Types
export interface AchievementMessage extends WebSocketMessage {
  type: 'achievement_unlocked' | 'badge_earned' | 'milestone_reached'
  data: {
    userId: string
    achievement: {
      id: string
      name: string
      description: string
      badge: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
      xp_reward: number
      category: string
    }
    timestamp: string
  }
}

// Gamification Types
export interface GamificationMessage extends WebSocketMessage {
  type: 'xp_awarded' | 'level_up' | 'streak_milestone'
  data: {
    userId: string
    xp_amount?: number
    total_xp?: number
    level?: number
    previous_level?: number
    streak?: {
      current_streak: number
      milestone?: {
        name: string
        badge: string
        days: number
        reward?: number
      }
    }
  }
}

// Social/Collaboration Types
export interface CollaborationMessage extends WebSocketMessage {
  type: 'user_joined' | 'user_left' | 'chat_message' | 'cursor_update' | 'participants_list'
  data: {
    userId?: string
    username?: string
    avatar?: string
    message?: string
    position?: { x: number; y: number }
    participants?: Array<{
      id: string
      username: string
      avatar?: string
      isOnline: boolean
      role: 'owner' | 'moderator' | 'member'
    }>
  }
}

// Leaderboard Types
export interface LeaderboardMessage extends WebSocketMessage {
  type: 'leaderboard_update' | 'rank_change' | 'competition_update'
  data: {
    leaderboardId: string
    entries: Array<{
      userId: string
      username: string
      avatar?: string
      score: number
      xp: number
      rank: number
      previousRank?: number
      streak: number
      isOnline: boolean
    }>
    totalParticipants: number
    lastUpdated: string
    timeRemaining?: number
  }
}

// Challenge Types
export interface ChallengeMessage extends WebSocketMessage {
  type: 'challenge_received' | 'challenge_accepted' | 'challenge_completed' | 'challenge_expired'
  data: {
    challengeId: string
    fromUserId?: string
    toUserId?: string
    fromUsername?: string
    toUsername?: string
    challengeType: 'coding' | 'quiz' | 'speed' | 'collaboration'
    title: string
    description?: string
    difficulty: 'easy' | 'medium' | 'hard'
    timeLimit?: number
    reward?: {
      xp: number
      badge?: string
    }
    status: 'pending' | 'active' | 'completed' | 'expired'
    expiresAt?: string
  }
}

// System Notification Types
export interface SystemNotificationMessage extends WebSocketMessage {
  type: 'system_notification' | 'maintenance_alert' | 'feature_announcement'
  data: {
    title: string
    message: string
    severity: 'info' | 'warning' | 'error' | 'success'
    action?: {
      label: string
      url: string
    }
    dismissible: boolean
    expiresAt?: string
  }
}

// Union type for all WebSocket messages
export type AnyWebSocketMessage = 
  | ProgressUpdateMessage
  | AchievementMessage
  | GamificationMessage
  | CollaborationMessage
  | LeaderboardMessage
  | ChallengeMessage
  | SystemNotificationMessage

// WebSocket Event Handlers
export interface WebSocketEventHandlers {
  onConnect?: () => void
  onDisconnect?: (event?: CloseEvent) => void
  onError?: (error: Event | Error) => void
  onMessage?: (message: AnyWebSocketMessage) => void
  onProgressUpdate?: (data: ProgressUpdateMessage['data']) => void
  onAchievementUnlocked?: (data: AchievementMessage['data']) => void
  onGamificationUpdate?: (data: GamificationMessage['data']) => void
  onCollaborationUpdate?: (data: CollaborationMessage['data']) => void
  onLeaderboardUpdate?: (data: LeaderboardMessage['data']) => void
  onChallengeUpdate?: (data: ChallengeMessage['data']) => void
  onSystemNotification?: (data: SystemNotificationMessage['data']) => void
}

// WebSocket Configuration
export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
  timeout?: number
  enableLogging?: boolean
}

// Real-time Feature Flags
export interface RealTimeFeatures {
  progressUpdates: boolean
  achievements: boolean
  gamification: boolean
  collaboration: boolean
  leaderboards: boolean
  challenges: boolean
  notifications: boolean
}

export const DEFAULT_REALTIME_FEATURES: RealTimeFeatures = {
  progressUpdates: true,
  achievements: true,
  gamification: true,
  collaboration: true,
  leaderboards: true,
  challenges: true,
  notifications: true
}