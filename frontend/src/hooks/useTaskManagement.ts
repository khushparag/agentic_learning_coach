/**
 * Task Management Hook - Comprehensive task management with real-time updates
 * Follows clean architecture principles with proper separation of concerns
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TasksService } from '../services/tasksService'
import { useProgressWebSocket } from './useProgressWebSocket'
import { queryKeys, handleQueryError } from '../lib/queryClient'
import type { TodayTask } from '../types/dashboard'
import type { TaskSummaryResponse } from '../types/api'

// Domain interfaces following SOLID principles
interface TaskFilter {
  status: 'all' | 'not_started' | 'in_progress' | 'completed'
  priority: 'all' | 'high' | 'medium' | 'low'
  type: 'all' | 'exercise' | 'reading' | 'project' | 'quiz'
  difficulty: 'all' | 'easy' | 'medium' | 'hard'
  dueDate: 'all' | 'overdue' | 'today' | 'tomorrow' | 'this_week'
  search: string
  timeRange: [number, number]
  bookmarked: boolean
  module?: string
}

interface TaskSort {
  field: 'priority' | 'dueDate' | 'estimatedMinutes' | 'title' | 'status' | 'type'
  direction: 'asc' | 'desc'
}

interface TaskStats {
  total: number
  completed: number
  inProgress: number
  notStarted: number
  overdue: number
  totalTime: number
  averageTime: number
  completionRate: number
  priorityBreakdown: Record<string, number>
  typeBreakdown: Record<string, number>
}

interface TaskManagementState {
  filter: TaskFilter
  sort: TaskSort
  viewMode: 'list' | 'grid' | 'kanban'
  bookmarkedTasks: Set<string>
  selectedTask: TodayTask | null
}

interface TaskManagementActions {
  setFilter: (filter: Partial<TaskFilter>) => void
  setSort: (sort: TaskSort) => void
  setViewMode: (mode: 'list' | 'grid' | 'kanban') => void
  toggleBookmark: (taskId: string) => void
  selectTask: (task: TodayTask | null) => void
  resetFilters: () => void
  startTask: (taskId: string) => Promise<void>
  pauseTask: (taskId: string) => Promise<void>
  completeTask: (taskId: string) => Promise<void>
  refreshTasks: () => Promise<void>
}

interface TaskManagementResult {
  // Data
  tasks: TodayTask[]
  filteredTasks: TodayTask[]
  taskStats: TaskStats
  
  // State
  state: TaskManagementState
  
  // Actions
  actions: TaskManagementActions
  
  // Status
  isLoading: boolean
  isError: boolean
  error: string | null
  isConnected: boolean
  lastUpdate: Date | null
}

// Task filtering service following Single Responsibility Principle
class TaskFilterService {
  static filterTasks(tasks: TodayTask[], filter: TaskFilter, bookmarkedTasks: Set<string>): TodayTask[] {
    return tasks.filter(task => {
      // Status filter
      if (filter.status !== 'all' && task.status !== filter.status) return false
      
      // Priority filter
      if (filter.priority !== 'all' && task.priority !== filter.priority) return false
      
      // Type filter
      if (filter.type !== 'all' && task.type !== filter.type) return false
      
      // Difficulty filter
      if (filter.difficulty !== 'all') {
        const difficulty = this.calculateDifficulty(task.estimatedMinutes)
        if (difficulty !== filter.difficulty) return false
      }
      
      // Time range filter
      const [min, max] = filter.timeRange
      if (task.estimatedMinutes < min || task.estimatedMinutes > max) return false
      
      // Due date filter
      if (filter.dueDate !== 'all' && !this.matchesDueDateFilter(task, filter.dueDate)) return false
      
      // Module filter
      if (filter.module && task.moduleId !== filter.module) return false
      
      // Bookmarked filter
      if (filter.bookmarked && !bookmarkedTasks.has(task.id)) return false
      
      // Search filter
      if (filter.search && !this.matchesSearch(task, filter.search)) return false

      return true
    })
  }

  private static calculateDifficulty(estimatedMinutes: number): 'easy' | 'medium' | 'hard' {
    if (estimatedMinutes <= 30) return 'easy'
    if (estimatedMinutes <= 60) return 'medium'
    return 'hard'
  }

  private static matchesDueDateFilter(task: TodayTask, dueDateFilter: string): boolean {
    const now = new Date()
    const taskDue = task.dueDate ? new Date(task.dueDate) : null
    
    switch (dueDateFilter) {
      case 'overdue':
        return taskDue !== null && taskDue < now && task.status !== 'completed'
      case 'today':
        return taskDue !== null && taskDue.toDateString() === now.toDateString()
      case 'tomorrow':
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return taskDue !== null && taskDue.toDateString() === tomorrow.toDateString()
      case 'this_week':
        if (!taskDue) return false
        const weekFromNow = new Date(now)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return taskDue <= weekFromNow
      default:
        return true
    }
  }

  private static matchesSearch(task: TodayTask, search: string): boolean {
    const searchLower = search.toLowerCase()
    const searchableText = [
      task.title,
      task.description,
      task.moduleName,
      task.type,
      task.priority
    ].join(' ').toLowerCase()
    
    return searchableText.includes(searchLower)
  }
}

// Task sorting service following Single Responsibility Principle
class TaskSortService {
  static sortTasks(tasks: TodayTask[], sort: TaskSort): TodayTask[] {
    return [...tasks].sort((a, b) => {
      let comparison = 0

      switch (sort.field) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          comparison = aDate - bDate
          break
        case 'estimatedMinutes':
          comparison = a.estimatedMinutes - b.estimatedMinutes
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'status':
          const statusOrder = { not_started: 1, in_progress: 2, completed: 3 }
          comparison = statusOrder[a.status] - statusOrder[b.status]
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }

      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
}

// Task statistics service following Single Responsibility Principle
class TaskStatsService {
  static calculateStats(tasks: TodayTask[]): TaskStats {
    const stats: TaskStats = {
      total: tasks.length,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
      totalTime: 0,
      averageTime: 0,
      completionRate: 0,
      priorityBreakdown: { high: 0, medium: 0, low: 0 },
      typeBreakdown: { exercise: 0, reading: 0, project: 0, quiz: 0 }
    }

    const now = new Date()
    
    tasks.forEach(task => {
      // Status breakdown
      switch (task.status) {
        case 'completed':
          stats.completed++
          break
        case 'in_progress':
          stats.inProgress++
          break
        case 'not_started':
          stats.notStarted++
          break
      }

      // Priority breakdown
      stats.priorityBreakdown[task.priority]++

      // Type breakdown
      stats.typeBreakdown[task.type]++

      // Time calculations
      stats.totalTime += task.estimatedMinutes

      // Overdue check
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed') {
        stats.overdue++
      }
    })

    stats.averageTime = stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0
    stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    return stats
  }
}

/**
 * Main task management hook
 * Follows clean architecture with proper separation of concerns
 */
export function useTaskManagement(userId?: string, moduleId?: string): TaskManagementResult {
  const queryClient = useQueryClient()
  
  // State management
  const [state, setState] = useState<TaskManagementState>({
    filter: {
      status: 'all',
      priority: 'all',
      type: 'all',
      difficulty: 'all',
      dueDate: 'all',
      search: '',
      timeRange: [0, 300],
      bookmarked: false,
      module: moduleId
    },
    sort: { field: 'priority', direction: 'desc' },
    viewMode: 'list',
    bookmarkedTasks: new Set(),
    selectedTask: null
  })

  // API queries
  const { data: todayTasks, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.tasks.today(),
    queryFn: () => TasksService.getTodayTasks(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Real-time updates
  const { isConnected, lastMessage } = useProgressWebSocket({ userId: userId || 'current-user' })

  // Transform API response to TodayTask format
  const transformTaskSummaryToTodayTask = useCallback((task: TaskSummaryResponse): TodayTask => ({
    id: task.id,
    title: task.description, // Use description as title since TaskSummaryResponse doesn't have title
    description: task.description,
    type: task.task_type.toLowerCase() as TodayTask['type'],
    priority: TasksService.getTaskPriority(task),
    estimatedMinutes: task.estimated_minutes,
    status: task.is_completed ? 'completed' : 'not_started',
    moduleId: task.module_id,
    moduleName: task.module_title,
    dueDate: undefined // TaskSummaryResponse doesn't have dueDate
  }), [])

  // Task mutations following Command pattern
  const startTaskMutation = useMutation({
    mutationFn: (taskId: string) => TasksService.updateTaskStatus(taskId, 'in_progress'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
    },
    onError: (error) => console.error('Failed to start task:', handleQueryError(error))
  })

  const pauseTaskMutation = useMutation({
    mutationFn: (taskId: string) => TasksService.updateTaskStatus(taskId, 'not_started'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
    },
    onError: (error) => console.error('Failed to pause task:', handleQueryError(error))
  })

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => TasksService.updateTaskStatus(taskId, 'completed'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.gamification.all })
    },
    onError: (error) => console.error('Failed to complete task:', handleQueryError(error))
  })

  // Mock tasks for demonstration (replace with actual API data)
  const mockTasks: TodayTask[] = [
    {
      id: '1',
      title: 'Complete React Hooks Exercise',
      description: 'Build a counter component using useState and useEffect hooks',
      type: 'exercise',
      priority: 'high',
      estimatedMinutes: 45,
      status: 'not_started',
      moduleId: 'react-basics',
      moduleName: 'React Fundamentals',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'Read TypeScript Documentation',
      description: 'Study advanced TypeScript features and best practices',
      type: 'reading',
      priority: 'medium',
      estimatedMinutes: 30,
      status: 'in_progress',
      moduleId: 'typescript-advanced',
      moduleName: 'Advanced TypeScript',
      dueDate: new Date()
    },
    {
      id: '3',
      title: 'Build Todo App Project',
      description: 'Create a full-stack todo application with React and Node.js',
      type: 'project',
      priority: 'high',
      estimatedMinutes: 120,
      status: 'not_started',
      moduleId: 'fullstack-project',
      moduleName: 'Full Stack Development'
    },
    {
      id: '4',
      title: 'JavaScript Fundamentals Quiz',
      description: 'Test your knowledge of JavaScript basics and ES6 features',
      type: 'quiz',
      priority: 'low',
      estimatedMinutes: 15,
      status: 'completed',
      moduleId: 'javascript-basics',
      moduleName: 'JavaScript Fundamentals',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ]

  // Transform API tasks or use mock data
  const tasks: TodayTask[] = useMemo(() => {
    if (todayTasks?.tasks && todayTasks.tasks.length > 0) {
      return todayTasks.tasks.map(transformTaskSummaryToTodayTask)
    }
    return mockTasks
  }, [todayTasks, transformTaskSummaryToTodayTask])

  // Computed values using service classes
  const filteredTasks = useMemo(() => {
    const filtered = TaskFilterService.filterTasks(tasks, state.filter, state.bookmarkedTasks)
    return TaskSortService.sortTasks(filtered, state.sort)
  }, [tasks, state.filter, state.sort, state.bookmarkedTasks])

  const taskStats = useMemo(() => {
    return TaskStatsService.calculateStats(tasks)
  }, [tasks])

  // Actions following Command pattern
  const actions: TaskManagementActions = {
    setFilter: useCallback((newFilter: Partial<TaskFilter>) => {
      setState(prev => ({
        ...prev,
        filter: { ...prev.filter, ...newFilter }
      }))
    }, []),

    setSort: useCallback((sort: TaskSort) => {
      setState(prev => ({ ...prev, sort }))
    }, []),

    setViewMode: useCallback((viewMode: 'list' | 'grid' | 'kanban') => {
      setState(prev => ({ ...prev, viewMode }))
    }, []),

    toggleBookmark: useCallback((taskId: string) => {
      setState(prev => {
        const newBookmarksSet = new Set(prev.bookmarkedTasks)
        if (newBookmarksSet.has(taskId)) {
          newBookmarksSet.delete(taskId)
        } else {
          newBookmarksSet.add(taskId)
        }
        return { ...prev, bookmarkedTasks: newBookmarksSet }
      })
    }, []),

    selectTask: useCallback((task: TodayTask | null) => {
      setState(prev => ({ ...prev, selectedTask: task }))
    }, []),

    resetFilters: useCallback(() => {
      setState(prev => ({
        ...prev,
        filter: {
          status: 'all',
          priority: 'all',
          type: 'all',
          difficulty: 'all',
          dueDate: 'all',
          search: '',
          timeRange: [0, 300],
          bookmarked: false,
          module: moduleId
        },
        sort: { field: 'priority', direction: 'desc' }
      }))
    }, [moduleId]),

    startTask: useCallback(async (taskId: string) => {
      await startTaskMutation.mutateAsync(taskId)
    }, [startTaskMutation]),

    pauseTask: useCallback(async (taskId: string) => {
      await pauseTaskMutation.mutateAsync(taskId)
    }, [pauseTaskMutation]),

    completeTask: useCallback(async (taskId: string) => {
      await completeTaskMutation.mutateAsync(taskId)
    }, [completeTaskMutation]),

    refreshTasks: useCallback(async () => {
      await refetch()
    }, [refetch])
  }

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage && (lastMessage.type === 'task_completed' || lastMessage.type === 'progress_update')) {
      refetch()
    }
  }, [lastMessage, refetch])

  return {
    // Data
    tasks,
    filteredTasks,
    taskStats,
    
    // State
    state,
    
    // Actions
    actions,
    
    // Status
    isLoading,
    isError: !!error,
    error: error ? handleQueryError(error) : null,
    isConnected,
    lastUpdate: lastMessage ? new Date(lastMessage.timestamp) : null
  }
}

export default useTaskManagement