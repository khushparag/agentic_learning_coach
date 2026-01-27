/**
 * Progress API Hooks - React Query hooks for progress tracking and analytics
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ProgressService } from '../../services/progressService'
import { queryKeys, handleQueryError } from '../../lib/queryClient'
import type {
  ProgressSummaryResponse,
  DetailedProgressResponse,
  ModuleProgressResponse,
  ProgressStatsResponse,
  ProgressUpdateRequest,
  BaseResponse,
} from '../../types/api'

/**
 * Hook to get progress summary for the user
 */
export function useProgressSummary() {
  return useQuery({
    queryKey: queryKeys.progress.summary(),
    queryFn: () => ProgressService.getProgressSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })
}

/**
 * Hook to get detailed progress information
 */
export function useDetailedProgress() {
  return useQuery({
    queryKey: queryKeys.progress.detailed(),
    queryFn: () => ProgressService.getDetailedProgress(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get progress statistics
 */
export function useProgressStats() {
  return useQuery({
    queryKey: queryKeys.progress.stats(),
    queryFn: () => ProgressService.getProgressStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get progress for a specific module
 */
export function useModuleProgress(moduleId: string | null) {
  return useQuery({
    queryKey: queryKeys.progress.byModule(moduleId || ''),
    queryFn: () => ProgressService.getModuleProgress(moduleId!),
    enabled: Boolean(moduleId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to update progress for a task
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ProgressUpdateRequest) => ProgressService.updateProgress(request),
    onSuccess: (_, variables) => {
      // Invalidate progress queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
      
      // Also invalidate task queries as completion status may have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byId(variables.task_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.today() })
      
      // Invalidate gamification queries for potential XP/achievement updates
      queryClient.invalidateQueries({ queryKey: queryKeys.gamification.all })
    },
    onError: (error) => {
      console.error('Failed to update progress:', handleQueryError(error))
    },
  })
}

/**
 * Hook with progress utilities and computed values
 */
export function useProgressWithUtils() {
  const summaryQuery = useProgressSummary()
  const detailedQuery = useDetailedProgress()
  const statsQuery = useProgressStats()
  const updateMutation = useUpdateProgress()

  const summary = summaryQuery.data
  const detailed = detailedQuery.data
  const stats = statsQuery.data

  return {
    // Query data and state
    summary,
    detailed,
    stats,
    isLoading: summaryQuery.isLoading || detailedQuery.isLoading || statsQuery.isLoading,
    isError: summaryQuery.isError || detailedQuery.isError || statsQuery.isError,
    error: summaryQuery.error ? handleQueryError(summaryQuery.error) :
           detailedQuery.error ? handleQueryError(detailedQuery.error) :
           statsQuery.error ? handleQueryError(statsQuery.error) : null,
    
    // Mutations
    updateProgress: updateMutation.mutate,
    
    // Mutation states
    isUpdating: updateMutation.isPending,
    
    // Computed properties
    hasActivePlan: Boolean(summary?.has_active_plan),
    overallProgress: summary?.overall_progress || 0,
    completionRate: summary?.total_tasks 
      ? Math.round((summary.completed_tasks / summary.total_tasks) * 100)
      : 0,
    
    // Learning velocity
    learningVelocity: summary ? ProgressService.calculateLearningVelocity(summary) : null,
    
    // Progress level
    progressLevel: summary ? ProgressService.getProgressLevel(summary.overall_progress) : null,
    
    // Streak status
    streakStatus: summary ? ProgressService.getStreakStatus(summary) : null,
    
    // Estimated completion
    estimatedCompletion: detailed ? ProgressService.calculateEstimatedCompletion(detailed) : null,
    
    // Personalized recommendations
    recommendations: detailed ? ProgressService.getPersonalizedRecommendations(detailed) : [],
    
    // Difficulty distribution
    difficultyDistribution: detailed?.modules 
      ? ProgressService.calculateDifficultyDistribution(detailed.modules)
      : null,
    
    // Utilities
    formatDuration: ProgressService.formatDuration,
    getProgressColor: ProgressService.getProgressColor,
    
    // Refetch functions
    refetch: () => {
      summaryQuery.refetch()
      detailedQuery.refetch()
      statsQuery.refetch()
    },
  }
}

/**
 * Hook for progress analytics and insights
 */
export function useProgressAnalytics() {
  const detailedQuery = useDetailedProgress()
  const detailed = detailedQuery.data

  const analytics = detailed ? {
    // Learning patterns
    learningPatterns: {
      mostProductiveTimeOfDay: 'Morning', // Would be calculated from actual data
      averageSessionLength: detailed.summary.total_time_spent_minutes / Math.max(1, detailed.summary.completed_tasks),
      consistencyScore: detailed.summary.current_streak_days / Math.max(1, detailed.summary.longest_streak_days) * 100,
    },
    
    // Skill development
    skillDevelopment: {
      strongestAreas: detailed.skill_breakdown 
        ? Object.entries(detailed.skill_breakdown)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([skill]) => skill)
        : [],
      
      areasForImprovement: detailed.skill_breakdown
        ? Object.entries(detailed.skill_breakdown)
            .sort(([,a], [,b]) => a - b)
            .slice(0, 3)
            .map(([skill]) => skill)
        : [],
      
      overallSkillScore: detailed.skill_breakdown
        ? Object.values(detailed.skill_breakdown).reduce((a, b) => a + b, 0) / Object.keys(detailed.skill_breakdown).length
        : 0,
    },
    
    // Performance metrics
    performance: {
      averageScore: detailed.summary.average_score || 0,
      improvementTrend: detailed.learning_velocity?.trend ?? 'stable',
      efficiencyScore: (detailed.learning_velocity?.tasks_per_day ?? 0) * (detailed.summary.average_score || 0) / 100,
    },
    
    // Goal achievement
    goalAchievement: {
      onTrackForGoals: detailed.learning_velocity?.trend === 'improving',
      estimatedCompletionDate: ProgressService.calculateEstimatedCompletion(detailed).estimatedDate.toISOString(),
      daysAhead: ProgressService.calculateEstimatedCompletion(detailed).daysRemaining,
    },
    
    // Engagement metrics
    engagement: {
      streakHealth: detailed.summary.current_streak_days >= 7 ? 'excellent' :
                   detailed.summary.current_streak_days >= 3 ? 'good' :
                   detailed.summary.current_streak_days >= 1 ? 'fair' : 'poor',
      
      activityLevel: (detailed.learning_velocity?.tasks_per_day ?? 0) >= 2 ? 'high' :
                     (detailed.learning_velocity?.tasks_per_day ?? 0) >= 1 ? 'medium' : 'low',
      
      motivationScore: Math.min(100, 
        (detailed.summary.current_streak_days * 10) + 
        (detailed.summary.overall_progress * 0.5) +
        ((detailed.summary.average_score || 0) * 0.3)
      ),
    },
  } : null

  return {
    analytics,
    isLoading: detailedQuery.isLoading,
    error: detailedQuery.error ? handleQueryError(detailedQuery.error) : null,
    refetch: detailedQuery.refetch,
  }
}

/**
 * Hook for progress tracking with real-time updates
 */
export function useProgressTracker() {
  const queryClient = useQueryClient()
  const updateMutation = useUpdateProgress()

  const trackTaskCompletion = (taskId: string, timeSpentMinutes?: number) => {
    // Optimistically update progress
    queryClient.setQueryData(queryKeys.progress.summary(), (old: ProgressSummaryResponse | undefined) => {
      if (!old) return old
      return {
        ...old,
        completed_tasks: old.completed_tasks + 1,
        total_time_spent_minutes: old.total_time_spent_minutes + (timeSpentMinutes || 0),
        overall_progress: old.total_tasks > 0 
          ? Math.round(((old.completed_tasks + 1) / old.total_tasks) * 100)
          : 0,
      }
    })

    // Update progress via API
    updateMutation.mutate({
      task_id: taskId,
      completed: true,
      time_spent_minutes: timeSpentMinutes,
    })
  }

  const trackTimeSpent = (taskId: string, timeSpentMinutes: number) => {
    // Update time tracking
    updateMutation.mutate({
      task_id: taskId,
      completed: false, // Just updating time, not marking complete
      time_spent_minutes: timeSpentMinutes,
    })
  }

  const resetTaskProgress = (taskId: string) => {
    // Mark task as incomplete
    updateMutation.mutate({
      task_id: taskId,
      completed: false,
    })
  }

  return {
    trackTaskCompletion,
    trackTimeSpent,
    resetTaskProgress,
    isTracking: updateMutation.isPending,
    error: updateMutation.error ? handleQueryError(updateMutation.error) : null,
  }
}

/**
 * Hook for progress milestones and achievements
 */
export function useProgressMilestones() {
  const summaryQuery = useProgressSummary()
  const summary = summaryQuery.data

  // Define milestone arrays first
  const completionMilestones = summary ? [
    { threshold: 25, reached: summary.overall_progress >= 25, title: 'Quarter Complete', icon: '🌱' },
    { threshold: 50, reached: summary.overall_progress >= 50, title: 'Halfway There', icon: '🚀' },
    { threshold: 75, reached: summary.overall_progress >= 75, title: 'Almost Done', icon: '⭐' },
    { threshold: 100, reached: summary.overall_progress >= 100, title: 'Completed!', icon: '🎉' },
  ] : []
  
  const streakMilestones = summary ? [
    { threshold: 3, reached: summary.current_streak_days >= 3, title: 'Getting Started', icon: '🔥' },
    { threshold: 7, reached: summary.current_streak_days >= 7, title: 'Week Warrior', icon: '⚡' },
    { threshold: 30, reached: summary.current_streak_days >= 30, title: 'Monthly Master', icon: '💎' },
    { threshold: 100, reached: summary.current_streak_days >= 100, title: 'Century Club', icon: '👑' },
  ] : []
  
  const taskMilestones = summary ? [
    { threshold: 10, reached: summary.completed_tasks >= 10, title: 'First 10 Tasks', icon: '📚' },
    { threshold: 50, reached: summary.completed_tasks >= 50, title: 'Half Century', icon: '🏆' },
    { threshold: 100, reached: summary.completed_tasks >= 100, title: 'Task Master', icon: '🎯' },
    { threshold: 500, reached: summary.completed_tasks >= 500, title: 'Learning Legend', icon: '🌟' },
  ] : []
  
  const timeMilestones = summary ? [
    { threshold: 10, reached: summary.total_time_spent_minutes >= 600, title: '10 Hours', icon: '⏰' },
    { threshold: 50, reached: summary.total_time_spent_minutes >= 3000, title: '50 Hours', icon: '📖' },
    { threshold: 100, reached: summary.total_time_spent_minutes >= 6000, title: '100 Hours', icon: '🎓' },
    { threshold: 500, reached: summary.total_time_spent_minutes >= 30000, title: '500 Hours', icon: '🧠' },
  ] : []

  // Combine all milestones
  const allMilestones = [
    ...completionMilestones,
    ...streakMilestones,
    ...taskMilestones,
    ...timeMilestones,
  ]

  const milestones = summary ? {
    completionMilestones,
    streakMilestones,
    taskMilestones,
    timeMilestones,
    nextMilestone: allMilestones.find(m => !m.reached),
    recentlyAchieved: allMilestones.filter(m => m.reached).slice(-3),
  } : null

  return {
    milestones,
    isLoading: summaryQuery.isLoading,
    error: summaryQuery.error ? handleQueryError(summaryQuery.error) : null,
  }
}