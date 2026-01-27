import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  ArrowsUpDownIcon,
  TagIcon,
  UserGroupIcon,
  ChartBarIcon,
  BookmarkIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/solid'
import { LearningTask, LearningModule } from '../../types/learning-path'
import { TasksService } from '../../services/tasksService'
import TaskListItem from './TaskListItem'
import TaskDetailsModal from './TaskDetailsModal'

interface TaskManagementPanelProps {
  module?: LearningModule
  tasks: LearningTask[]
  onTaskStart: (taskId: string) => void
  onTaskUpdate?: (task: LearningTask) => void
  className?: string
}

type TaskFilter = 'all' | 'not_started' | 'in_progress' | 'completed' | 'failed' | 'bookmarked'
type TaskSort = 'order' | 'difficulty' | 'time' | 'points' | 'type' | 'status' | 'created' | 'updated'
type ViewMode = 'list' | 'grid' | 'kanban' | 'timeline'
type GroupBy = 'none' | 'status' | 'difficulty' | 'type' | 'module'

interface TaskFilters {
  status: TaskFilter
  difficulty: string[]
  type: string[]
  timeRange: [number, number]
  pointsRange: [number, number]
  tags: string[]
  dateRange: [Date | null, Date | null]
}

interface TaskStats {
  total: number
  byStatus: Record<string, number>
  byDifficulty: Record<string, number>
  byType: Record<string, number>
  totalPoints: number
  totalTime: number
  averageScore: number
}

const TaskManagementPanel: React.FC<TaskManagementPanelProps> = ({
  module,
  tasks,
  onTaskStart,
  onTaskUpdate,
  className = ''
}) => {
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    difficulty: [],
    type: [],
    timeRange: [0, 300],
    pointsRange: [0, 1000],
    tags: [],
    dateRange: [null, null]
  })
  const [sortBy, setSortBy] = useState<TaskSort>('order')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTask, setSelectedTask] = useState<LearningTask | null>(null)
  const [bookmarkedTasks, setBookmarkedTasks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Calculate task statistics
  const taskStats: TaskStats = useMemo(() => {
    const stats: TaskStats = {
      total: tasks.length,
      byStatus: {},
      byDifficulty: {},
      byType: {},
      totalPoints: 0,
      totalTime: 0,
      averageScore: 0
    }

    tasks.forEach(task => {
      // Status stats
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1
      
      // Difficulty stats
      stats.byDifficulty[task.difficulty] = (stats.byDifficulty[task.difficulty] || 0) + 1
      
      // Type stats
      stats.byType[task.type] = (stats.byType[task.type] || 0) + 1
      
      // Totals
      stats.totalPoints += task.points
      stats.totalTime += task.estimatedTimeMinutes
    })

    // Calculate average score from submissions
    const completedTasks = tasks.filter(t => t.status === 'completed')
    if (completedTasks.length > 0) {
      const totalScore = completedTasks.reduce((sum, task) => {
        const bestScore = task.submissions?.reduce((max, sub) => 
          Math.max(max, sub.score || 0), 0) || 0
        return sum + bestScore
      }, 0)
      stats.averageScore = totalScore / completedTasks.length
    }

    return stats
  }, [tasks])

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks

    // Apply status filter
    if (filters.status !== 'all') {
      if (filters.status === 'bookmarked') {
        filtered = filtered.filter(task => bookmarkedTasks.has(task.id))
      } else {
        filtered = filtered.filter(task => task.status === filters.status)
      }
    }

    // Apply difficulty filter
    if (filters.difficulty.length > 0) {
      filtered = filtered.filter(task => filters.difficulty.includes(task.difficulty))
    }

    // Apply type filter
    if (filters.type.length > 0) {
      filtered = filtered.filter(task => filters.type.includes(task.type))
    }

    // Apply time range filter
    filtered = filtered.filter(task => 
      task.estimatedTimeMinutes >= filters.timeRange[0] && 
      task.estimatedTimeMinutes <= filters.timeRange[1]
    )

    // Apply points range filter
    filtered = filtered.filter(task => 
      task.points >= filters.pointsRange[0] && 
      task.points <= filters.pointsRange[1]
    )

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.type.toLowerCase().includes(query) ||
        task.requirements?.some(req => req.toLowerCase().includes(query))
      )
    }

    // Sort tasks
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'order':
          comparison = a.order - b.order
          break
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
          break
        case 'time':
          comparison = a.estimatedTimeMinutes - b.estimatedTimeMinutes
          break
        case 'points':
          comparison = a.points - b.points
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [tasks, filters, searchQuery, sortBy, sortOrder, bookmarkedTasks])

  // Group tasks if needed
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': filteredAndSortedTasks }
    }

    const groups: Record<string, LearningTask[]> = {}

    filteredAndSortedTasks.forEach(task => {
      let groupKey = ''
      
      switch (groupBy) {
        case 'status':
          groupKey = task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
          break
        case 'difficulty':
          groupKey = task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)
          break
        case 'type':
          groupKey = task.type.charAt(0).toUpperCase() + task.type.slice(1)
          break
        case 'module':
          groupKey = module?.title || 'Unknown Module'
          break
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(task)
    })

    return groups
  }, [filteredAndSortedTasks, groupBy, module])

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

  const resetFilters = () => {
    setFilters({
      status: 'all',
      difficulty: [],
      type: [],
      timeRange: [0, 300],
      pointsRange: [0, 1000],
      tags: [],
      dateRange: [null, null]
    })
    setSearchQuery('')
    setSortBy('order')
    setSortOrder('asc')
    setGroupBy('none')
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'in_progress':
        return 'text-blue-600 bg-blue-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'hard':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const renderTaskCard = (task: LearningTask, index: number) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
              {task.difficulty}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
              {task.type}
            </span>
          </div>
          <button
            onClick={() => toggleBookmark(task.id)}
            className={`p-1 rounded transition-colors ${
              bookmarkedTasks.has(task.id) 
                ? 'text-yellow-500 hover:text-yellow-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <BookmarkIcon className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{task.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            {formatTime(task.estimatedTimeMinutes)}
          </span>
          <span className="flex items-center">
            <StarIcon className="w-3 h-3 mr-1" />
            {task.points} XP
          </span>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedTask(task)}
            className="flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <EyeIcon className="w-3 h-3 mr-1" />
            View Details
          </button>
          
          {task.status !== 'completed' && (
            <button
              onClick={() => onTaskStart(task.id)}
              className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlayCircleIcon className="w-3 h-3 mr-1" />
              {task.status === 'in_progress' ? 'Continue' : 'Start'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )

  const renderKanbanColumn = (status: string, tasks: LearningTask[]) => (
    <div key={status} className="flex-1 min-w-80">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 capitalize">
            {status.replace('_', ' ')} ({tasks.length})
          </h3>
          <span className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[1]}`} />
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {tasks.map((task, index) => renderTaskCard(task, index))}
        </div>
      </div>
    </div>
  )

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Task Management
              {module && <span className="text-gray-500"> - {module.title}</span>}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredAndSortedTasks.length} of {tasks.length} tasks
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                title="List view"
              >
                <Bars3BottomLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                title="Grid view"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                title="Kanban view"
              >
                <ChartBarIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Toggle filters"
            >
              <FunnelIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{taskStats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{taskStats.byStatus.completed || 0}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{taskStats.byStatus.in_progress || 0}</div>
            <div className="text-xs text-gray-600">In Progress</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{taskStats.totalPoints}</div>
            <div className="text-xs text-gray-600">Total XP</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{formatTime(taskStats.totalTime)}</div>
            <div className="text-xs text-gray-600">Total Time</div>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <div className="text-lg font-bold text-indigo-600">{taskStats.averageScore.toFixed(0)}%</div>
            <div className="text-xs text-gray-600">Avg Score</div>
          </div>
        </div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Status filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as TaskFilter }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="bookmarked">Bookmarked</option>
                  </select>
                </div>

                {/* Sort by */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <div className="flex space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as TaskSort)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="order">Order</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="time">Time</option>
                      <option value="points">Points</option>
                      <option value="type">Type</option>
                      <option value="status">Status</option>
                      <option value="created">Created</option>
                      <option value="updated">Updated</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                    >
                      <ArrowsUpDownIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Group by */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">No Grouping</option>
                    <option value="status">Status</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="type">Type</option>
                    {!module && <option value="module">Module</option>}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-end space-x-2">
                  <button
                    onClick={resetFilters}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'kanban' ? (
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {Object.entries(['not_started', 'in_progress', 'completed', 'failed']).map(([_, status]) => {
              const statusTasks = filteredAndSortedTasks.filter(task => task.status === status)
              return renderKanbanColumn(status, statusTasks)
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <div key={groupName}>
                {groupBy !== 'none' && (
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TagIcon className="w-5 h-5 mr-2 text-gray-500" />
                    {groupName} ({groupTasks.length})
                  </h3>
                )}

                {viewMode === 'list' ? (
                  <div className="space-y-3">
                    {groupTasks.map((task, index) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        onStart={() => onTaskStart(task.id)}
                        onSelect={() => setSelectedTask(task)}
                        moduleStatus={module?.status ?? 'locked'}
                        showBookmark
                        isBookmarked={bookmarkedTasks.has(task.id)}
                        onToggleBookmark={() => toggleBookmark(task.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupTasks.map((task, index) => renderTaskCard(task, index))}
                  </div>
                )}
              </div>
            ))}

            {filteredAndSortedTasks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Bars3BottomLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-sm">Try adjusting your filters or search criteria</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task details modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onStart={() => {
              onTaskStart(selectedTask.id)
              setSelectedTask(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default TaskManagementPanel