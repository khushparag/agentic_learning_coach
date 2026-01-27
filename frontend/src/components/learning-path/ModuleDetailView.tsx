import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  PlayCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  LinkIcon,
  FunnelIcon,
  Bars3BottomLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  StarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/solid'
import { LearningModule, LearningTask, LearningResource } from '../../types/learning-path'
import { learningPathService } from '../../services/learningPathService'
import { TasksService } from '../../services/tasksService'
import TaskListItem from './TaskListItem'

interface ModuleDetailViewProps {
  module: LearningModule
  onTaskStart: (taskId: string) => void
  onTaskSelect: (task: LearningTask) => void
  onClose?: () => void
  className?: string
}

type TaskFilter = 'all' | 'not_started' | 'in_progress' | 'completed' | 'failed'
type TaskSort = 'order' | 'difficulty' | 'time' | 'points' | 'type'
type ViewMode = 'list' | 'grid' | 'timeline'

interface ModuleAnalytics {
  averageCompletionTime: number
  difficultyRating: number
  successRate: number
  popularResources: LearningResource[]
  commonStruggles: string[]
}

const ModuleDetailView: React.FC<ModuleDetailViewProps> = ({
  module,
  onTaskStart,
  onTaskSelect,
  onClose,
  className = ''
}) => {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all')
  const [taskSort, setTaskSort] = useState<TaskSort>('order')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [loading, setLoading] = useState(false)
  const [moduleResources, setModuleResources] = useState<LearningResource[]>([])
  const [moduleAnalytics, setModuleAnalytics] = useState<ModuleAnalytics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'resources' | 'analytics'>('overview')
  const [refreshing, setRefreshing] = useState(false)

  // Load additional module data
  useEffect(() => {
    const loadModuleData = async () => {
      setLoading(true)
      try {
        const [resources, analytics] = await Promise.all([
          learningPathService.getModuleResources(module.id),
          loadModuleAnalytics()
        ])
        setModuleResources(resources)
        setModuleAnalytics(analytics)
      } catch (error) {
        console.error('Failed to load module data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadModuleData()
  }, [module.id])

  const loadModuleAnalytics = async (): Promise<ModuleAnalytics> => {
    // Simulate analytics data - in real app, this would come from API
    return {
      averageCompletionTime: module.estimatedTimeMinutes * 1.2,
      difficultyRating: module.difficultyLevel / 2,
      successRate: 0.85,
      popularResources: module.resources?.slice(0, 3) || [],
      commonStruggles: [
        'Understanding core concepts',
        'Applying knowledge to practice',
        'Time management'
      ]
    }
  }

  const refreshModuleData = async () => {
    setRefreshing(true)
    try {
      // Refresh module data from API
      await learningPathService.syncProgress()
      // Trigger parent component refresh if needed
    } catch (error) {
      console.error('Failed to refresh module data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: LearningModule['status']) => {
    const iconClass = "w-6 h-6"
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />
      case 'current':
        return <PlayCircleIcon className={`${iconClass} text-blue-500`} />
      case 'upcoming':
        return <ClockIcon className={`${iconClass} text-yellow-500`} />
      case 'locked':
        return <ClockIcon className={`${iconClass} text-gray-400`} />
    }
  }

  const getResourceIcon = (type: LearningResource['type']) => {
    const iconClass = "w-4 h-4"
    switch (type) {
      case 'documentation':
        return <DocumentTextIcon className={`${iconClass} text-blue-500`} />
      case 'tutorial':
        return <BookOpenIcon className={`${iconClass} text-green-500`} />
      case 'video':
        return <VideoCameraIcon className={`${iconClass} text-red-500`} />
      case 'article':
        return <DocumentTextIcon className={`${iconClass} text-purple-500`} />
      case 'example':
        return <CodeBracketIcon className={`${iconClass} text-orange-500`} />
      case 'reference':
        return <LinkIcon className={`${iconClass} text-gray-500`} />
    }
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutes`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  }

  const filteredAndSortedTasks = React.useMemo(() => {
    let filtered = module.tasks

    // Apply filter
    if (taskFilter !== 'all') {
      filtered = filtered.filter(task => task.status === taskFilter)
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (taskSort) {
        case 'order':
          return a.order - b.order
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        case 'time':
          return a.estimatedTimeMinutes - b.estimatedTimeMinutes
        case 'points':
          return b.points - a.points
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

    return sorted
  }, [module.tasks, taskFilter, taskSort, searchQuery])

  const getTaskStats = () => {
    const total = module.tasks.length
    const completed = module.tasks.filter(t => t.status === 'completed').length
    const inProgress = module.tasks.filter(t => t.status === 'in_progress').length
    const notStarted = module.tasks.filter(t => t.status === 'not_started').length
    const failed = module.tasks.filter(t => t.status === 'failed').length
    
    return { total, completed, inProgress, notStarted, failed }
  }

  const getTaskTypeStats = () => {
    const types = module.tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return types
  }

  const taskStats = getTaskStats()
  const taskTypeStats = getTaskTypeStats()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'tasks':
        return renderTasksTab()
      case 'resources':
        return renderResourcesTab()
      case 'analytics':
        return renderAnalyticsTab()
      default:
        return renderOverviewTab()
    }
  }

  const renderOverviewTab = () => (
    <div className="p-6 space-y-6">
      {/* Module description */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Module</h3>
        <p className="text-gray-700 leading-relaxed">{module.description}</p>
      </div>

      {/* Learning objectives */}
      {module.learningObjectives.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Objectives</h3>
          <div className="grid gap-3">
            {module.learningObjectives.map((objective, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{objective}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {module.prerequisites.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Prerequisites</h3>
          <div className="flex flex-wrap gap-2">
            {module.prerequisites.map((prereq, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm border border-yellow-200"
              >
                {prereq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Module statistics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Module Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatTime(module.estimatedTimeMinutes)}</div>
            <div className="text-sm text-gray-600">Est. Time</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{module.difficultyLevel}/10</div>
            <div className="text-sm text-gray-600">Difficulty</div>
          </div>
        </div>
      </div>

      {/* Task type breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(taskTypeStats).map(([type, count]) => (
            <div key={type} className="text-center p-3 bg-white border border-gray-200 rounded-lg">
              {getTaskIcon(type as LearningTask['type'])}
              <div className="mt-2">
                <div className="text-lg font-semibold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600 capitalize">{type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTasksTab = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Tasks ({filteredAndSortedTasks.length})
        </h3>
        
        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <Bars3BottomLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
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
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-gray-50 rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value as TaskFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tasks</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort by
                </label>
                <select
                  value={taskSort}
                  onChange={(e) => setTaskSort(e.target.value as TaskSort)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="order">Order</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="time">Time Required</option>
                  <option value="points">Points</option>
                  <option value="type">Type</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setTaskFilter('all')
                    setTaskSort('order')
                    setSearchQuery('')
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{taskStats.notStarted}</div>
          <div className="text-sm text-gray-600">Not Started</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{taskStats.failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
      </div>

      {/* Task list */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredAndSortedTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TaskListItem
                task={task}
                onStart={() => onTaskStart(task.id)}
                onSelect={() => onTaskSelect(task)}
                moduleStatus={module.status}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
              onClick={() => onTaskSelect(task)}
            >
              <div className="flex items-start justify-between mb-3">
                {getTaskIcon(task.type)}
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(task.difficulty)}`}>
                  {task.difficulty}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{task.title}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatTime(task.estimatedTimeMinutes)}</span>
                <span>{task.points} XP</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredAndSortedTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Bars3BottomLeftIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No tasks found matching your criteria</p>
        </div>
      )}
    </div>
  )

  const renderResourcesTab = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Learning Resources</h3>
        <button
          onClick={refreshModuleData}
          disabled={refreshing}
          className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading resources...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(moduleResources.length > 0 ? moduleResources : module.resources || []).map((resource) => (
            <div
              key={resource.id}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getResourceIcon(resource.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-gray-900 mb-2">
                      {resource.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="capitalize">{resource.type}</span>
                        <span>{formatTime(resource.estimatedTimeMinutes)}</span>
                        <span className="capitalize">{resource.difficulty}</span>
                        {resource.verified && (
                          <span className="text-green-600 font-medium">✓ Verified</span>
                        )}
                        {resource.rating && (
                          <div className="flex items-center">
                            <StarIcon className="w-3 h-3 text-yellow-400 mr-1" />
                            <span>{resource.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(resource.url, '_blank')}
                          className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          View
                        </button>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(moduleResources.length === 0 && (!module.resources || module.resources.length === 0)) && (
            <div className="text-center py-8 text-gray-500">
              <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No resources available for this module</p>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="p-6 space-y-6">
      {moduleAnalytics ? (
        <>
          {/* Performance metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {(moduleAnalytics.successRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Avg. Completion</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatTime(moduleAnalytics.averageCompletionTime)}
                    </p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Difficulty</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {moduleAnalytics.difficultyRating.toFixed(1)}/5
                    </p>
                  </div>
                  <AcademicCapIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Popular resources */}
          {moduleAnalytics.popularResources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Helpful Resources</h3>
              <div className="space-y-3">
                {moduleAnalytics.popularResources.map((resource, index) => (
                  <div key={resource.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{resource.title}</h4>
                      <p className="text-sm text-gray-600">{resource.type}</p>
                    </div>
                    {resource.rating && (
                      <div className="flex items-center">
                        <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{resource.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common struggles */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Challenges</h3>
            <div className="space-y-2">
              {moduleAnalytics.commonStruggles.map((struggle, index) => (
                <div key={index} className="flex items-start p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{struggle}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      )}
    </div>
  )

  const getTaskIcon = (type: LearningTask['type']) => {
    const iconClass = "w-6 h-6"
    switch (type) {
      case 'exercise':
        return <CodeBracketIcon className={`${iconClass} text-blue-500`} />
      case 'reading':
        return <BookOpenIcon className={`${iconClass} text-green-500`} />
      case 'project':
        return <AcademicCapIcon className={`${iconClass} text-purple-500`} />
      case 'quiz':
        return <DocumentTextIcon className={`${iconClass} text-orange-500`} />
      case 'video':
        return <VideoCameraIcon className={`${iconClass} text-red-500`} />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {getStatusIcon(module.status)}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
              <p className="text-gray-600 mt-1">{module.description}</p>
              
              <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                <span className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {formatTime(module.estimatedTimeMinutes)}
                </span>
                <span className="flex items-center">
                  <AcademicCapIcon className="w-4 h-4 mr-1" />
                  Level {module.difficultyLevel}
                </span>
                <span>
                  {taskStats.completed}/{taskStats.total} tasks completed
                </span>
                <span className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {new Date(module.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshModuleData}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh module data"
            >
              <ArrowPathIcon className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Module Progress</span>
            <span className="text-sm text-gray-500">{module.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className={`h-3 rounded-full transition-all duration-500 ${
                module.status === 'completed' ? 'bg-green-500' :
                module.status === 'current' ? 'bg-blue-500' :
                'bg-gray-400'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${module.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mt-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <InformationCircleIcon className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircleIcon className="w-4 h-4 inline mr-2" />
              Tasks ({taskStats.total})
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'resources'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpenIcon className="w-4 h-4 inline mr-2" />
              Resources ({(moduleResources.length || module.resources?.length || 0)})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ModuleDetailView