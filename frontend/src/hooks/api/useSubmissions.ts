/**
 * Submissions API Hooks - React Query hooks for code submission and evaluation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SubmissionsService } from '../../services/submissionsService'
import { queryKeys, handleQueryError, optimisticUpdates } from '../../lib/queryClient'
import type {
  SubmitCodeRequest,
  EvaluationResponse,
  SubmissionResponse,
  SubmissionListResponse,
  FeedbackResponse,
  PaginationParams,
} from '../../types/api'

/**
 * Hook to submit code for evaluation
 */
export function useSubmitCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: SubmitCodeRequest) => SubmissionsService.submitCode(request),
    onSuccess: (data: EvaluationResponse, variables) => {
      // Cache the evaluation result
      queryClient.setQueryData(queryKeys.submissions.byId(data.submission_id), data)
      
      // Invalidate submissions list to include new submission
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.byTask(variables.task_id) })
      
      // If task was completed, update task and progress caches
      if (data.passed) {
        // Mark task as completed optimistically
        queryClient.setQueryData(queryKeys.tasks.byId(variables.task_id), (old: any) => {
          if (!old) return old
          return { ...old, is_completed: true, best_score: data.score }
        })
        
        // Update today's tasks
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.today() })
        
        // Update progress
        queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
        
        // Award XP optimistically
        const userId = sessionStorage.getItem('demo_user_id') || 'demo-user'
        const xpAmount = data.score >= 90 ? 150 : data.score >= 70 ? 100 : 50
        optimisticUpdates.awardXP(userId, xpAmount)
      }
    },
    onError: (error) => {
      console.error('Failed to submit code:', handleQueryError(error))
    },
  })
}

/**
 * Hook to list user's submissions
 */
export function useSubmissions(options: {
  taskId?: string
  statusFilter?: string
  pagination?: PaginationParams
} = {}) {
  return useQuery({
    queryKey: queryKeys.submissions.list(options),
    queryFn: () => SubmissionsService.listSubmissions(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get detailed submission and evaluation results
 */
export function useSubmission(submissionId: string | null) {
  return useQuery({
    queryKey: queryKeys.submissions.byId(submissionId || ''),
    queryFn: () => SubmissionsService.getSubmission(submissionId!),
    enabled: Boolean(submissionId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get detailed feedback for a submission
 */
export function useSubmissionFeedback(submissionId: string | null) {
  return useQuery({
    queryKey: queryKeys.submissions.feedback(submissionId || ''),
    queryFn: () => SubmissionsService.getSubmissionFeedback(submissionId!),
    enabled: Boolean(submissionId),
    staleTime: 15 * 60 * 1000, // 15 minutes (feedback doesn't change)
  })
}

/**
 * Hook to get submission history for a specific task
 */
export function useTaskSubmissionHistory(taskId: string | null, pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.submissions.byTask(taskId || ''),
    queryFn: () => SubmissionsService.getTaskSubmissionHistory(taskId!, pagination),
    enabled: Boolean(taskId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook with submission utilities and computed values
 */
export function useSubmissionsWithUtils() {
  const submitCodeMutation = useSubmitCode()

  return {
    // Mutations
    submitCode: submitCodeMutation.mutate,
    
    // Mutation states
    isSubmitting: submitCodeMutation.isPending,
    submissionError: submitCodeMutation.error ? handleQueryError(submitCodeMutation.error) : null,
    lastSubmissionResult: submitCodeMutation.data,
    
    // Utilities
    validateSubmission: SubmissionsService.validateSubmission,
    getStatusColor: SubmissionsService.getStatusColor,
    getStatusIcon: SubmissionsService.getStatusIcon,
    calculateOverallScore: SubmissionsService.calculateOverallScore,
    getPerformanceRating: SubmissionsService.getPerformanceRating,
    formatExecutionTime: SubmissionsService.formatExecutionTime,
    getQualitySummary: SubmissionsService.getQualitySummary,
    canRetry: SubmissionsService.canRetry,
    getNextSteps: SubmissionsService.getNextSteps,
    
    // Reset mutation state
    reset: submitCodeMutation.reset,
  }
}

/**
 * Hook for submission analysis and insights
 */
export function useSubmissionAnalysis(submissions: SubmissionResponse[]) {
  const analysis = {
    totalSubmissions: submissions.length,
    passedSubmissions: submissions.filter(s => s.status === 'PASS').length,
    failedSubmissions: submissions.filter(s => s.status === 'FAIL').length,
    averageScore: submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
      : 0,
    
    // Success rate
    successRate: submissions.length > 0 
      ? (submissions.filter(s => s.status === 'PASS').length / submissions.length) * 100
      : 0,
    
    // Recent performance (last 5 submissions)
    recentPerformance: submissions
      .slice(-5)
      .map(s => ({ score: s.score || 0, status: s.status })),
    
    // Performance trend
    performanceTrend: (() => {
      if (submissions.length < 2) return 'stable'
      
      const recent = submissions.slice(-3).map(s => s.score || 0)
      const older = submissions.slice(-6, -3).map(s => s.score || 0)
      
      if (recent.length === 0 || older.length === 0) return 'stable'
      
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
      
      if (recentAvg > olderAvg + 5) return 'improving'
      if (recentAvg < olderAvg - 5) return 'declining'
      return 'stable'
    })(),
    
    // Most common issues (would need more detailed data in real implementation)
    commonIssues: [
      'Syntax errors',
      'Logic errors',
      'Edge case handling',
      'Performance optimization',
    ],
    
    // Recommendations based on performance
    recommendations: (() => {
      const recommendations: string[] = []
      const successRate = submissions.length > 0 
        ? (submissions.filter(s => s.status === 'PASS').length / submissions.length) * 100
        : 0
      
      if (successRate < 50) {
        recommendations.push('Review fundamental concepts before attempting exercises')
        recommendations.push('Use hints more frequently to understand problem-solving approaches')
      } else if (successRate < 80) {
        recommendations.push('Focus on edge case testing and error handling')
        recommendations.push('Review failed submissions to identify common patterns')
      } else {
        recommendations.push('Great job! Consider tackling more challenging exercises')
        recommendations.push('Help others by sharing your solutions')
      }
      
      return recommendations
    })(),
  }

  return analysis
}

/**
 * Hook for code submission workflow management
 */
export function useSubmissionWorkflow() {
  const queryClient = useQueryClient()
  const submitMutation = useSubmitCode()

  const submitWithWorkflow = async (
    request: SubmitCodeRequest,
    options?: {
      onValidationError?: (errors: string[]) => void
      onSubmissionStart?: () => void
      onSubmissionSuccess?: (result: EvaluationResponse) => void
      onSubmissionError?: (error: string) => void
    }
  ) => {
    // Validate submission
    const validation = SubmissionsService.validateSubmission(request)
    if (!validation.valid) {
      options?.onValidationError?.(validation.errors)
      return
    }

    options?.onSubmissionStart?.()

    try {
      const result = await submitMutation.mutateAsync(request)
      options?.onSubmissionSuccess?.(result)
      return result
    } catch (error) {
      const errorMessage = handleQueryError(error)
      options?.onSubmissionError?.(errorMessage)
      throw error
    }
  }

  const retrySubmission = (originalRequest: SubmitCodeRequest, newCode: string) => {
    return submitWithWorkflow({
      ...originalRequest,
      code: newCode,
    })
  }

  return {
    submitWithWorkflow,
    retrySubmission,
    isSubmitting: submitMutation.isPending,
    lastResult: submitMutation.data,
    error: submitMutation.error ? handleQueryError(submitMutation.error) : null,
    reset: submitMutation.reset,
  }
}

/**
 * Hook for submission statistics and progress tracking
 */
export function useSubmissionStats(taskId?: string) {
  const submissionsQuery = useSubmissions({ taskId })
  const submissions = submissionsQuery.data?.items || []

  const stats = {
    // Basic counts
    totalAttempts: submissions.length,
    successfulAttempts: submissions.filter(s => s.status === 'PASS').length,
    
    // Performance metrics
    bestScore: Math.max(...submissions.map(s => s.score || 0), 0),
    averageScore: submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
      : 0,
    
    // Time analysis
    firstAttemptTime: submissions[0]?.submitted_at,
    lastAttemptTime: submissions[submissions.length - 1]?.submitted_at,
    
    // Success metrics
    firstAttemptSuccess: submissions.length > 0 && submissions[0].status === 'PASS',
    attemptsToSuccess: (() => {
      const successIndex = submissions.findIndex(s => s.status === 'PASS')
      return successIndex >= 0 ? successIndex + 1 : null
    })(),
    
    // Improvement tracking
    showingImprovement: (() => {
      if (submissions.length < 2) return false
      const scores = submissions.map(s => s.score || 0)
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
      const secondHalf = scores.slice(Math.floor(scores.length / 2))
      
      if (firstHalf.length === 0 || secondHalf.length === 0) return false
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      
      return secondAvg > firstAvg
    })(),
  }

  return {
    ...stats,
    isLoading: submissionsQuery.isLoading,
    error: submissionsQuery.error ? handleQueryError(submissionsQuery.error) : null,
    refetch: submissionsQuery.refetch,
  }
}