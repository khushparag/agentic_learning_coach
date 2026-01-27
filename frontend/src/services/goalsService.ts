/**
 * Goals Service - API client for learning goals management
 */

import api from './api'
import type {
  SetGoalsRequest,
  SetGoalsResponse,
  UpdateGoalsRequest,
  BaseResponse,
} from '../types/apiTypes'

export class GoalsService {
  private static readonly BASE_PATH = '/api/v1/goals'

  /**
   * Set learning goals and time constraints for a user
   */
  static async setGoals(request: SetGoalsRequest): Promise<SetGoalsResponse> {
    const response = await api.post<SetGoalsResponse>(this.BASE_PATH, request)
    return response.data
  }

  /**
   * Get current learning goals for the user
   */
  static async getGoals(): Promise<SetGoalsResponse> {
    const response = await api.get<SetGoalsResponse>(this.BASE_PATH)
    return response.data
  }

  /**
   * Update existing learning goals or constraints
   */
  static async updateGoals(request: UpdateGoalsRequest): Promise<SetGoalsResponse> {
    const response = await api.patch<SetGoalsResponse>(this.BASE_PATH, request)
    return response.data
  }

  /**
   * Clear all learning goals for the user
   */
  static async clearGoals(): Promise<BaseResponse> {
    const response = await api.delete<BaseResponse>(this.BASE_PATH)
    return response.data
  }

  /**
   * Validate goals before setting them
   */
  static validateGoals(goals: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!goals || goals.length === 0) {
      errors.push('At least one learning goal is required')
    }

    if (goals.length > 10) {
      errors.push('Maximum 10 learning goals allowed')
    }

    goals.forEach((goal, index) => {
      if (!goal || goal.trim().length === 0) {
        errors.push(`Goal ${index + 1} cannot be empty`)
      }
      if (goal.length > 100) {
        errors.push(`Goal ${index + 1} is too long (max 100 characters)`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get suggested goals based on popular technologies
   */
  static getSuggestedGoals(): string[] {
    return [
      'JavaScript Fundamentals',
      'React Development',
      'Node.js Backend',
      'Python Programming',
      'Data Structures & Algorithms',
      'TypeScript',
      'Express.js API Development',
      'Database Design (SQL)',
      'Git Version Control',
      'Testing & Debugging',
      'Web Security Basics',
      'RESTful API Design',
      'Frontend Performance',
      'Docker Containerization',
      'Cloud Deployment (AWS/Azure)',
    ]
  }

  /**
   * Estimate learning timeline based on goals and time constraints
   */
  static estimateTimeline(
    goals: string[],
    hoursPerWeek: number,
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner'
  ): {
    totalWeeks: number
    totalHours: number
    hoursPerGoal: number
  } {
    const baseHoursPerGoal = {
      beginner: 40,
      intermediate: 25,
      advanced: 15,
      expert: 10,
    }

    const hoursPerGoal = baseHoursPerGoal[skillLevel]
    const totalHours = goals.length * hoursPerGoal
    const totalWeeks = Math.ceil(totalHours / hoursPerWeek)

    return {
      totalWeeks,
      totalHours,
      hoursPerGoal,
    }
  }
}
