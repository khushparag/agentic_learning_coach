/**
 * Services Index - Centralized exports for all API services
 * 
 * This file provides a single entry point for importing all API services,
 * making it easier to manage imports and maintain consistency across the application.
 */

// Core API client
export { default as api } from './api'

// Import service classes for internal use
import { GoalsService } from './goalsService'
import { CurriculumService } from './curriculumService'
import { TasksService } from './tasksService'
import { SubmissionsService } from './submissionsService'
import { ProgressService } from './progressService'
import { AnalyticsService } from './analyticsService'
import { SocialService } from './socialService'
import { GamificationService } from './gamificationService'
import { SettingsService } from './settingsService'
import { AdminService } from './adminService'
import { ExerciseService } from './exerciseService'
import { contentService } from './contentService'

// Re-export service classes for all 8 backend domains
export { GoalsService } from './goalsService'
export { CurriculumService } from './curriculumService'
export { TasksService } from './tasksService'
export { SubmissionsService } from './submissionsService'
export { ProgressService } from './progressService'
export { AnalyticsService } from './analyticsService'
export { SocialService } from './socialService'
export { GamificationService } from './gamificationService'
export { SettingsService } from './settingsService'
export { AdminService } from './adminService'
export { ExerciseService } from './exerciseService'
export { contentService, type GenerateContentRequest, type GenerateContentResponse, type ExplainConceptRequest, type ExplainConceptResponse } from './contentService'

// React Query configuration and utilities
export {
  queryClient,
  queryKeys,
  invalidateQueries,
  prefetchQueries,
  optimisticUpdates,
  handleQueryError,
} from '../lib/queryClient'

// Type definitions
export type * from '../types/apiTypes'

// Service utilities and helpers
export const services = {
  goals: GoalsService,
  curriculum: CurriculumService,
  tasks: TasksService,
  submissions: SubmissionsService,
  progress: ProgressService,
  analytics: AnalyticsService,
  social: SocialService,
  gamification: GamificationService,
  settings: SettingsService,
  admin: AdminService,
  exercise: ExerciseService,
  content: contentService,
} as const

// Common service patterns and utilities
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ServiceError'
  }

  static fromAxiosError(error: unknown): ServiceError {
    const err = error as { response?: { data?: { detail?: string; error_code?: string }; status?: number }; message?: string; code?: string }
    const message = err.response?.data?.detail || err.message || 'An error occurred'
    const code = err.response?.data?.error_code || err.code
    const status = err.response?.status
    const details = err.response?.data

    return new ServiceError(message, code, status, details)
  }
}

// Service response wrapper for consistent error handling
export type ServiceResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: ServiceError
}

// Utility function to wrap service calls with error handling
export async function safeServiceCall<T>(
  serviceCall: () => Promise<T>
): Promise<ServiceResponse<T>> {
  try {
    const data = await serviceCall()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: ServiceError.fromAxiosError(error),
    }
  }
}

// Batch service calls utility
export async function batchServiceCalls<T extends Record<string, () => Promise<unknown>>>(
  calls: T
): Promise<{
  [K in keyof T]: ServiceResponse<Awaited<ReturnType<T[K]>>>
}> {
  const entries = Object.entries(calls)
  const results = await Promise.allSettled(
    entries.map(([_key, call]) => safeServiceCall(call))
  )

  const batchResult = {} as {
    [K in keyof T]: ServiceResponse<Awaited<ReturnType<T[K]>>>
  }
  
  entries.forEach(([key], index) => {
    const result = results[index]
    if (result.status === 'fulfilled') {
      (batchResult as Record<string, unknown>)[key] = result.value
    } else {
      (batchResult as Record<string, unknown>)[key] = {
        success: false,
        error: ServiceError.fromAxiosError(result.reason),
      }
    }
  })

  return batchResult
}

// Service health check utility
export async function checkServiceHealth(): Promise<{
  api: boolean
  timestamp: string
  services: Record<string, boolean>
}> {
  const healthChecks = {
    goals: () => GoalsService.getGoals().then(() => true).catch(() => false),
    curriculum: () => CurriculumService.getCurriculumStatus().then(() => true).catch(() => false),
    tasks: () => TasksService.getTodayTasks().then(() => true).catch(() => false),
    progress: () => ProgressService.getProgressSummary().then(() => true).catch(() => false),
  }

  const results = await Promise.allSettled(
    Object.entries(healthChecks).map(async ([name, check]) => [name, await check()])
  )

  const services: Record<string, boolean> = {}
  let apiHealthy = true

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const [name, healthy] = result.value as [string, boolean]
      services[name] = healthy
      if (!healthy) apiHealthy = false
    } else {
      apiHealthy = false
    }
  })

  return {
    api: apiHealthy,
    timestamp: new Date().toISOString(),
    services,
  }
}

// Environment configuration helpers
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  debug: import.meta.env.VITE_DEBUG === 'true',
  
  features: {
    socialLearning: import.meta.env.VITE_FEATURE_SOCIAL_LEARNING !== 'false',
    gamification: import.meta.env.VITE_FEATURE_GAMIFICATION !== 'false',
    analytics: import.meta.env.VITE_FEATURE_ANALYTICS !== 'false',
    realTimeUpdates: import.meta.env.VITE_FEATURE_REAL_TIME_UPDATES !== 'false',
    codeSharing: import.meta.env.VITE_FEATURE_CODE_SHARING !== 'false',
    peerChallenges: import.meta.env.VITE_FEATURE_PEER_CHALLENGES !== 'false',
  },
  
  performance: {
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'),
    autosaveInterval: parseInt(import.meta.env.VITE_AUTOSAVE_INTERVAL || '30000'),
  },
  
  ui: {
    defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'system',
    enableAnimations: import.meta.env.VITE_ENABLE_ANIMATIONS !== 'false',
    defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE || 'en-US',
  },
  
  editor: {
    defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || 'javascript',
    enableMinimap: import.meta.env.VITE_EDITOR_MINIMAP === 'true',
    theme: import.meta.env.VITE_EDITOR_THEME || 'vs-dark',
  },
  
  learning: {
    defaultSessionLength: parseInt(import.meta.env.VITE_DEFAULT_SESSION_LENGTH || '60'),
    maxHintsPerExercise: parseInt(import.meta.env.VITE_MAX_HINTS_PER_EXERCISE || '3'),
  },
  
  gamification: {
    enableXPAnimations: import.meta.env.VITE_ENABLE_XP_ANIMATIONS !== 'false',
    enableAchievementNotifications: import.meta.env.VITE_ENABLE_ACHIEVEMENT_NOTIFICATIONS !== 'false',
    streakReminderTime: import.meta.env.VITE_STREAK_REMINDER_TIME || '20:00',
  },
  
  social: {
    maxSolutionsPerDay: parseInt(import.meta.env.VITE_MAX_SOLUTIONS_PER_DAY || '10'),
    maxChallengesPerDay: parseInt(import.meta.env.VITE_MAX_CHALLENGES_PER_DAY || '5'),
    maxStudyGroupMembers: parseInt(import.meta.env.VITE_MAX_STUDY_GROUP_MEMBERS || '20'),
  },
} as const

// Development utilities
if (import.meta.env.DEV) {
  // Expose services to window for debugging
  ;(window as any).services = services
  ;(window as any).config = config
  ;(window as any).checkServiceHealth = checkServiceHealth
}
