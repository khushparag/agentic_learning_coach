/**
 * Tasks Service - API client for task retrieval and management
 */

import api from './api'
import type {
  TaskDetailResponse,
  TaskSummaryResponse,
  TodayTasksResponse,
  TaskListResponse,
  TaskHintResponse,
  PaginationParams,
} from '../types/api'

export class TasksService {
  private static readonly BASE_PATH = '/api/v1/tasks'

  /**
   * Get tasks scheduled for today
   */
  static async getTodayTasks(dayOffset?: number): Promise<TodayTasksResponse> {
    const params = dayOffset !== undefined ? { day_offset: dayOffset } : {}
    const response = await api.get<TodayTasksResponse>(`${this.BASE_PATH}/today`, { params })
    return response.data
  }

  /**
   * List tasks with optional filtering
   */
  static async listTasks(options: {
    moduleId?: string
    completed?: boolean
    taskType?: string
    pagination?: PaginationParams
  } = {}): Promise<TaskListResponse> {
    const params: Record<string, unknown> = {}

    if (options.moduleId) params.module_id = options.moduleId
    if (options.completed !== undefined) params.completed = options.completed
    if (options.taskType) params.task_type = options.taskType
    if (options.pagination) {
      Object.assign(params, options.pagination)
    }

    const response = await api.get<TaskListResponse>(this.BASE_PATH, { params })
    return response.data
  }

  /**
   * Get detailed information about a specific task
   */
  static async getTask(taskId: string): Promise<TaskDetailResponse> {
    const response = await api.get<TaskDetailResponse>(`${this.BASE_PATH}/${taskId}`)
    return response.data
  }

  /**
   * Get a hint for a task
   */
  static async getTaskHint(taskId: string, hintIndex: number = 0): Promise<TaskHintResponse> {
    const params = { hint_index: hintIndex }
    const response = await api.post<TaskHintResponse>(
      `${this.BASE_PATH}/${taskId}/hint`,
      {},
      { params }
    )
    return response.data
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(
    taskId: string, 
    status: 'not_started' | 'in_progress' | 'completed'
  ): Promise<TaskDetailResponse> {
    const response = await api.patch<TaskDetailResponse>(
      `${this.BASE_PATH}/${taskId}/status`,
      { status }
    )
    return response.data
  }

  /**
   * Get all tasks for a specific module
   */
  static async getTasksByModule(
    moduleId: string,
    pagination?: PaginationParams
  ): Promise<TaskListResponse> {
    const params = pagination || {}
    const response = await api.get<TaskListResponse>(
      `${this.BASE_PATH}/module/${moduleId}`,
      { params }
    )
    return response.data
  }

  /**
   * Filter tasks by completion status
   */
  static filterTasksByCompletion(
    tasks: TaskSummaryResponse[],
    completed: boolean
  ): TaskSummaryResponse[] {
    return tasks.filter(task => task.is_completed === completed)
  }

  /**
   * Group tasks by module
   */
  static groupTasksByModule(tasks: TaskSummaryResponse[]): Record<string, TaskSummaryResponse[]> {
    return tasks.reduce((groups, task) => {
      const moduleId = task.module_id
      if (!groups[moduleId]) {
        groups[moduleId] = []
      }
      groups[moduleId].push(task)
      return groups
    }, {} as Record<string, TaskSummaryResponse[]>)
  }

  /**
   * Calculate total estimated time for tasks
   */
  static calculateTotalTime(tasks: TaskSummaryResponse[]): number {
    return tasks.reduce((total, task) => total + task.estimated_minutes, 0)
  }

  /**
   * Get task difficulty level based on type and context
   */
  static getTaskDifficulty(task: TaskDetailResponse): 'easy' | 'medium' | 'hard' {
    // Simple heuristic based on estimated time and type
    const timeThresholds = {
      READ: { easy: 15, medium: 30 },
      WATCH: { easy: 20, medium: 45 },
      CODE: { easy: 30, medium: 60 },
      QUIZ: { easy: 10, medium: 20 },
    }

    const thresholds = timeThresholds[task.task_type as keyof typeof timeThresholds] || 
                     timeThresholds.CODE

    if (task.estimated_minutes <= thresholds.easy) {
      return 'easy'
    } else if (task.estimated_minutes <= thresholds.medium) {
      return 'medium'
    } else {
      return 'hard'
    }
  }

  /**
   * Get task priority based on day offset and completion status
   */
  static getTaskPriority(task: TaskSummaryResponse): 'high' | 'medium' | 'low' {
    if (task.is_completed) {
      return 'low'
    }

    // Tasks for today or overdue have high priority
    if (task.day_offset <= 0) {
      return 'high'
    }

    // Tasks for tomorrow have medium priority
    if (task.day_offset === 1) {
      return 'medium'
    }

    // Future tasks have low priority
    return 'low'
  }

  /**
   * Sort tasks by priority and day offset
   */
  static sortTasksByPriority(tasks: TaskSummaryResponse[]): TaskSummaryResponse[] {
    return [...tasks].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const aPriority = this.getTaskPriority(a)
      const bPriority = this.getTaskPriority(b)

      // First sort by priority
      const priorityDiff = priorityOrder[aPriority] - priorityOrder[bPriority]
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      // Then by day offset (earlier first)
      return a.day_offset - b.day_offset
    })
  }

  /**
   * Get progress message based on task completion
   */
  static getProgressMessage(todayTasks: TodayTasksResponse): string {
    const { total_tasks, completed_tasks } = todayTasks

    if (total_tasks === 0) {
      return "No tasks scheduled for today. Great time to explore or review!"
    }

    if (completed_tasks === 0) {
      return `Ready to start? You have ${total_tasks} task${total_tasks > 1 ? 's' : ''} waiting!`
    }

    if (completed_tasks === total_tasks) {
      return "🎉 Excellent! You've completed all tasks for today!"
    }

    const remaining = total_tasks - completed_tasks
    const percentage = Math.round((completed_tasks / total_tasks) * 100)

    if (percentage >= 75) {
      return `Almost there! Just ${remaining} more task${remaining > 1 ? 's' : ''} to go!`
    } else if (percentage >= 50) {
      return `Great progress! ${remaining} task${remaining > 1 ? 's' : ''} remaining.`
    } else {
      return `Good start! Keep going with ${remaining} more task${remaining > 1 ? 's' : ''}.`
    }
  }

  /**
   * Validate task ID format
   */
  static isValidTaskId(taskId: string): boolean {
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(taskId)
  }
}