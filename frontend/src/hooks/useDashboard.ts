import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import { DashboardStats, TodayTask, ProgressMetrics, TaskFilter, TaskSort } from '../types/dashboard'

interface UseDashboardReturn {
  // Data
  stats: DashboardStats | undefined
  todayTasks: TodayTask[]
  progressMetrics: ProgressMetrics | undefined
  
  // Loading states
  isLoadingStats: boolean
  isLoadingTasks: boolean
  isLoadingMetrics: boolean
  
  // Error states
  statsError: Error | null
  tasksError: Error | null
  metricsError: Error | null
  
  // Actions
  updateTaskStatus: (taskId: string, status: 'not_started' | 'in_progress' | 'completed') => Promise<void>
  refreshDashboard: () => void
  
  // Filters and sorting
  taskFilter: TaskFilter
  taskSort: TaskSort
  setTaskFilter: (filter: TaskFilter) => void
  setTaskSort: (sort: TaskSort) => void
  filteredTasks: TodayTask[]
}

export function useDashboard(): UseDashboardReturn {
  const queryClient = useQueryClient()
  
  // State for filters and sorting
  const [taskFilter, setTaskFilter] = useState<TaskFilter>({
    status: 'all',
    priority: 'all',
    type: 'all'
  })
  
  const [taskSort, setTaskSort] = useState<TaskSort>({
    field: 'priority',
    direction: 'desc'
  })

  // Queries
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })

  const {
    data: todayTasksData,
    isLoading: isLoadingTasks,
    error: tasksError
  } = useQuery({
    queryKey: ['dashboard', 'tasks', 'today'],
    queryFn: dashboardService.getTodayTasks,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  // Ensure todayTasks is always an array even if API returns non-array
  const todayTasks = Array.isArray(todayTasksData) ? todayTasksData : []

  const {
    data: progressMetrics,
    isLoading: isLoadingMetrics,
    error: metricsError
  } = useQuery({
    queryKey: ['dashboard', 'metrics', '30d'],
    queryFn: () => dashboardService.getProgressMetrics('30d'),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  })

  // Mutations
  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: 'not_started' | 'in_progress' | 'completed' }) =>
      dashboardService.updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'tasks', 'today'] })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<TodayTask[]>(['dashboard', 'tasks', 'today'])

      // Optimistically update to the new value
      if (previousTasks) {
        const updatedTasks = previousTasks.map(task =>
          task.id === taskId ? { ...task, status } : task
        )
        queryClient.setQueryData(['dashboard', 'tasks', 'today'], updatedTasks)
      }

      // Return a context object with the snapshotted value
      return { previousTasks }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['dashboard', 'tasks', 'today'], context.previousTasks)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'tasks', 'today'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
    },
  })

  // Actions
  const updateTaskStatus = useCallback(async (taskId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    try {
      await updateTaskStatusMutation.mutateAsync({ taskId, status })
    } catch (error) {
      console.error('Failed to update task status:', error)
      throw error
    }
  }, [updateTaskStatusMutation])

  const refreshDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }, [queryClient])

  // Filtered and sorted tasks
  const filteredTasks = useCallback(() => {
    let filtered = todayTasks.filter(task => {
      if (taskFilter.status && taskFilter.status !== 'all' && task.status !== taskFilter.status) return false
      if (taskFilter.priority && taskFilter.priority !== 'all' && task.priority !== taskFilter.priority) return false
      if (taskFilter.type && taskFilter.type !== 'all' && task.type !== taskFilter.type) return false
      if (taskFilter.module && task.moduleId !== taskFilter.module) return false
      return true
    })

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: any = a[taskSort.field]
      let bValue: any = b[taskSort.field]

      if (taskSort.field === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        aValue = priorityOrder[a.priority]
        bValue = priorityOrder[b.priority]
      } else if (taskSort.field === 'dueDate') {
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      }

      if (taskSort.direction === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [todayTasks, taskFilter, taskSort])()

  // WebSocket connection for real-time updates (placeholder)
  useEffect(() => {
    // TODO: Implement WebSocket connection for real-time updates
    // const ws = new WebSocket('ws://localhost:8000/ws/dashboard')
    // 
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data)
    //   if (data.type === 'task_update') {
    //     queryClient.invalidateQueries({ queryKey: ['dashboard', 'tasks'] })
    //   } else if (data.type === 'stats_update') {
    //     queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
    //   }
    // }
    // 
    // return () => {
    //   ws.close()
    // }
  }, [queryClient])

  return {
    // Data
    stats,
    todayTasks,
    progressMetrics,
    
    // Loading states
    isLoadingStats,
    isLoadingTasks,
    isLoadingMetrics,
    
    // Error states
    statsError: statsError as Error | null,
    tasksError: tasksError as Error | null,
    metricsError: metricsError as Error | null,
    
    // Actions
    updateTaskStatus,
    refreshDashboard,
    
    // Filters and sorting
    taskFilter,
    taskSort,
    setTaskFilter,
    setTaskSort,
    filteredTasks
  }
}