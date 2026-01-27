/**
 * Social Service - API client for social learning and peer interactions
 */

import api from './api'
import type {
  CreateChallengeRequest,
  PeerChallenge,
  ShareSolutionRequest,
  SharedSolution,
  Comment,
  CreateStudyGroupRequest,
  StudyGroup,
  StudyGroupProgress,
  ActivityFeedItem,
} from '../types/apiTypes'

export class SocialService {
  private static readonly BASE_PATH = '/social'

  // ==========================================================================
  // Peer Challenges
  // ==========================================================================

  /**
   * Create a peer challenge
   */
  static async createChallenge(request: CreateChallengeRequest): Promise<PeerChallenge> {
    const response = await api.post<PeerChallenge>(`${this.BASE_PATH}/challenges`, request)
    return response.data
  }

  /**
   * Get challenges for a user
   */
  static async getUserChallenges(
    userId: string,
    options: {
      status?: 'pending' | 'active' | 'completed' | 'expired' | 'declined'
      asChallenger?: boolean
      asChallenged?: boolean
    } = {}
  ): Promise<PeerChallenge[]> {
    const params: Record<string, unknown> = {}
    
    if (options.status) params.status = options.status
    if (options.asChallenger !== undefined) params.as_challenger = options.asChallenger
    if (options.asChallenged !== undefined) params.as_challenged = options.asChallenged

    const response = await api.get<PeerChallenge[]>(
      `${this.BASE_PATH}/challenges/${userId}`,
      { params }
    )
    return response.data
  }

  /**
   * Accept a peer challenge
   */
  static async acceptChallenge(challengeId: string, userId: string): Promise<{
    success: boolean
    challenge_id: string
    status: string
    message: string
  }> {
    const response = await api.post<{
      success: boolean
      challenge_id: string
      status: string
      message: string
    }>(
      `${this.BASE_PATH}/challenges/${challengeId}/accept`,
      { user_id: userId }
    )
    return response.data
  }

  /**
   * Submit a challenge result
   */
  static async submitChallengeResult(
    challengeId: string,
    userId: string,
    score: number
  ): Promise<{
    success: boolean
    your_score: number
    completed?: boolean
    winner_id?: string
    you_won?: boolean
    xp_earned?: number
  }> {
    const response = await api.post<{
      success: boolean
      your_score: number
      completed?: boolean
      winner_id?: string
      you_won?: boolean
      xp_earned?: number
    }>(
      `${this.BASE_PATH}/challenges/${challengeId}/submit`,
      { user_id: userId, score }
    )
    return response.data
  }

  /**
   * Get challenge wins leaderboard
   */
  static async getChallengeLeaderboard(limit: number = 10): Promise<Array<{
    rank: number
    user_id: string
    wins: number
  }>> {
    const params = { limit }
    const response = await api.get<Array<{
      rank: number
      user_id: string
      wins: number
    }>>(`${this.BASE_PATH}/challenges/leaderboard`, { params })
    return response.data
  }

  // ==========================================================================
  // Solution Sharing
  // ==========================================================================

  /**
   * Share a solution with the community
   */
  static async shareSolution(request: ShareSolutionRequest): Promise<SharedSolution> {
    const response = await api.post<SharedSolution>(`${this.BASE_PATH}/solutions/share`, request)
    return response.data
  }

  /**
   * Get shared solutions with filtering and sorting
   */
  static async getSharedSolutions(options: {
    exerciseId?: string
    userId?: string
    featuredOnly?: boolean
    sortBy?: 'recent' | 'popular' | 'helpful'
    limit?: number
  } = {}): Promise<SharedSolution[]> {
    const params: Record<string, unknown> = {}
    
    if (options.exerciseId) params.exercise_id = options.exerciseId
    if (options.userId) params.user_id = options.userId
    if (options.featuredOnly) params.featured_only = options.featuredOnly
    if (options.sortBy) params.sort_by = options.sortBy
    if (options.limit) params.limit = options.limit

    const response = await api.get<SharedSolution[]>(`${this.BASE_PATH}/solutions`, { params })
    return response.data
  }

  /**
   * Like a shared solution
   */
  static async likeSolution(solutionId: string, userId: string): Promise<{
    success: boolean
    likes: number
  }> {
    const response = await api.post<{
      success: boolean
      likes: number
    }>(
      `${this.BASE_PATH}/solutions/${solutionId}/like`,
      { user_id: userId }
    )
    return response.data
  }

  /**
   * Add a comment to a shared solution
   */
  static async addComment(
    solutionId: string,
    userId: string,
    content: string
  ): Promise<Comment> {
    const response = await api.post<Comment>(
      `${this.BASE_PATH}/solutions/${solutionId}/comment`,
      { user_id: userId, content }
    )
    return response.data
  }

  /**
   * Get comments for a solution
   */
  static async getComments(solutionId: string): Promise<Comment[]> {
    const response = await api.get<Comment[]>(`${this.BASE_PATH}/solutions/${solutionId}/comments`)
    return response.data
  }

  // ==========================================================================
  // Study Groups
  // ==========================================================================

  /**
   * Create a study group for collaborative learning
   */
  static async createStudyGroup(request: CreateStudyGroupRequest): Promise<StudyGroup> {
    const response = await api.post<StudyGroup>(`${this.BASE_PATH}/groups`, request)
    return response.data
  }

  /**
   * Get available study groups
   */
  static async getStudyGroups(options: {
    topic?: string
    publicOnly?: boolean
  } = {}): Promise<StudyGroup[]> {
    const params: Record<string, unknown> = {}
    
    if (options.topic) params.topic = options.topic
    if (options.publicOnly !== undefined) params.public_only = options.publicOnly

    const response = await api.get<StudyGroup[]>(`${this.BASE_PATH}/groups`, { params })
    return response.data
  }

  /**
   * Join a study group
   */
  static async joinStudyGroup(groupId: string, userId: string): Promise<{
    success: boolean
    group_id: string
    members_count: number
  }> {
    const response = await api.post<{
      success: boolean
      group_id: string
      members_count: number
    }>(
      `${this.BASE_PATH}/groups/${groupId}/join`,
      { user_id: userId }
    )
    return response.data
  }

  /**
   * Get progress for all members in a study group
   */
  static async getGroupProgress(groupId: string): Promise<StudyGroupProgress> {
    const response = await api.get<StudyGroupProgress>(`${this.BASE_PATH}/groups/${groupId}/progress`)
    return response.data
  }

  // ==========================================================================
  // Follow System
  // ==========================================================================

  /**
   * Follow another learner
   */
  static async followUser(userId: string, targetUserId: string): Promise<{
    success: boolean
    following: string
  }> {
    const response = await api.post<{
      success: boolean
      following: string
    }>(
      `${this.BASE_PATH}/follow/${targetUserId}`,
      { user_id: userId }
    )
    return response.data
  }

  /**
   * Get list of users being followed
   */
  static async getFollowing(userId: string): Promise<string[]> {
    const response = await api.get<string[]>(`${this.BASE_PATH}/following/${userId}`)
    return response.data
  }

  /**
   * Get activity feed from followed users
   */
  static async getActivityFeed(userId: string, limit: number = 20): Promise<ActivityFeedItem[]> {
    const params = { limit }
    const response = await api.get<ActivityFeedItem[]>(
      `${this.BASE_PATH}/feed/${userId}`,
      { params }
    )
    return response.data
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get challenge type display information
   */
  static getChallengeTypeInfo(type: string): {
    name: string
    description: string
    icon: string
  } {
    const types = {
      speed_coding: {
        name: 'Speed Coding',
        description: 'Complete the exercise as fast as possible',
        icon: '⚡',
      },
      code_golf: {
        name: 'Code Golf',
        description: 'Write the shortest solution possible',
        icon: '⛳',
      },
      best_practices: {
        name: 'Best Practices',
        description: 'Focus on code quality and best practices',
        icon: '✨',
      },
      streak_race: {
        name: 'Streak Race',
        description: 'Maintain the longest learning streak',
        icon: '🔥',
      },
    }

    return types[type as keyof typeof types] || {
      name: 'Unknown',
      description: 'Unknown challenge type',
      icon: '❓',
    }
  }

  /**
   * Get challenge status color
   */
  static getChallengeStatusColor(status: string): string {
    const colors = {
      pending: 'yellow',
      active: 'blue',
      completed: 'green',
      expired: 'gray',
      declined: 'red',
    }
    return colors[status as keyof typeof colors] || 'gray'
  }

  /**
   * Format challenge duration
   */
  static formatChallengeDuration(createdAt: string, expiresAt: string): {
    timeLeft: string
    isExpired: boolean
    urgency: 'low' | 'medium' | 'high'
  } {
    const now = new Date()
    const expires = new Date(expiresAt)
    const timeLeftMs = expires.getTime() - now.getTime()

    if (timeLeftMs <= 0) {
      return {
        timeLeft: 'Expired',
        isExpired: true,
        urgency: 'high',
      }
    }

    const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    let timeLeft: string
    let urgency: 'low' | 'medium' | 'high'

    if (days > 0) {
      timeLeft = `${days}d ${hours}h`
      urgency = days > 2 ? 'low' : 'medium'
    } else if (hours > 0) {
      timeLeft = `${hours}h`
      urgency = hours > 6 ? 'medium' : 'high'
    } else {
      const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60))
      timeLeft = `${minutes}m`
      urgency = 'high'
    }

    return {
      timeLeft,
      isExpired: false,
      urgency,
    }
  }

  /**
   * Validate solution sharing request
   */
  static validateSolutionShare(request: ShareSolutionRequest): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!request.user_id || request.user_id.trim().length === 0) {
      errors.push('User ID is required')
    }

    if (!request.exercise_id || request.exercise_id.trim().length === 0) {
      errors.push('Exercise ID is required')
    }

    if (!request.code || request.code.trim().length === 0) {
      errors.push('Code cannot be empty')
    }

    if (request.code && request.code.length > 10000) {
      errors.push('Code is too long (maximum 10,000 characters)')
    }

    if (!request.language || request.language.trim().length === 0) {
      errors.push('Programming language is required')
    }

    if (request.description && request.description.length > 500) {
      errors.push('Description must be 500 characters or less')
    }

    if (request.tags && request.tags.length > 10) {
      errors.push('Maximum 10 tags allowed')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get study group member role
   */
  static getMemberRole(group: StudyGroup, userId: string): 'creator' | 'member' | 'none' {
    if (group.creator_id === userId) {
      return 'creator'
    } else if (group.members.includes(userId)) {
      return 'member'
    } else {
      return 'none'
    }
  }

  /**
   * Calculate group activity score
   */
  static calculateGroupActivityScore(progress: StudyGroupProgress): {
    score: number
    rating: string
    insights: string[]
  } {
    const { members, weekly_goal, group_average } = progress
    const insights: string[] = []

    let score = 0

    // Base score from group average
    score += Math.min(100, group_average * 10)

    // Bonus for meeting weekly goal
    if (weekly_goal && group_average >= weekly_goal) {
      score += 20
      insights.push('Group is meeting weekly goals!')
    } else if (weekly_goal) {
      insights.push(`Group needs ${weekly_goal - group_average} more exercises to meet weekly goal`)
    }

    // Bonus for member engagement
    const activeMembers = members.filter(m => m.exercises_this_week > 0).length
    const engagementRate = activeMembers / members.length
    score += engagementRate * 30

    if (engagementRate >= 0.8) {
      insights.push('High member engagement')
    } else if (engagementRate >= 0.5) {
      insights.push('Moderate member engagement')
    } else {
      insights.push('Low member engagement - encourage participation')
    }

    // Determine rating
    let rating: string
    if (score >= 90) {
      rating = 'Excellent'
    } else if (score >= 70) {
      rating = 'Good'
    } else if (score >= 50) {
      rating = 'Fair'
    } else {
      rating = 'Needs Improvement'
    }

    return {
      score: Math.round(score),
      rating,
      insights,
    }
  }
}
