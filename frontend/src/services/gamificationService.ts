/**
 * Gamification Service - API client for badges, achievements, XP system, and streaks
 */

import api from './api'
import type {
  Achievement,
  UserGamificationProfile,
  AwardXPRequest,
  AwardXPResponse,
  LeaderboardEntry,
  BadgeShowcase,
} from '../types/api'

export class GamificationService {
  private static readonly BASE_PATH = '/gamification'

  /**
   * Get complete gamification profile for a user
   */
  static async getGamificationProfile(userId: string): Promise<UserGamificationProfile> {
    const response = await api.get<UserGamificationProfile>(`${this.BASE_PATH}/profile/${userId}`)
    return response.data
  }

  /**
   * Get all achievements for a user with unlock status
   */
  static async getAchievements(
    userId: string,
    options: {
      category?: 'streak' | 'skill' | 'social' | 'milestone' | 'special'
      unlockedOnly?: boolean
    } = {}
  ): Promise<Achievement[]> {
    const params: Record<string, unknown> = {}
    
    if (options.category) params.category = options.category
    if (options.unlockedOnly) params.unlocked_only = options.unlockedOnly

    const response = await api.get<Achievement[]>(`${this.BASE_PATH}/achievements/${userId}`, { params })
    return response.data
  }

  /**
   * Award XP to a user for completing an action
   */
  static async awardXP(request: AwardXPRequest): Promise<AwardXPResponse> {
    const response = await api.post<AwardXPResponse>(`${this.BASE_PATH}/xp/award`, request)
    return response.data
  }

  /**
   * Update user's learning streak after activity
   */
  static async updateStreak(userId: string): Promise<{
    streak: number
    longest_streak: number
    status: string
    new_achievements: Array<{
      name: string
      badge: string
      xp: number
    }>
  }> {
    const response = await api.post<{
      streak: number
      longest_streak: number
      status: string
      new_achievements: Array<{
        name: string
        badge: string
        xp: number
      }>
    }>(`${this.BASE_PATH}/streak/update/${userId}`)
    return response.data
  }

  /**
   * Get the XP leaderboard
   */
  static async getLeaderboard(options: {
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time'
    limit?: number
  } = {}): Promise<LeaderboardEntry[]> {
    const params: Record<string, unknown> = {}
    
    if (options.timeframe) params.timeframe = options.timeframe
    if (options.limit) params.limit = options.limit

    const response = await api.get<LeaderboardEntry[]>(`${this.BASE_PATH}/leaderboard`, { params })
    return response.data
  }

  /**
   * Get a user's badge showcase for display
   */
  static async getBadgeShowcase(userId: string): Promise<BadgeShowcase> {
    const response = await api.get<BadgeShowcase>(`${this.BASE_PATH}/badges/showcase/${userId}`)
    return response.data
  }

  /**
   * Calculate level from total XP
   */
  static calculateLevel(totalXP: number): {
    level: number
    xpToNext: number
    progress: number
  } {
    // XP requirements per level (exponential growth)
    const levelRequirements = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000]
    
    let level = 1
    for (let i = 0; i < levelRequirements.length; i++) {
      if (totalXP >= levelRequirements[i]) {
        level = i + 1
      } else {
        break
      }
    }

    if (level >= levelRequirements.length) {
      return { level, xpToNext: 0, progress: 1.0 }
    }

    const currentLevelXP = levelRequirements[level - 1]
    const nextLevelXP = levelRequirements[level] || currentLevelXP
    const xpInLevel = totalXP - currentLevelXP
    const xpNeeded = nextLevelXP - currentLevelXP
    const progress = xpNeeded > 0 ? xpInLevel / xpNeeded : 1.0

    return {
      level,
      xpToNext: nextLevelXP - totalXP,
      progress: Math.min(1.0, Math.max(0.0, progress)),
    }
  }

  /**
   * Get XP values for different activities
   */
  static getXPValues(): Record<string, number> {
    return {
      task_completed: 50,
      exercise_passed: 100,
      perfect_score: 150,
      first_attempt_pass: 75,
      streak_day: 25,
      challenge_won: 200,
      solution_shared: 30,
      solution_liked: 10,
      comment_helpful: 15,
      module_completed: 300,
      curriculum_completed: 1000,
    }
  }

  /**
   * Get streak milestone rewards
   */
  static getStreakMilestones(): Record<number, {
    name: string
    badge: string
    xp: number
    rarity: string
  }> {
    return {
      3: { name: 'First Steps', badge: '🌱', xp: 50, rarity: 'common' },
      7: { name: 'Week Warrior', badge: '🔥', xp: 150, rarity: 'common' },
      14: { name: 'Fortnight Fighter', badge: '⚡', xp: 300, rarity: 'rare' },
      30: { name: 'Monthly Master', badge: '🏆', xp: 750, rarity: 'rare' },
      60: { name: 'Dedication Champion', badge: '💎', xp: 1500, rarity: 'epic' },
      100: { name: 'Century Club', badge: '👑', xp: 3000, rarity: 'epic' },
      365: { name: 'Year of Code', badge: '🌟', xp: 10000, rarity: 'legendary' },
    }
  }

  /**
   * Get achievement rarity color
   */
  static getRarityColor(rarity: string): string {
    const colors = {
      common: 'gray',
      rare: 'blue',
      epic: 'purple',
      legendary: 'gold',
    }
    return colors[rarity as keyof typeof colors] || 'gray'
  }

  /**
   * Get level badge and title
   */
  static getLevelInfo(level: number): {
    title: string
    badge: string
    color: string
  } {
    if (level >= 50) {
      return { title: 'Grandmaster', badge: '🌟', color: 'gold' }
    } else if (level >= 25) {
      return { title: 'Master', badge: '👑', color: 'purple' }
    } else if (level >= 15) {
      return { title: 'Expert', badge: '💎', color: 'blue' }
    } else if (level >= 10) {
      return { title: 'Advanced', badge: '🏆', color: 'green' }
    } else if (level >= 5) {
      return { title: 'Intermediate', badge: '⚡', color: 'yellow' }
    } else {
      return { title: 'Beginner', badge: '🌱', color: 'gray' }
    }
  }

  /**
   * Calculate streak multiplier
   */
  static calculateStreakMultiplier(streakDays: number): number {
    // 10% bonus per week of streak, capped at 100%
    return Math.min(2.0, 1.0 + Math.floor(streakDays / 7) * 0.1)
  }

  /**
   * Get weekend bonus multiplier
   */
  static getWeekendMultiplier(): number {
    const today = new Date()
    const isWeekend = today.getDay() === 0 || today.getDay() === 6 // Sunday or Saturday
    return isWeekend ? 1.5 : 1.0
  }

  /**
   * Format XP amount for display
   */
  static formatXP(xp: number): string {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M XP`
    } else if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K XP`
    } else {
      return `${xp} XP`
    }
  }

  /**
   * Get motivational message based on progress
   */
  static getMotivationalMessage(profile: UserGamificationProfile): string {
    const { level, streak, achievements_unlocked, total_achievements } = profile
    const achievementRate = total_achievements > 0 ? achievements_unlocked / total_achievements : 0
    const currentStreak = streak?.current_streak || 0

    if (currentStreak >= 30) {
      return `🔥 Incredible ${currentStreak}-day streak! You're unstoppable!`
    } else if (currentStreak >= 7) {
      return `⚡ Amazing ${currentStreak}-day streak! Keep the momentum going!`
    } else if (level >= 10) {
      return `🏆 Level ${level}! You're becoming a coding master!`
    } else if (achievementRate >= 0.5) {
      return `🌟 Great progress! You've unlocked ${achievements_unlocked} achievements!`
    } else if (currentStreak >= 3) {
      return `🌱 Nice ${currentStreak}-day streak! Consistency is key!`
    } else {
      return `💪 Ready to learn? Every expert was once a beginner!`
    }
  }

  /**
   * Get next achievement suggestions
   */
  static getNextAchievementSuggestions(
    achievements: Achievement[],
    profile: UserGamificationProfile
  ): Achievement[] {
    // Find achievements that are close to being unlocked (>50% progress)
    const nearCompletion = achievements.filter(
      achievement => !achievement.unlocked && achievement.progress >= 0.5
    )

    // Sort by progress (closest to completion first)
    nearCompletion.sort((a, b) => b.progress - a.progress)

    return nearCompletion.slice(0, 3) // Return top 3 suggestions
  }

  /**
   * Calculate daily XP goal based on level and streak
   */
  static calculateDailyXPGoal(profile: UserGamificationProfile): number {
    const baseGoal = 100 // Base daily XP goal
    const levelMultiplier = 1 + (profile.level - 1) * 0.1 // 10% increase per level
    const streakBonus = Math.min(50, (profile.streak?.current_streak || 0) * 2) // Up to 50 bonus XP

    return Math.round(baseGoal * levelMultiplier + streakBonus)
  }

  /**
   * Get achievement category info
   */
  static getCategoryInfo(category: string): {
    name: string
    description: string
    icon: string
    color: string
  } {
    const categories = {
      streak: {
        name: 'Streak',
        description: 'Consistency and daily learning habits',
        icon: '🔥',
        color: 'orange',
      },
      skill: {
        name: 'Skill',
        description: 'Technical proficiency and problem-solving',
        icon: '🧠',
        color: 'blue',
      },
      social: {
        name: 'Social',
        description: 'Community engagement and collaboration',
        icon: '👥',
        color: 'green',
      },
      milestone: {
        name: 'Milestone',
        description: 'Major learning accomplishments',
        icon: '🏆',
        color: 'gold',
      },
      special: {
        name: 'Special',
        description: 'Unique and rare achievements',
        icon: '⭐',
        color: 'purple',
      },
    }

    return categories[category as keyof typeof categories] || {
      name: 'Unknown',
      description: 'Unknown category',
      icon: '❓',
      color: 'gray',
    }
  }

  /**
   * Validate XP award request
   */
  static validateXPAward(request: AwardXPRequest): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!request.user_id || request.user_id.trim().length === 0) {
      errors.push('User ID is required')
    }

    if (!request.xp_amount || request.xp_amount <= 0) {
      errors.push('XP amount must be positive')
    }

    if (request.xp_amount > 10000) {
      errors.push('XP amount too large (maximum 10,000)')
    }

    if (!request.event_type || request.event_type.trim().length === 0) {
      errors.push('Event type is required')
    }

    if (!request.source || request.source.trim().length === 0) {
      errors.push('Source is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}