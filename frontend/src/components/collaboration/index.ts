/**
 * Collaboration Components Index
 * Exports all collaboration-related components and utilities
 */

export { default as CollaborationDashboard } from './CollaborationDashboard'
export { default as EnhancedCollaborationDashboard } from './EnhancedCollaborationDashboard'
export { default as CollaborativeCodeEditor } from './CollaborativeCodeEditor'
export { default as CollaborationNotifications } from './CollaborationNotifications'
export { default as RealTimeChat } from './RealTimeChat'
export { default as CodeReviewInterface } from './CodeReviewInterface'
export { default as ProgressSharingFeed } from './ProgressSharingFeed'
export { default as LiveCursorSharing } from './LiveCursorSharing'
export { default as StudyGroupCollaboration } from './StudyGroupCollaboration'

// Re-export collaboration service and hook
export { collaborationService } from '../../services/collaborationService'
export { default as useCollaboration } from '../../hooks/useCollaboration'

// Re-export types
export type {
  StudyGroup,
  CollaborationSession,
  CollaborationUser,
  ChatMessage,
  CursorPosition,
  CodeComment,
  CodeReview,
  ProgressShare,
  CollaborationSettings
} from '../../types/collaboration'