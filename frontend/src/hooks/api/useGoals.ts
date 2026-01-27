/**
 * Goals API Hooks - React Query hooks for goals management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GoalsService } from '../../services/goalsService'
import { queryKeys, handleQueryError } from '../../lib/queryClient'
import type {
  SetGoalsRequest,
  SetGoalsResponse,
  UpdateGoalsRequest,
  BaseResponse,
} from '../../types/api'

/**
 * Hook to get current learning goals
 */
export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals.current(),
    queryFn: () => GoalsService.getGoals(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (no goals set yet)
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * Hook to set learning goals
 */
export function useSetGoals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: SetGoalsRequest) => GoalsService.setGoals(request),
    onSuccess: (data: SetGoalsResponse) => {
      // Update the goals cache
      queryClient.setQueryData(queryKeys.goals.current(), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
    },
    onError: (error) => {
      console.error('Failed to set goals:', handleQueryError(error))
    },
  })
}

/**
 * Hook to update existing goals
 */
export function useUpdateGoals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateGoalsRequest) => GoalsService.updateGoals(request),
    onSuccess: (data: SetGoalsResponse) => {
      // Update the goals cache
      queryClient.setQueryData(queryKeys.goals.current(), data)
      
      // Invalidate related queries that might be affected by goal changes
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
    },
    onError: (error) => {
      console.error('Failed to update goals:', handleQueryError(error))
    },
  })
}

/**
 * Hook to clear all goals
 */
export function useClearGoals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => GoalsService.clearGoals(),
    onSuccess: () => {
      // Remove goals from cache
      queryClient.removeQueries({ queryKey: queryKeys.goals.all })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
    },
    onError: (error) => {
      console.error('Failed to clear goals:', handleQueryError(error))
    },
  })
}

/**
 * Hook to validate goals before setting them
 */
export function useValidateGoals() {
  return {
    validate: (goals: string[]) => GoalsService.validateGoals(goals),
    getSuggestions: () => GoalsService.getSuggestedGoals(),
    estimateTimeline: (
      goals: string[],
      hoursPerWeek: number,
      skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner'
    ) => GoalsService.estimateTimeline(goals, hoursPerWeek, skillLevel),
  }
}

/**
 * Hook to get goals with additional utilities
 */
export function useGoalsWithUtils() {
  const goalsQuery = useGoals()
  const setGoalsMutation = useSetGoals()
  const updateGoalsMutation = useUpdateGoals()
  const clearGoalsMutation = useClearGoals()
  const validator = useValidateGoals()

  return {
    // Query data and state
    goals: goalsQuery.data,
    isLoading: goalsQuery.isLoading,
    isError: goalsQuery.isError,
    error: goalsQuery.error ? handleQueryError(goalsQuery.error) : null,
    
    // Mutations
    setGoals: setGoalsMutation.mutate,
    updateGoals: updateGoalsMutation.mutate,
    clearGoals: clearGoalsMutation.mutate,
    
    // Mutation states
    isSettingGoals: setGoalsMutation.isPending,
    isUpdatingGoals: updateGoalsMutation.isPending,
    isClearingGoals: clearGoalsMutation.isPending,
    
    // Utilities
    validateGoals: validator.validate,
    getSuggestedGoals: validator.getSuggestions,
    estimateTimeline: validator.estimateTimeline,
    
    // Computed properties
    hasGoals: Boolean(goalsQuery.data?.goals?.length),
    goalCount: goalsQuery.data?.goals?.length || 0,
    
    // Refetch function
    refetch: goalsQuery.refetch,
  }
}