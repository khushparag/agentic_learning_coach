/**
 * Submissions Service - API client for code submission and evaluation
 */

import api from './api'
import type {
  SubmitCodeRequest,
  EvaluationResponse,
  SubmissionResponse,
  SubmissionListResponse,
  FeedbackResponse,
  PaginationParams,
} from '../types/apiTypes'

export class SubmissionsService {
  private static readonly BASE_PATH = '/api/v1/submissions'

  /**
   * Submit code for evaluation
   */
  static async submitCode(request: SubmitCodeRequest): Promise<EvaluationResponse> {
    const response = await api.post<EvaluationResponse>(this.BASE_PATH, request)
    return response.data
  }

  /**
   * List user's submissions with optional filtering
   */
  static async listSubmissions(options: {
    taskId?: string
    statusFilter?: string
    pagination?: PaginationParams
  } = {}): Promise<SubmissionListResponse> {
    const params: Record<string, unknown> = {}

    if (options.taskId) params.task_id = options.taskId
    if (options.statusFilter) params.status_filter = options.statusFilter
    if (options.pagination) {
      Object.assign(params, options.pagination)
    }

    const response = await api.get<SubmissionListResponse>(this.BASE_PATH, { params })
    return response.data
  }

  /**
   * Get detailed submission and evaluation results
   */
  static async getSubmission(submissionId: string): Promise<EvaluationResponse> {
    const response = await api.get<EvaluationResponse>(`${this.BASE_PATH}/${submissionId}`)
    return response.data
  }

  /**
   * Get detailed feedback for a submission
   */
  static async getSubmissionFeedback(submissionId: string): Promise<FeedbackResponse> {
    const response = await api.get<FeedbackResponse>(`${this.BASE_PATH}/${submissionId}/feedback`)
    return response.data
  }

  /**
   * Get submission history for a specific task
   */
  static async getTaskSubmissionHistory(
    taskId: string,
    pagination?: PaginationParams
  ): Promise<SubmissionListResponse> {
    const params = pagination || {}
    const response = await api.get<SubmissionListResponse>(
      `${this.BASE_PATH}/task/${taskId}/history`,
      { params }
    )
    return response.data
  }

  /**
   * Validate code submission request
   */
  static validateSubmission(request: SubmitCodeRequest): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!request.task_id || request.task_id.trim().length === 0) {
      errors.push('Task ID is required')
    }

    if (!request.code || request.code.trim().length === 0) {
      errors.push('Code cannot be empty')
    }

    if (request.code && request.code.length > 50000) {
      errors.push('Code is too long (maximum 50,000 characters)')
    }

    if (!request.language || request.language.trim().length === 0) {
      errors.push('Programming language is required')
    }

    const supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp']
    if (request.language && !supportedLanguages.includes(request.language.toLowerCase())) {
      errors.push(`Unsupported language: ${request.language}`)
    }

    // Validate files if provided
    if (request.files) {
      Object.entries(request.files).forEach(([filename, content]) => {
        if (!filename || filename.trim().length === 0) {
          errors.push('File names cannot be empty')
        }
        if (content && content.length > 10000) {
          errors.push(`File ${filename} is too large (maximum 10,000 characters per file)`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get submission status color for UI
   */
  static getStatusColor(status: string): string {
    const statusColors = {
      PASS: 'green',
      FAIL: 'red',
      PARTIAL: 'yellow',
      PENDING: 'blue',
      ERROR: 'red',
    }
    return statusColors[status as keyof typeof statusColors] || 'gray'
  }

  /**
   * Get submission status icon
   */
  static getStatusIcon(status: string): string {
    const statusIcons = {
      PASS: '✅',
      FAIL: '❌',
      PARTIAL: '⚠️',
      PENDING: '⏳',
      ERROR: '💥',
    }
    return statusIcons[status as keyof typeof statusIcons] || '❓'
  }

  /**
   * Calculate overall score from evaluation
   */
  static calculateOverallScore(evaluation: EvaluationResponse): number {
    if (evaluation.score !== undefined) {
      return Math.round(evaluation.score)
    }

    // Fallback calculation based on test results
    if (evaluation.tests_total > 0) {
      return Math.round((evaluation.tests_passed / evaluation.tests_total) * 100)
    }

    return 0
  }

  /**
   * Get performance rating based on score
   */
  static getPerformanceRating(score: number): {
    rating: string
    color: string
    description: string
  } {
    if (score >= 90) {
      return {
        rating: 'Excellent',
        color: 'green',
        description: 'Outstanding work! You\'ve mastered this concept.',
      }
    } else if (score >= 80) {
      return {
        rating: 'Good',
        color: 'blue',
        description: 'Well done! Minor improvements could make it even better.',
      }
    } else if (score >= 70) {
      return {
        rating: 'Fair',
        color: 'yellow',
        description: 'Good effort! Review the feedback to improve.',
      }
    } else if (score >= 60) {
      return {
        rating: 'Needs Work',
        color: 'orange',
        description: 'Keep practicing! You\'re on the right track.',
      }
    } else {
      return {
        rating: 'Poor',
        color: 'red',
        description: 'Don\'t give up! Review the concepts and try again.',
      }
    }
  }

  /**
   * Format execution time for display
   */
  static formatExecutionTime(timeMs: number): string {
    if (timeMs < 1000) {
      return `${Math.round(timeMs)}ms`
    } else if (timeMs < 60000) {
      return `${(timeMs / 1000).toFixed(1)}s`
    } else {
      const minutes = Math.floor(timeMs / 60000)
      const seconds = Math.round((timeMs % 60000) / 1000)
      return `${minutes}m ${seconds}s`
    }
  }

  /**
   * Get quality analysis summary
   */
  static getQualitySummary(evaluation: EvaluationResponse): {
    overall: string
    strengths: string[]
    improvements: string[]
  } {
    const { quality_analysis, feedback } = evaluation

    let overall = 'Good'
    if (quality_analysis.overall_quality_score >= 0.8) {
      overall = 'Excellent'
    } else if (quality_analysis.overall_quality_score >= 0.6) {
      overall = 'Good'
    } else if (quality_analysis.overall_quality_score >= 0.4) {
      overall = 'Fair'
    } else {
      overall = 'Needs Improvement'
    }

    return {
      overall,
      strengths: feedback.strengths,
      improvements: feedback.suggestions,
    }
  }

  /**
   * Check if submission can be retried
   */
  static canRetry(evaluation: EvaluationResponse): boolean {
    // Allow retry if not passed or score is below 80%
    return !evaluation.passed || evaluation.score < 80
  }

  /**
   * Get next steps based on evaluation
   */
  static getNextSteps(evaluation: EvaluationResponse): string[] {
    const steps: string[] = []

    if (evaluation.passed) {
      if (evaluation.score >= 90) {
        steps.push('Excellent work! Move on to the next challenge.')
        steps.push('Consider helping others or exploring advanced topics.')
      } else {
        steps.push('Good job! Review the feedback to improve your approach.')
        steps.push('Try to optimize your solution for better performance.')
      }
    } else {
      steps.push('Review the failing test cases and error messages.')
      steps.push('Check the task requirements and examples again.')
      steps.push('Consider asking for a hint if you\'re stuck.')
      steps.push('Take a break and come back with fresh eyes.')
    }

    // Add specific feedback-based steps
    if (evaluation.feedback.next_steps) {
      steps.push(...evaluation.feedback.next_steps)
    }

    return steps
  }
}
