import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  TagIcon,
  ArrowsUpDownIcon,
  BookmarkIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  PlusIcon,
  BellIcon,
  FireIcon,
  TrophyIcon,
  UserGroupIcon,
  BoltIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  CodeBracketIcon,
  BookOpenIcon,
  CubeIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { useTodayTasks } from '../../hooks/api/useTasks'
import { useProgressWebSocket } from '../../hooks/useProgressWebSocket'
import TaskManagement from '../dashboard/TaskManagement'
import TaskDetailModal from '../dashboard/TaskDetailModal'
import { TodayTask } from '../../types/dashboard'
import type { TaskSummaryResponse } from '../../types/apiTypes'
import { TasksService } from '../../services/tasksService'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface TaskManagementInterfaceProps {
  userId?: string
  moduleId?: string
  showHeader?: boolean
  enableRealTimeUpdates?: boolean
  onTaskComplete?: (taskId: string) => void
  onTaskStart?: (taskId: string) => void
}

interface ExtendedTaskFilter {
  status: 'all' | 'not_started' | 'in_progress' | 'completed'
  priority: 'all' | 'high' | 'medium' | 'low'
  type: 'all' | 'exercise' | 'reading' | 'project' | 'quiz'
  difficulty: 'all' | 'easy' | 'medium' | 'hard'
  dueDate: 'all' | 'overdue' | 'today' | 'tomorrow' | 'this_week'
  search: string
  tags: string[]
  timeRange: [number, number]
  bookmarked: boolean
  module?: string
}

interface TaskSort {
  field: 'priority' | 'dueDate' | 'estimatedMinutes' | 'title' | 'status' | 'type' | 'difficulty'
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
  difficultyBreakdown: Record<string, number>
}

const TaskManagementInterface: React.FC<TaskManagementInterfaceProps> = ({
  userId = 'current-user',
  moduleId,
  showHeader = true,
  enableRealTimeUpdates = true,
  onTaskComplete,
  onTaskStart
}) => {
  // State management
  const [filter, setFilter] = useState<ExtendedTaskFilter>({
    status: 'all',
    priority: 'all',
    type: 'all',
    difficulty: 'all',
    dueDate: 'all',
    search: '',
    tags: [],
    timeRange: [0, 300],
    bookmarked: false,
    module: moduleId
  })

  const [sort, setSort] = useState<TaskSort>({
    field: 'priority',
    direction: 'desc'
  })

  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('list')
  const [selectedTask, setSelectedTask] = useState<TodayTask | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [bookmarkedTasks, setBookmarkedTasks] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // API hooks
  const { data: todayTasks, isLoading, error, refetch } = useTodayTasks()
  const { isConnected, lastMessage } = useProgressWebSocket({ userId })

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
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
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
      dueDate: new Date() // Today
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
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    },
    {
      id: '5',
      title: 'CSS Grid Layout Exercise',
      description: 'Practice creating responsive layouts using CSS Grid',
      type: 'exercise',
      priority: 'medium',
      estimatedMinutes: 60,
      status: 'not_started',
      moduleId: 'css-advanced',
      moduleName: 'Advanced CSS'
    }
  ]

  // Transform API response to TodayTask format
  const transformTaskSummaryToTodayTask = (task: TaskSummaryResponse): TodayTask => ({
    id: task.id,
    title: task.description,
    description: task.description,
    type: task.task_type.toLowerCase() as TodayTask['type'],
    priority: TasksService.getTaskPriority(task),
    estimatedMinutes: task.estimated_minutes,
    status: task.is_completed ? 'completed' : 'not_started',
    moduleId: task.module_id,
    moduleName: task.module_title,
    dueDate: undefined
  })

  const tasks: TodayTask[] = useMemo(() => {
    if (todayTasks?.tasks && todayTasks.tasks.length > 0) {
      return todayTasks.tasks.map(transformTaskSummaryToTodayTask)
    }
    return mockTasks
  }, [todayTasks])

  // Real-time updates
  useEffect(() => {
    if (lastMessage) {
      setLastUpdate(new Date())
      if (lastMessage.type === 'task_completed' || lastMessage.type === 'progress_update') {
        refetch()
      }
    }
  }, [lastMessage, refetch])

  // Calculate task statistics
  const taskStats: TaskStats = useMemo(() => {
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
      typeBreakdown: { exercise: 0, reading: 0, project: 0, quiz: 0 },
      difficultyBreakdown: { easy: 0, medium: 0, hard: 0 }
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

      // Difficulty breakdown (based on estimated time)
      const difficulty = task.estimatedMinutes <= 30 ? 'easy' : 
                        task.estimatedMinutes <= 60 ? 'medium' : 'hard'
      stats.difficultyBreakdown[difficulty]++

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
  }, [tasks])

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Status filter
      if (filter.status !== 'all' && task.status !== filter.status) return false
      
      // Priority filter
      if (filter.priority !== 'all' && task.priority !== filter.priority) return false
      
      // Type filter
      if (filter.type !== 'all' && task.type !== filter.type) return false
      
      // Difficulty filter
      if (filter.difficulty !== 'all') {
        const difficulty = task.estimatedMinutes <= 30 ? 'easy' : 
                          task.estimatedMinutes <= 60 ? 'medium' : 'hard'
        if (difficulty !== filter.difficulty) return false
      }
      
      // Time range filter
      const [min, max] = filter.timeRange
      if (task.estimatedMinutes < min || task.estimatedMinutes > max) return false
      
      // Due date filter
      if (filter.dueDate !== 'all') {
        const now = new Date()
        const taskDue = task.dueDate ? new Date(task.dueDate) : null
        
        switch (filter.dueDate) {
          case 'overdue':
            if (!taskDue || taskDue >= now || task.status === 'completed') return false
            break
          case 'today':
            if (!taskDue || taskDue.toDateString() !== now.toDateString()) return false
            break
          case 'tomorrow':
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)
            if (!taskDue || taskDue.toDateString() !== tomorrow.toDateString()) return false
            break
          case 'this_week':
            if (!taskDue) return false
            const weekFromNow = new Date(now)
            weekFromNow.setDate(weekFromNow.getDate() + 7)
            if (taskDue > weekFromNow) return false
            break
        }
      }
      
      // Module filter
      if (filter.module && task.moduleId !== filter.module) return false
      
      // Bookmarked filter
      if (filter.bookmarked && !bookmarkedTasks.has(task.id)) return false
      
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        const searchableText = [
          task.title,
          task.description,
          task.moduleName,
          task.type,
          task.priority
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchLower)) return false
      }

      return true
    })

    // Sort tasks
    filtered.sort((a, b) => {
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
        case 'difficulty':
          const getDifficulty = (minutes: number) => 
            minutes <= 30 ? 1 : minutes <= 60 ? 2 : 3
          comparison = getDifficulty(a.estimatedMinutes) - getDifficulty(b.estimatedMinutes)
          break
      }

      return sort.direction === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [tasks, filter, sort, bookmarkedTasks])

  // Event handlers
  const handleTaskAction = async (taskId: string, action: 'start' | 'pause' | 'complete') => {
    try {
      if (action === 'start' && onTaskStart) {
        onTaskStart(taskId)
      } else if (action === 'complete' && onTaskComplete) {
        onTaskComplete(taskId)
      }
      
      // Update local state optimistically
      // In real implementation, this would be handled by the API and WebSocket updates
      console.log(`Task ${taskId} action: ${action}`)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleTaskClick = (task: TodayTask) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const toggleBookmark = (taskId: string) => {
    setBookmarkedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleFilterReset = () => {
    setFilter({
      status: 'all',
      priority: 'all',
      type: 'all',
      difficulty: 'all',
      dueDate: 'all',
      search: '',
      tags: [],
      timeRange: [0, 300],
      bookmarked: false,
      module: moduleId
    })
    setSort({ field: 'priority', direction: 'desc' })
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load tasks</h3>
        <p className="text-gray-600 mb-4">There was an error loading your tasks. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              Task Management
              {enableRealTimeUpdates && isConnected && (
                <div className="ml-3 flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">Live</span>
                </div>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and track your learning tasks efficiently
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List view"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid view"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Kanban view"
              >
                <ChartBarIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Toggle filters"
            >
              <FunnelIcon className="w-4 h-4" />
            </button>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Refresh tasks"
            >
              <ArrowsUpDownIcon className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Task Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
      >
        <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{taskStats.notStarted}</div>
          <div className="text-sm text-gray-600">Not Started</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{Math.round(taskStats.totalTime / 60)}h</div>
          <div className="text-sm text-gray-600">Total Time</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
          <div className="text-2xl font-bold text-indigo-600">{taskStats.completionRate}%</div>
          <div className="text-sm text-gray-600">Completion</div>
        </div>
      </motion.div>

      {/* Enhanced Task Management Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TaskManagement
          tasks={filteredAndSortedTasks}
          onTaskAction={handleTaskAction}
          onTaskClick={handleTaskClick}
          isLoading={isLoading}
          showFilters={showFilters}
          showStats={false} // We're showing stats above
          viewMode={viewMode}
          enableRealTimeUpdates={enableRealTimeUpdates}
        />
      </motion.div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setSelectedTask(null)
        }}
        onAction={(action) => {
          if (selectedTask) {
            handleTaskAction(selectedTask.id, action)
          }
        }}
      />
    </div>
  )
}

export default TaskManagementInterface
