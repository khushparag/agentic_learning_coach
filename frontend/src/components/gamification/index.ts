/**
 * Gamification Components - Export all gamification-related components
 */

export { default as XPProgressBar } from './XPProgressBar'
export { default as AchievementGallery } from './AchievementGallery'
export { BadgeCollection } from './BadgeCollection'
export { default as StreakTracker } from './StreakTracker'
export { default as GamificationDashboard } from './GamificationDashboard'

// Re-export types for convenience
export type {
  Achievement,
  UserGamificationProfile,
  AwardXPRequest,
  AwardXPResponse,
  LeaderboardEntry,
  BadgeShowcase,
  StreakInfo,
  XPEvent,
} from '../../types/apiTypes'
