/**
 * Curriculum Service - API client for curriculum/learning plan management
 */

import api from './api'
import type {
  CreateCurriculumRequest,
  CurriculumResponse,
  CurriculumStatusResponse,
  CurriculumListResponse,
  ActivateCurriculumRequest,
  BaseResponse,
} from '../types/api'

export class CurriculumService {
  private static readonly BASE_PATH = '/api/v1/curriculum'

  /**
   * Get the user's active curriculum
   */
  static async getCurriculum(): Promise<CurriculumResponse> {
    const response = await api.get<CurriculumResponse>(this.BASE_PATH)
    return response.data
  }

  /**
   * Get all curricula for the user
   */
  static async getAllCurricula(): Promise<CurriculumListResponse> {
    const response = await api.get<CurriculumListResponse>(`${this.BASE_PATH}/all`)
    return response.data
  }

  /**
   * Create a new personalized curriculum
   */
  static async createCurriculum(request: CreateCurriculumRequest): Promise<CurriculumResponse> {
    const response = await api.post<CurriculumResponse>(this.BASE_PATH, request)
    return response.data
  }

  /**
   * Get curriculum status summary
   */
  static async getCurriculumStatus(): Promise<CurriculumStatusResponse> {
    const response = await api.get<CurriculumStatusResponse>(`${this.BASE_PATH}/status`)
    return response.data
  }

  /**
   * Activate a curriculum to start learning
   */
  static async activateCurriculum(request: ActivateCurriculumRequest): Promise<BaseResponse> {
    const response = await api.post<BaseResponse>(`${this.BASE_PATH}/activate`, request)
    return response.data
  }

  /**
   * Pause the active curriculum
   */
  static async pauseCurriculum(): Promise<BaseResponse> {
    const response = await api.post<BaseResponse>(`${this.BASE_PATH}/pause`)
    return response.data
  }

  /**
   * Get a specific curriculum by ID
   */
  static async getCurriculumById(planId: string): Promise<CurriculumResponse> {
    const response = await api.get<CurriculumResponse>(`${this.BASE_PATH}/${planId}`)
    return response.data
  }

  /**
   * Delete a curriculum
   */
  static async deleteCurriculum(planId: string): Promise<BaseResponse> {
    const response = await api.delete<BaseResponse>(`${this.BASE_PATH}/${planId}`)
    return response.data
  }

  /**
   * Calculate overall progress percentage
   */
  static calculateProgress(curriculum: CurriculumResponse): number {
    if (!curriculum.modules || curriculum.modules.length === 0) {
      return 0
    }

    const totalTasks = curriculum.modules.reduce((sum, module) => sum + module.total_tasks, 0)
    const completedTasks = curriculum.modules.reduce((sum, module) => sum + module.tasks_completed, 0)

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  }

  /**
   * Get current module based on progress
   */
  static getCurrentModule(curriculum: CurriculumResponse): typeof curriculum.modules[0] | null {
    if (!curriculum.modules || curriculum.modules.length === 0) {
      return null
    }

    // Find first incomplete module
    const incompleteModule = curriculum.modules.find(
      module => module.progress_percentage < 100
    )

    return incompleteModule || curriculum.modules[curriculum.modules.length - 1]
  }

  /**
   * Get next task to work on
   */
  static getNextTask(curriculum: CurriculumResponse): {
    module: typeof curriculum.modules[0]
    task: typeof curriculum.modules[0]['tasks'][0]
  } | null {
    const currentModule = this.getCurrentModule(curriculum)
    if (!currentModule) {
      return null
    }

    // Find first incomplete task in current module
    const incompleteTask = currentModule.tasks.find(task => !task.is_completed)
    if (!incompleteTask) {
      return null
    }

    return {
      module: currentModule,
      task: incompleteTask,
    }
  }

  /**
   * Estimate time to completion
   */
  static estimateTimeToCompletion(curriculum: CurriculumResponse): {
    remainingHours: number
    remainingDays: number
    estimatedCompletionDate: Date
  } {
    const totalMinutes = curriculum.modules.reduce(
      (sum, module) => sum + module.estimated_minutes,
      0
    )
    const completedMinutes = curriculum.modules.reduce(
      (sum, module) => sum + (module.estimated_minutes * module.progress_percentage / 100),
      0
    )

    const remainingMinutes = totalMinutes - completedMinutes
    const remainingHours = Math.ceil(remainingMinutes / 60)
    const remainingDays = Math.ceil(remainingHours / 2) // Assuming 2 hours per day

    const estimatedCompletionDate = new Date()
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + remainingDays)

    return {
      remainingHours,
      remainingDays,
      estimatedCompletionDate,
    }
  }

  /**
   * Validate curriculum creation request
   */
  static validateCreateRequest(request: CreateCurriculumRequest): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!request.goals || request.goals.length === 0) {
      errors.push('At least one learning goal is required')
    }

    if (request.goals && request.goals.length > 10) {
      errors.push('Maximum 10 learning goals allowed')
    }

    if (request.title && request.title.length > 100) {
      errors.push('Title must be 100 characters or less')
    }

    if (request.description && request.description.length > 500) {
      errors.push('Description must be 500 characters or less')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}