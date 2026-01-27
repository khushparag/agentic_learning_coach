/**
 * Tasks API Hooks - React Query hooks for task management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TasksService } from '../../services/tasksService'
import { queryKeys, handleQueryError } from '../../lib/queryClient'
import type {
  TaskDetailResponse,
  TaskSummaryResponse,
  TodayTasksResponse,
  TaskListResponse,
  TaskHintResponse,
  PaginationParams,
} from '../../types/apiTypes'

/**
 * Hook to get tasks scheduled for today
 */
export function useTodayTasks(dayOffset?: number) {
  return useQuery({
    queryKey: queryKeys.tasks.today(dayOffset),
    queryFn: () => TasksService.getTodayTasks(dayOffset),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

/**
 * Hook to list tasks with filtering
 */
export function useTasks(options: {
  moduleId?: string
  completed?: boolean
  taskType?: string
  pagination?: PaginationParams
} = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(options),
    queryFn: () => TasksService.listTasks(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get detailed information about a specific task
 */
export function useTask(taskId: string | null) {
  return useQuery({
    queryKey: queryKeys.tasks.byId(taskId || ''),
    queryFn: () => TasksService.getTask(taskId!),
    enabled: Boolean(taskId && TasksService.isValidTaskId(taskId)),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get tasks for a specific module
 */
export function useTasksByModule(moduleId: string | null, pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.tasks.byModule(moduleId || ''),
    queryFn: () => TasksService.getTasksByModule(moduleId!, pagination),
    enabled: Boolean(moduleId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get a hint for a task
 */
export function useTaskHint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, hintIndex }: { taskId: string; hintIndex: number }) =>
      TasksService.getTaskHint(taskId, hintIndex),
    onSuccess: (data: TaskHintResponse, variables) => {
      // Cache the hint
      queryClient.setQueryData(
        queryKeys.tasks.hints(variables.taskId, variables.hintIndex),
        data
      )
    },
    onError: (error) => {
      console.error('Failed to get task hint:', handleQueryError(error))
    },
  })
}

/**
 * Hook to get cached hint if available
 */
export function useCachedTaskHint(taskId: string | null, hintIndex: number) {
  return useQuery({
    queryKey: queryKeys.tasks.hints(taskId || '', hintIndex),
    queryFn: () => TasksService.getTaskHint(taskId!, hintIndex),
    enabled: false, // Only fetch manually via mutation
    staleTime: Infinity, // Hints don't change
  })
}

/**
 * Hook with task utilities and computed values
 */
export function useTasksWithUtils() {
  const todayTasksQuery = useTodayTasks()
  const getHintMutation = useTaskHint()

  const todayTasks = todayTasksQuery.data

  return {
    // Query data and state
    todayTasks,
    isLoading: todayTasksQuery.isLoading,
    isError: todayTasksQuery.isError,
    error: todayTasksQuery.error ? handleQueryError(todayTasksQuery.error) : null,
    
    // Mutations
    getHint: getHintMutation.mutate,
    
    // Mutation states
    isGettingHint: getHintMutation.isPending,
    
    // Computed properties
    hasTodayTasks: Boolean(todayTasks?.tasks?.length),
    totalTodayTasks: todayTasks?.total_tasks || 0,
    completedTodayTasks: todayTasks?.completed_tasks || 0,
    remainingTodayTasks: (todayTasks?.total_tasks || 0) - (todayTasks?.completed_tasks || 0),
    todayProgress: todayTasks?.total_tasks 
      ? Math.round((todayTasks.completed_tasks / todayTasks.total_tasks) * 100)
      : 0,
    estimatedTimeToday: todayTasks?.total_estimated_minutes || 0,
    
    // Utilities
    filterByCompletion: (tasks: TaskSummaryResponse[], completed: boolean) =>
      TasksService.filterTasksByCompletion(tasks, completed),
    groupByModule: (tasks: TaskSummaryResponse[]) =>
      TasksService.groupTasksByModule(tasks),
    calculateTotalTime: (tasks: TaskSummaryResponse[]) =>
      TasksService.calculateTotalTime(tasks),
    getTaskDifficulty: (task: TaskDetailResponse) =>
      TasksService.getTaskDifficulty(task),
    getTaskPriority: (task: TaskSummaryResponse) =>
      TasksService.getTaskPriority(task),
    sortByPriority: (tasks: TaskSummaryResponse[]) =>
      TasksService.sortTasksByPriority(tasks),
    getProgressMessage: (tasks: TodayTasksResponse) =>
      TasksService.getProgressMessage(tasks),
    
    // Refetch function
    refetch: todayTasksQuery.refetch,
  }
}

/**
 * Hook for task management with optimistic updates
 */
export function useTaskManagement() {
  const queryClient = useQueryClient()

  const markTaskCompleted = (taskId: string) => {
    // Optimistically update task completion
    queryClient.setQueryData(queryKeys.tasks.byId(taskId), (old: TaskDetailResponse | undefined) => {
      if (!old) return old
      return { ...old, is_completed: true }
    })

    // Update today's tasks
    queryClient.setQueryData(queryKeys.tasks.today(), (old: TodayTasksResponse | undefined) => {
      if (!old) return old
      
      const updatedTasks = old.tasks.map(task =>
        task.id === taskId ? { ...task, is_completed: true } : task
      )
      
      const newCompletedCount = updatedTasks.filter(task => task.is_completed).length
      
      return {
        ...old,
        tasks: updatedTasks,
        completed_tasks: newCompletedCount,
        progress_message: TasksService.getProgressMessage({
          ...old,
          completed_tasks: newCompletedCount,
        }),
      }
    })

    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.gamification.all })
  }

  const markTaskIncomplete = (taskId: string) => {
    // Optimistically update task completion
    queryClient.setQueryData(queryKeys.tasks.byId(taskId), (old: TaskDetailResponse | undefined) => {
      if (!old) return old
      return { ...old, is_completed: false }
    })

    // Update today's tasks
    queryClient.setQueryData(queryKeys.tasks.today(), (old: TodayTasksResponse | undefined) => {
      if (!old) return old
      
      const updatedTasks = old.tasks.map(task =>
        task.id === taskId ? { ...task, is_completed: false } : task
      )
      
      const newCompletedCount = updatedTasks.filter(task => task.is_completed).length
      
      return {
        ...old,
        tasks: updatedTasks,
        completed_tasks: newCompletedCount,
        progress_message: TasksService.getProgressMessage({
          ...old,
          completed_tasks: newCompletedCount,
        }),
      }
    })
  }

  return {
    markTaskCompleted,
    markTaskIncomplete,
  }
}

/**
 * Hook for task filtering and search
 */
export function useTaskFilters() {
  const getFilteredTasks = (
    tasks: TaskSummaryResponse[],
    filters: {
      completed?: boolean
      taskType?: string
      moduleId?: string
      difficulty?: 'easy' | 'medium' | 'hard'
      priority?: 'high' | 'medium' | 'low'
      search?: string
    }
  ) => {
    let filtered = [...tasks]

    if (filters.completed !== undefined) {
      filtered = filtered.filter(task => task.is_completed === filters.completed)
    }

    if (filters.taskType) {
      filtered = filtered.filter(task => task.task_type === filters.taskType)
    }

    if (filters.moduleId) {
      filtered = filtered.filter(task => task.module_id === filters.moduleId)
    }

    if (filters.priority) {
      filtered = filtered.filter(task => 
        TasksService.getTaskPriority(task) === filters.priority
      )
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(task =>
        task.description.toLowerCase().includes(searchLower) ||
        task.module_title.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }

  const getSortedTasks = (
    tasks: TaskSummaryResponse[],
    sortBy: 'priority' | 'difficulty' | 'time' | 'module' | 'completion'
  ) => {
    const sorted = [...tasks]

    switch (sortBy) {
      case 'priority':
        return TasksService.sortTasksByPriority(sorted)
      
      case 'time':
        return sorted.sort((a, b) => a.estimated_minutes - b.estimated_minutes)
      
      case 'module':
        return sorted.sort((a, b) => a.module_title.localeCompare(b.module_title))
      
      case 'completion':
        return sorted.sort((a, b) => {
          if (a.is_completed === b.is_completed) return 0
          return a.is_completed ? 1 : -1
        })
      
      default:
        return sorted
    }
  }

  return {
    getFilteredTasks,
    getSortedTasks,
  }
}
