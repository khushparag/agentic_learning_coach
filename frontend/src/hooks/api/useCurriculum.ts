/**
 * Curriculum API Hooks - React Query hooks for curriculum management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CurriculumService } from '../../services/curriculumService'
import { queryKeys, handleQueryError } from '../../lib/queryClient'
import type {
  CreateCurriculumRequest,
  CurriculumResponse,
  CurriculumStatusResponse,
  CurriculumListResponse,
  ActivateCurriculumRequest,
  BaseResponse,
} from '../../types/api'

/**
 * Hook to get the user's active curriculum
 */
export function useCurriculum() {
  return useQuery({
    queryKey: queryKeys.curriculum.active(),
    queryFn: () => CurriculumService.getCurriculum(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (no active curriculum)
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * Hook to get all curricula for the user
 */
export function useAllCurricula() {
  return useQuery({
    queryKey: queryKeys.curriculum.list(),
    queryFn: () => CurriculumService.getAllCurricula(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get curriculum status summary
 */
export function useCurriculumStatus() {
  return useQuery({
    queryKey: queryKeys.curriculum.status(),
    queryFn: () => CurriculumService.getCurriculumStatus(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

/**
 * Hook to get a specific curriculum by ID
 */
export function useCurriculumById(planId: string | null) {
  return useQuery({
    queryKey: queryKeys.curriculum.byId(planId || ''),
    queryFn: () => CurriculumService.getCurriculumById(planId!),
    enabled: Boolean(planId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to create a new curriculum
 */
export function useCreateCurriculum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateCurriculumRequest) => CurriculumService.createCurriculum(request),
    onSuccess: (data: CurriculumResponse) => {
      // Update curriculum caches
      queryClient.setQueryData(queryKeys.curriculum.active(), data)
      queryClient.setQueryData(queryKeys.curriculum.byId(data.id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.status() })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
    },
    onError: (error) => {
      console.error('Failed to create curriculum:', handleQueryError(error))
    },
  })
}

/**
 * Hook to activate a curriculum
 */
export function useActivateCurriculum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ActivateCurriculumRequest) => CurriculumService.activateCurriculum(request),
    onSuccess: (_, variables) => {
      // Invalidate curriculum queries to refetch updated status
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
      
      // Optimistically update the curriculum status
      queryClient.setQueryData(queryKeys.curriculum.status(), (old: CurriculumStatusResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          has_active_plan: true,
          plan_id: variables.plan_id,
          status: 'active',
        }
      })
    },
    onError: (error) => {
      console.error('Failed to activate curriculum:', handleQueryError(error))
    },
  })
}

/**
 * Hook to pause the active curriculum
 */
export function usePauseCurriculum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => CurriculumService.pauseCurriculum(),
    onSuccess: () => {
      // Invalidate curriculum queries
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.all })
      
      // Optimistically update the curriculum status
      queryClient.setQueryData(queryKeys.curriculum.status(), (old: CurriculumStatusResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          status: 'paused',
        }
      })
    },
    onError: (error) => {
      console.error('Failed to pause curriculum:', handleQueryError(error))
    },
  })
}

/**
 * Hook to delete a curriculum
 */
export function useDeleteCurriculum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId: string) => CurriculumService.deleteCurriculum(planId),
    onSuccess: (_, planId) => {
      // Remove from caches
      queryClient.removeQueries({ queryKey: queryKeys.curriculum.byId(planId) })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.status() })
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.active() })
    },
    onError: (error) => {
      console.error('Failed to delete curriculum:', handleQueryError(error))
    },
  })
}

/**
 * Hook with curriculum utilities and computed values
 */
export function useCurriculumWithUtils() {
  const curriculumQuery = useCurriculum()
  const statusQuery = useCurriculumStatus()
  const createMutation = useCreateCurriculum()
  const activateMutation = useActivateCurriculum()
  const pauseMutation = usePauseCurriculum()
  const deleteMutation = useDeleteCurriculum()

  const curriculum = curriculumQuery.data
  const status = statusQuery.data

  return {
    // Query data and state
    curriculum,
    status,
    isLoading: curriculumQuery.isLoading || statusQuery.isLoading,
    isError: curriculumQuery.isError || statusQuery.isError,
    error: curriculumQuery.error ? handleQueryError(curriculumQuery.error) : 
           statusQuery.error ? handleQueryError(statusQuery.error) : null,
    
    // Mutations
    createCurriculum: createMutation.mutate,
    activateCurriculum: activateMutation.mutate,
    pauseCurriculum: pauseMutation.mutate,
    deleteCurriculum: deleteMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isActivating: activateMutation.isPending,
    isPausing: pauseMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Computed properties
    hasActiveCurriculum: Boolean(status?.has_active_plan),
    progress: curriculum ? CurriculumService.calculateProgress(curriculum) : 0,
    currentModule: curriculum ? CurriculumService.getCurrentModule(curriculum) : null,
    nextTask: curriculum ? CurriculumService.getNextTask(curriculum) : null,
    timeEstimate: curriculum ? CurriculumService.estimateTimeToCompletion(curriculum) : null,
    
    // Utilities
    validateCreateRequest: CurriculumService.validateCreateRequest,
    
    // Refetch functions
    refetch: () => {
      curriculumQuery.refetch()
      statusQuery.refetch()
    },
  }
}