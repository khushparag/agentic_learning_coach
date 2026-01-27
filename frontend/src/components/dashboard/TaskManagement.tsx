import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarIcon,
  StarIcon,
  TagIcon,
  ArrowsUpDownIcon,
  BookmarkIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  FireIcon,
  TrophyIcon,
  ChartBarIcon,
  UserGroupIcon,
  BoltIcon,
  AcademicCapIcon,
  CodeBracketIcon,
  BookOpenIcon,
  CubeIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { TodayTask, TaskFilter, TaskSort } from '../../types/dashboard'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface TaskManagementProps {
  tasks: TodayTask[]
  onTaskAction: (taskId: string, action: 'start' | 'pause' | 'complete') => void
  onTaskClick: (task: TodayTask) => void
  isLoading?: boolean
  showFilters?: boolean
  showStats?: boolean
  viewMode?: 'list' | 'grid' | 'kanban'
  enableRealTimeUpdates?: boolean
}

interface ExtendedTaskFilter extends TaskFilter {
  search?: string
  tags?: string[]
  difficulty?: 'easy' | 'medium' | 'hard' | 'all'
  timeRange?: [number, number]
  dueDate?: 'today' | 'tomorrow' | 'this_week' | 'overdue' | 'all'
  bookmarked?: boolean
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

interface TaskFiltersProps {
  filter: ExtendedTaskFilter
  onFilterChange: (filter: ExtendedTaskFilter) => void
  sort: TaskSort
  onSortChange: (sort: TaskSort) => void
  onReset: () => void
  taskStats: TaskStats
}

function TaskFilters({ filter, onFilterChange, sort, onSortChange, onReset, taskStats }: TaskFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const statusOptions = [
    { value: 'all', label: 'All Status', count: taskStats.total },
    { value: 'not_started', label: 'Not Started', count: taskStats.notStarted },
    { value: 'in_progress', label: 'In Progress', count: taskStats.inProgress },
    { value: 'completed', label: 'Completed', count: taskStats.completed }
  ]

  const priorityOptions = [
    { value: 'all', label: 'All Priorities', count: taskStats.total },
    { value: 'high', label: 'High Priority', count: taskStats.priorityBreakdown.high || 0 },
    { value: 'medium', label: 'Medium Priority', count: taskStats.priorityBreakdown.medium || 0 },
    { value: 'low', label: 'Low Priority', count: taskStats.priorityBreakdown.low || 0 }
  ]

  const typeOptions = [
    { value: 'all', label: 'All Types', count: taskStats.total },
    { value: 'exercise', label: 'Exercises', count: taskStats.typeBreakdown.exercise || 0 },
    { value: 'reading', label: 'Reading', count: taskStats.typeBreakdown.reading || 0 },
    { value: 'project', label: 'Projects', count: taskStats.typeBreakdown.project || 0 },
    { value: 'quiz', label: 'Quizzes', count: taskStats.typeBreakdown.quiz || 0 }
  ]

  const difficultyOptions = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ]

  const dueDateOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'today', label: 'Due Today' },
    { value: 'tomorrow', label: 'Due Tomorrow' },
    { value: 'this_week', label: 'This Week' }
  ]

  const sortOptions = [
    { field: 'priority', label: 'Priority' },
    { field: 'dueDate', label: 'Due Date' },
    { field: 'estimatedMinutes', label: 'Duration' },
    { field: 'title', label: 'Title' },
    { field: 'status', label: 'Status' },
    { field: 'type', label: 'Type' }
  ]

  const handleTimeRangeChange = (range: [number, number]) => {
    onFilterChange({ ...filter, timeRange: range })
  }

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-64">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks by title, description, or module..."
            value={filter.search || ''}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {filter.search && (
            <button
              onClick={() => onFilterChange({ ...filter, search: '' })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex items-center space-x-2">
          {/* Status Filter */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
              <span className="font-medium">
                {statusOptions.find(opt => opt.value === filter.status)?.label || 'Status'}
              </span>
              <span className="ml-1 text-gray-500">
                ({statusOptions.find(opt => opt.value === filter.status)?.count || 0})
              </span>
              <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-500" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-10 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 focus:outline-none">
                <div className="py-1">
                  {statusOptions.map((option) => (
                    <Menu.Item key={option.value}>
                      {({ active }) => (
                        <button
                          onClick={() => onFilterChange({ ...filter, status: option.value as any })}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center justify-between w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                        >
                          <span>{option.label}</span>
                          <span className="text-gray-500 text-xs">({option.count})</span>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Priority Filter */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
              <span className="font-medium">
                {priorityOptions.find(opt => opt.value === filter.priority)?.label || 'Priority'}
              </span>
              <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-500" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-10 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 focus:outline-none">
                <div className="py-1">
                  {priorityOptions.map((option) => (
                    <Menu.Item key={option.value}>
                      {({ active }) => (
                        <button
                          onClick={() => onFilterChange({ ...filter, priority: option.value as any })}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center justify-between w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                        >
                          <span>{option.label}</span>
                          <span className="text-gray-500 text-xs">({option.count})</span>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Type Filter */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
              <span className="font-medium">
                {typeOptions.find(opt => opt.value === filter.type)?.label || 'Type'}
              </span>
              <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-500" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-10 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 focus:outline-none">
                <div className="py-1">
                  {typeOptions.map((option) => (
                    <Menu.Item key={option.value}>
                      {({ active }) => (
                        <button
                          onClick={() => onFilterChange({ ...filter, type: option.value as any })}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center justify-between w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                        >
                          <span>{option.label}</span>
                          <span className="text-gray-500 text-xs">({option.count})</span>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Sort */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
              <ArrowsUpDownIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium">
                {sortOptions.find(opt => opt.field === sort.field)?.label}
              </span>
              <span className="ml-1 text-gray-500">
                {sort.direction === 'asc' ? '↑' : '↓'}
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-10 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 focus:outline-none">
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <Menu.Item key={option.field}>
                      {({ active }) => (
                        <button
                          onClick={() => onSortChange({ 
                            field: option.field as any, 
                            direction: sort.field === option.field && sort.direction === 'asc' ? 'desc' : 'asc'
                          })}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center justify-between w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                        >
                          <span>{option.label}</span>
                          {sort.field === option.field && (
                            <span className="text-blue-600">
                              {sort.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2 rounded-lg transition-colors ${
              showAdvanced ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Advanced filters"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
          </button>

          {/* Reset Filters */}
          <button
            onClick={onReset}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={filter.difficulty || 'all'}
                  onChange={(e) => onFilterChange({ ...filter, difficulty: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <select
                  value={filter.dueDate || 'all'}
                  onChange={(e) => onFilterChange({ ...filter, dueDate: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {dueDateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration: {filter.timeRange?.[0] || 0}-{filter.timeRange?.[1] || 300} min
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="15"
                    value={filter.timeRange?.[0] || 0}
                    onChange={(e) => handleTimeRangeChange([parseInt(e.target.value), filter.timeRange?.[1] || 300])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="15"
                    value={filter.timeRange?.[1] || 300}
                    onChange={(e) => handleTimeRangeChange([filter.timeRange?.[0] || 0, parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Bookmarked Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filter.bookmarked || false}
                      onChange={(e) => onFilterChange({ ...filter, bookmarked: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Bookmarked only</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface TaskCardProps {
  task: TodayTask
  onAction: (action: 'start' | 'pause' | 'complete') => void
  onClick: () => void
  viewMode?: 'list' | 'grid' | 'kanban'
  isBookmarked?: boolean
  onToggleBookmark?: () => void
  showQuickActions?: boolean
}

function TaskCard({ 
  task, 
  onAction, 
  onClick, 
  viewMode = 'list',
  isBookmarked = false,
  onToggleBookmark,
  showQuickActions = true
}: TaskCardProps) {
  const getStatusIcon = (status: TodayTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'in_progress':
        return <PlayCircleIcon className="w-5 h-5 text-blue-600" />
      case 'not_started':
        return <PauseCircleIcon className="w-5 h-5 text-gray-400" />
      default:
        return <PauseCircleIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const getTypeIcon = (type: TodayTask['type']) => {
    switch (type) {
      case 'exercise':
        return <CodeBracketIcon className="w-4 h-4" />
      case 'reading':
        return <BookOpenIcon className="w-4 h-4" />
      case 'project':
        return <CubeIcon className="w-4 h-4" />
      case 'quiz':
        return <QuestionMarkCircleIcon className="w-4 h-4" />
      default:
        return <AcademicCapIcon className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: TodayTask['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'low':
        return 'border-l-green-500 bg-green-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getTypeColor = (type: TodayTask['type']) => {
    switch (type) {
      case 'exercise':
        return 'bg-blue-100 text-blue-700'
      case 'reading':
        return 'bg-green-100 text-green-700'
      case 'project':
        return 'bg-purple-100 text-purple-700'
      case 'quiz':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyLevel = (estimatedMinutes: number): 'easy' | 'medium' | 'hard' => {
    if (estimatedMinutes <= 30) return 'easy'
    if (estimatedMinutes <= 60) return 'medium'
    return 'hard'
  }

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'hard':
        return 'bg-red-100 text-red-700'
    }
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
  const difficulty = getDifficultyLevel(task.estimatedMinutes)

  const cardClasses = viewMode === 'grid' 
    ? `bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4 ${
        task.status === 'completed' ? 'opacity-75' : ''
      }`
    : `bg-white border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4 ${getPriorityColor(task.priority)} ${
        task.status === 'completed' ? 'opacity-75' : ''
      }`

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cardClasses}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {getStatusIcon(task.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{task.title}</h4>
                {isOverdue && (
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
              </div>
              {onToggleBookmark && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleBookmark()
                  }}
                  className={`p-1 rounded transition-colors ${
                    isBookmarked 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <BookmarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
            
            {/* Tags and Metadata */}
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(task.type)}`}>
                {getTypeIcon(task.type)}
                <span className="ml-1 capitalize">{task.type}</span>
              </span>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {task.priority} priority
              </span>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </span>
            </div>
            
            {/* Task Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  {task.estimatedMinutes}m
                </span>
                <span className="flex items-center">
                  <TagIcon className="w-3 h-3 mr-1" />
                  {task.moduleName}
                </span>
                {task.dueDate && (
                  <span className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {isOverdue ? 'Overdue' : `Due ${new Date(task.dueDate).toLocaleDateString()}`}
                  </span>
                )}
              </div>
              
              {task.status === 'completed' && (
                <span className="flex items-center text-green-600 font-medium">
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Completed
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        {showQuickActions && (
          <div className="ml-4 flex flex-col space-y-2">
            {task.status === 'not_started' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAction('start')
                }}
                className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlayCircleIcon className="w-4 h-4 mr-1" />
                Start
              </button>
            )}
            
            {task.status === 'in_progress' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAction('pause')
                  }}
                  className="flex items-center px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <PauseCircleIcon className="w-4 h-4 mr-1" />
                  Pause
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAction('complete')
                  }}
                  className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Complete
                </button>
              </>
            )}
            
            {task.status === 'completed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
                className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                Review
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function TaskManagement({ 
  tasks, 
  onTaskAction, 
  onTaskClick, 
  isLoading = false,
  showFilters = true,
  showStats = true,
  viewMode: initialViewMode = 'list',
  enableRealTimeUpdates = true
}: TaskManagementProps) {
  const [filter, setFilter] = useState<ExtendedTaskFilter>({
    status: 'all',
    priority: 'all',
    type: 'all',
    difficulty: 'all',
    dueDate: 'all',
    search: '',
    tags: [],
    timeRange: [0, 300],
    bookmarked: false
  })
  
  const [sort, setSort] = useState<TaskSort>({
    field: 'priority',
    direction: 'desc'
  })
  
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>(initialViewMode)
  const [bookmarkedTasks, setBookmarkedTasks] = useState<Set<string>>(new Set())
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Real-time updates simulation
  useEffect(() => {
    if (!enableRealTimeUpdates) return

    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [enableRealTimeUpdates])

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
  }, [tasks])

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Status filter
      if (filter.status && filter.status !== 'all' && task.status !== filter.status) return false
      
      // Priority filter
      if (filter.priority && filter.priority !== 'all' && task.priority !== filter.priority) return false
      
      // Type filter
      if (filter.type && filter.type !== 'all' && task.type !== filter.type) return false
      
      // Difficulty filter (based on estimated time)
      if (filter.difficulty && filter.difficulty !== 'all') {
        const difficulty = task.estimatedMinutes <= 30 ? 'easy' : 
                          task.estimatedMinutes <= 60 ? 'medium' : 'hard'
        if (difficulty !== filter.difficulty) return false
      }
      
      // Time range filter
      if (filter.timeRange) {
        const [min, max] = filter.timeRange
        if (task.estimatedMinutes < min || task.estimatedMinutes > max) return false
      }
      
      // Due date filter
      if (filter.dueDate && filter.dueDate !== 'all') {
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
      }

      return sort.direction === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [tasks, filter, sort, bookmarkedTasks])

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
      bookmarked: false
    })
    setSort({ field: 'priority', direction: 'desc' })
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

  const renderKanbanView = () => {
    const columns = [
      { status: 'not_started', title: 'Not Started', color: 'bg-gray-100' },
      { status: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
      { status: 'completed', title: 'Completed', color: 'bg-green-100' }
    ]

    return (
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {columns.map(column => {
          const columnTasks = filteredAndSortedTasks.filter(task => task.status === column.status)
          
          return (
            <div key={column.status} className="flex-shrink-0 w-80">
              <div className={`${column.color} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-700">
                    {columnTasks.length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {columnTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onAction={(action) => onTaskAction(task.id, action)}
                        onClick={() => onTaskClick(task)}
                        viewMode="kanban"
                        isBookmarked={bookmarkedTasks.has(task.id)}
                        onToggleBookmark={() => toggleBookmark(task.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        )}
        
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            Task Management
            {enableRealTimeUpdates && (
              <div className="ml-3 flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Live</span>
              </div>
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedTasks.length} of {tasks.length} tasks
            {filter.search && ` matching "${filter.search}"`}
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

          {/* Last Update Indicator */}
          {enableRealTimeUpdates && (
            <div className="text-xs text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Task Statistics */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{taskStats.notStarted}</div>
            <div className="text-sm text-gray-600">Not Started</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{Math.round(taskStats.totalTime / 60)}h</div>
            <div className="text-sm text-gray-600">Total Time</div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{taskStats.completionRate}%</div>
            <div className="text-sm text-gray-600">Completion</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <TaskFilters
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          onReset={handleFilterReset}
          taskStats={taskStats}
        />
      )}

      {/* Task Content */}
      <div className="min-h-96">
        {viewMode === 'kanban' ? (
          renderKanbanView()
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }>
            <AnimatePresence>
              {filteredAndSortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAction={(action) => onTaskAction(task.id, action)}
                  onClick={() => onTaskClick(task)}
                  viewMode={viewMode}
                  isBookmarked={bookmarkedTasks.has(task.id)}
                  onToggleBookmark={() => toggleBookmark(task.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {filteredAndSortedTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-500"
          >
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              {filter.search || filter.status !== 'all' || filter.priority !== 'all' || filter.type !== 'all' ? (
                <FunnelIcon className="w-full h-full" />
              ) : (
                <ListBulletIcon className="w-full h-full" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter.search || filter.status !== 'all' || filter.priority !== 'all' || filter.type !== 'all'
                ? 'No tasks match your filters'
                : 'No tasks available'
              }
            </h3>
            <p className="text-sm mb-4">
              {filter.search || filter.status !== 'all' || filter.priority !== 'all' || filter.type !== 'all'
                ? 'Try adjusting your filters to see more tasks'
                : 'Tasks will appear here when they are assigned to you'
              }
            </p>
            {(filter.search || filter.status !== 'all' || filter.priority !== 'all' || filter.type !== 'all') && (
              <button
                onClick={handleFilterReset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
