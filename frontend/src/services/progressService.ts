/**
 * Progress Service - API client for progress tracking and analytics
 */

import api from './api'
import type {
  ProgressSummaryResponse,
  DetailedProgressResponse,
  ModuleProgressResponse,
  ProgressStatsResponse,
  ProgressUpdateRequest,
  BaseResponse,
} from '../types/apiTypes'

export class ProgressService {
  private static readonly BASE_PATH = '/api/v1/progress'

  /**
   * Get progress summary for the user
   */
  static async getProgressSummary(): Promise<ProgressSummaryResponse> {
    const response = await api.get<ProgressSummaryResponse>(this.BASE_PATH)
    return response.data
  }

  /**
   * Get detailed progress information
   */
  static async getDetailedProgress(): Promise<DetailedProgressResponse> {
    const response = await api.get<DetailedProgressResponse>(`${this.BASE_PATH}/detailed`)
    return response.data
  }

  /**
   * Get progress statistics
   */
  static async getProgressStats(): Promise<ProgressStatsResponse> {
    const response = await api.get<ProgressStatsResponse>(`${this.BASE_PATH}/stats`)
    return response.data
  }

  /**
   * Update progress for a task
   */
  static async updateProgress(request: ProgressUpdateRequest): Promise<BaseResponse> {
    const response = await api.post<BaseResponse>(`${this.BASE_PATH}/update`, request)
    return response.data
  }

  /**
   * Get progress for a specific module
   */
  static async getModuleProgress(moduleId: string): Promise<ModuleProgressResponse> {
    const response = await api.get<ModuleProgressResponse>(`${this.BASE_PATH}/module/${moduleId}`)
    return response.data
  }

  /**
   * Calculate learning velocity
   */
  static calculateLearningVelocity(progress: ProgressSummaryResponse): {
    tasksPerDay: number
    hoursPerDay: number
    velocityTrend: 'increasing' | 'stable' | 'decreasing'
  } {
    const daysActive = Math.max(1, progress.current_streak_days || 1)
    const tasksPerDay = progress.completed_tasks / daysActive
    const hoursPerDay = progress.total_time_spent_minutes / (daysActive * 60)

    // Simple trend calculation (would be more sophisticated with historical data)
    let velocityTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (progress.current_streak_days > progress.longest_streak_days * 0.8) {
      velocityTrend = 'increasing'
    } else if (progress.current_streak_days < progress.longest_streak_days * 0.5) {
      velocityTrend = 'decreasing'
    }

    return {
      tasksPerDay: Math.round(tasksPerDay * 10) / 10,
      hoursPerDay: Math.round(hoursPerDay * 10) / 10,
      velocityTrend,
    }
  }

  /**
   * Get progress level based on completion percentage
   */
  static getProgressLevel(percentage: number): {
    level: string
    color: string
    description: string
  } {
    if (percentage >= 90) {
      return {
        level: 'Expert',
        color: 'purple',
        description: 'You\'ve mastered most concepts!',
      }
    } else if (percentage >= 70) {
      return {
        level: 'Advanced',
        color: 'blue',
        description: 'Great progress! You\'re doing excellent work.',
      }
    } else if (percentage >= 50) {
      return {
        level: 'Intermediate',
        color: 'green',
        description: 'Good progress! Keep up the momentum.',
      }
    } else if (percentage >= 25) {
      return {
        level: 'Beginner+',
        color: 'yellow',
        description: 'Nice start! You\'re building good habits.',
      }
    } else {
      return {
        level: 'Beginner',
        color: 'gray',
        description: 'Welcome! Every expert was once a beginner.',
      }
    }
  }

  /**
   * Get streak status and motivation
   */
  static getStreakStatus(progress: ProgressSummaryResponse): {
    status: 'excellent' | 'good' | 'at_risk' | 'broken'
    message: string
    nextMilestone?: number
  } {
    const streak = progress.current_streak_days

    let status: 'excellent' | 'good' | 'at_risk' | 'broken'
    let message: string
    let nextMilestone: number | undefined

    if (streak >= 30) {
      status = 'excellent'
      message = `🔥 Amazing ${streak}-day streak! You're on fire!`
      nextMilestone = Math.ceil(streak / 10) * 10 // Next 10-day milestone
    } else if (streak >= 7) {
      status = 'good'
      message = `⚡ Great ${streak}-day streak! Keep it going!`
      nextMilestone = 30
    } else if (streak >= 3) {
      status = 'good'
      message = `🌱 Nice ${streak}-day streak! Building momentum!`
      nextMilestone = 7
    } else if (streak >= 1) {
      status = 'at_risk'
      message = `💪 ${streak}-day streak. Don't break the chain!`
      nextMilestone = 3
    } else {
      status = 'broken'
      message = '🎯 Start a new streak today!'
      nextMilestone = 1
    }

    return { status, message, nextMilestone }
  }

  /**
   * Calculate estimated completion date
   */
  static calculateEstimatedCompletion(progress: DetailedProgressResponse): {
    estimatedDate: Date
    daysRemaining: number
    confidence: 'high' | 'medium' | 'low'
  } {
    const { summary, learning_velocity } = progress
    
    if (!summary.has_active_plan || summary.total_tasks === 0) {
      return {
        estimatedDate: new Date(),
        daysRemaining: 0,
        confidence: 'low',
      }
    }

    const remainingTasks = summary.total_tasks - summary.completed_tasks
    const tasksPerDay = learning_velocity?.tasks_per_day || 1

    const daysRemaining = Math.ceil(remainingTasks / tasksPerDay)
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + daysRemaining)

    // Confidence based on consistency
    let confidence: 'high' | 'medium' | 'low'
    if (summary.current_streak_days >= 7 && tasksPerDay >= 2) {
      confidence = 'high'
    } else if (summary.current_streak_days >= 3 && tasksPerDay >= 1) {
      confidence = 'medium'
    } else {
      confidence = 'low'
    }

    return {
      estimatedDate,
      daysRemaining,
      confidence,
    }
  }

  /**
   * Get personalized recommendations
   */
  static getPersonalizedRecommendations(progress: DetailedProgressResponse): string[] {
    const recommendations: string[] = []
    const { summary, learning_velocity } = progress

    // Streak-based recommendations
    if (summary.current_streak_days === 0) {
      recommendations.push('Start a learning streak today! Even 15 minutes counts.')
    } else if (summary.current_streak_days < 3) {
      recommendations.push('Keep your streak alive! Consistency is key to success.')
    } else if (summary.current_streak_days >= 7) {
      recommendations.push('Amazing streak! Consider increasing your daily learning time.')
    }

    // Velocity-based recommendations
    if ((learning_velocity?.tasks_per_day ?? 0) < 1) {
      recommendations.push('Try to complete at least one task per day to maintain momentum.')
    } else if ((learning_velocity?.tasks_per_day ?? 0) > 3) {
      recommendations.push('Great pace! Make sure to take breaks and review concepts thoroughly.')
    }

    // Progress-based recommendations
    if (summary.overall_progress < 25) {
      recommendations.push('Focus on building a consistent learning habit first.')
    } else if (summary.overall_progress < 50) {
      recommendations.push('You\'re making good progress! Stay consistent.')
    } else if (summary.overall_progress < 75) {
      recommendations.push('More than halfway there! Keep pushing forward.')
    } else {
      recommendations.push('Almost done! Finish strong and celebrate your achievement!')
    }

    // Score-based recommendations
    if (summary.average_score && summary.average_score < 70) {
      recommendations.push('Review concepts more thoroughly before moving to new topics.')
    } else if (summary.average_score && summary.average_score > 90) {
      recommendations.push('Excellent scores! Consider tackling more challenging exercises.')
    }

    return recommendations.slice(0, 3) // Limit to top 3 recommendations
  }

  /**
   * Format time duration for display
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = Math.round(minutes % 60)
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    } else {
      const days = Math.floor(minutes / 1440)
      const remainingHours = Math.floor((minutes % 1440) / 60)
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
    }
  }

  /**
   * Get progress color based on percentage
   */
  static getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'green'
    if (percentage >= 60) return 'blue'
    if (percentage >= 40) return 'yellow'
    if (percentage >= 20) return 'orange'
    return 'red'
  }

  /**
   * Calculate module difficulty distribution
   */
  static calculateDifficultyDistribution(modules: ModuleProgressResponse[]): {
    easy: number
    medium: number
    hard: number
  } {
    const distribution = { easy: 0, medium: 0, hard: 0 }

    modules.forEach(module => {
      // Simple heuristic based on average time per task
      const avgTimePerTask = module.total_time_spent_minutes / Math.max(1, module.total_tasks)
      
      if (avgTimePerTask <= 20) {
        distribution.easy++
      } else if (avgTimePerTask <= 45) {
        distribution.medium++
      } else {
        distribution.hard++
      }
    })

    return distribution
  }
}
