/**
 * API Hooks Index - Centralized exports for all React Query hooks
 * 
 * This file provides a single entry point for importing all API hooks,
 * making it easier to manage imports and maintain consistency across components.
 */

// Goals domain hooks
export {
  useGoals,
  useSetGoals,
  useUpdateGoals,
  useClearGoals,
  useValidateGoals,
  useGoalsWithUtils,
} from './useGoals'

// Curriculum domain hooks
export {
  useCurriculum,
  useAllCurricula,
  useCurriculumStatus,
  useCurriculumById,
  useCreateCurriculum,
  useActivateCurriculum,
  usePauseCurriculum,
  useDeleteCurriculum,
  useCurriculumWithUtils,
} from './useCurriculum'

// Tasks domain hooks
export {
  useTodayTasks,
  useTasks,
  useTask,
  useTasksByModule,
  useTaskHint,
  useCachedTaskHint,
  useTasksWithUtils,
  useTaskManagement,
  useTaskFilters,
} from './useTasks'

// Submissions domain hooks
export {
  useSubmitCode,
  useSubmissions,
  useSubmission,
  useSubmissionFeedback,
  useTaskSubmissionHistory,
  useSubmissionsWithUtils,
  useSubmissionAnalysis,
  useSubmissionWorkflow,
  useSubmissionStats,
} from './useSubmissions'

// Progress domain hooks
export {
  useProgressSummary,
  useDetailedProgress,
  useProgressStats,
  useModuleProgress,
  useUpdateProgress,
  useProgressWithUtils,
  useProgressAnalytics,
  useProgressTracker,
  useProgressMilestones,
} from './useProgress'

// Analytics domain hooks
export {
  useLearningInsights,
  useDifficultyPrediction,
  useRetentionAnalysis,
  useActivityHeatmap,
  usePeerComparison,
  usePersonalizedRecommendations,
  useAnalyticsWithUtils,
  useAnalyticsDashboard,
  useRetentionManagement,
  useDifficultyOptimization,
} from './useAnalytics'

// Social domain hooks
export {
  useUserChallenges,
  useChallengeLeaderboard,
  useCreateChallenge,
  useAcceptChallenge,
  useSubmitChallengeResult,
  useSharedSolutions,
  useSolutionComments,
  useShareSolution,
  useLikeSolution,
  useAddComment,
  useStudyGroups,
  useStudyGroupProgress,
  useCreateStudyGroup,
  useJoinStudyGroup,
  useFollowing,
  useActivityFeed,
  useFollowUser,
  useSocialWithUtils,
  useSocialEngagement,
} from './useSocial'

// Gamification domain hooks
export {
  useGamificationProfile,
  useAchievements,
  useLeaderboard,
  useBadgeShowcase,
  useAwardXP,
  useUpdateStreak,
  useGamificationWithUtils,
  useGamificationAnalytics,
  useAutoXPAward,
} from './useGamification'

// Admin domain hooks
export {
  useSystemHealth,
  useSystemMetrics,
  useAdminDashboard,
  useServiceDiagnostics,
  useUserManagement,
  useAdminUser,
  useUserSearch,
  useUserRoles,
  useUpdateUserRole,
  useUpdateUserStatus,
  useDeleteUser,
  useSystemConfiguration,
  useUpdateSystemConfiguration,
  useExportConfiguration,
  useImportConfiguration,
  useValidateConfiguration,
  useAdminActivities,
  useSystemAlerts,
  useResolveAlert,
  useCreateAlert,
  useBackupConfiguration,
  useBackupHistory,
  useCreateBackup,
  useDeleteBackup,
  useRestartService,
  useClearCache,
  useRunMaintenance,
  useSystemLogs,
} from './useAdmin'

// Composite hooks that combine multiple domains
export { useComprehensiveDashboard } from './useComprehensiveDashboard'
export { useLearningSession } from './useLearningSession'
export { useUserProfile } from './useUserProfile'

// Hook utilities and helpers
export const hookUtils = {
  // Common patterns for hook composition
  combineLoadingStates: (...loadingStates: boolean[]) => loadingStates.some(Boolean),
  combineErrorStates: (...errors: (string | null)[]) => errors.find(Boolean) || null,
  
  // Debounced refetch helper
  createDebouncedRefetch: (refetchFn: () => void, delay: number = 300) => {
    let timeoutId: NodeJS.Timeout
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(refetchFn, delay)
    }
  },
  
  // Optimistic update helper
  createOptimisticUpdate: <T>(
    currentData: T | undefined,
    updateFn: (data: T) => T
  ): T | undefined => {
    if (!currentData) return currentData
    return updateFn(currentData)
  },
  
  // Error boundary helper for hooks
  withErrorBoundary: <T extends (...args: any[]) => any>(hook: T): T => {
    return ((...args: Parameters<T>) => {
      try {
        return hook(...args)
      } catch (error) {
        console.error('Hook error:', error)
        return {
          data: null,
          isLoading: false,
          isError: true,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }) as T
  },
} as const

// Development utilities
if (import.meta.env.DEV) {
  // Expose hook utilities to window for debugging
  ;(window as any).hookUtils = hookUtils
}
