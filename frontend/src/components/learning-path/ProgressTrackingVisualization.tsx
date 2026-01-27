import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  PlayCircleIcon,
  ClockIcon,
  LockClosedIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrophyIcon,
  FireIcon,
  CalendarIcon,
  ChartBarIcon,
  StarIcon,
  BoltIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  BeakerIcon,
  BookOpenIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  QuestionMarkCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/solid'
import { LearningModule, ProgressStats, LearningTask } from '../../types/learning-path'

interface ProgressTrackingVisualizationProps {
  modules: LearningModule[]
  progressStats: ProgressStats
  onModuleToggle: (moduleId: string) => void
  expandedModules: Set<string>
  className?: string
  isConnected?: boolean
  lastUpdated?: Date | null
  onTaskStart?: (taskId: string) => Promise<void>
  onTaskComplete?: (taskId: string) => Promise<void>
  onModuleSelect?: (module: LearningModule) => void
  showDetailedView?: boolean
  enableRealTimeUpdates?: boolean
}

interface WebSocketMessage {
  type: 'progress_update' | 'task_completed' | 'module_completed' | 'achievement_unlocked'
  data: any
  timestamp: string
}

interface TaskTypeConfig {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  label: string
}

const ProgressTrackingVisualization: React.FC<ProgressTrackingVisualizationProps> = ({
  modules,
  progressStats,
  onModuleToggle,
  expandedModules,
  className = '',
  isConnected = false,
  lastUpdated = null,
  onTaskStart,
  onTaskComplete,
  onModuleSelect,
  showDetailedView = true,
  enableRealTimeUpdates = true
}) => {
  const [animatedStats, setAnimatedStats] = useState({
    completedTasks: 0,
    earnedPoints: 0,
    currentStreak: 0,
    averageScore: 0
  })
  const [realtimeUpdates, setRealtimeUpdates] = useState<WebSocketMessage[]>([])
  const [showAllModules, setShowAllModules] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null)
  const [taskTypeFilter, setTaskTypeFilter] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Task type configurations
  const taskTypeConfigs: Record<string, TaskTypeConfig> = {
    exercise: {
      icon: CodeBracketIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      label: 'Exercise'
    },
    reading: {
      icon: BookOpenIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      label: 'Reading'
    },
    project: {
      icon: BeakerIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      label: 'Project'
    },
    quiz: {
      icon: QuestionMarkCircleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      label: 'Quiz'
    },
    video: {
      icon: VideoCameraIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      label: 'Video'
    }
  }

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!enableRealTimeUpdates) return

    const connectWebSocket = () => {
      try {
        const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/progress`
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log('Progress WebSocket connected')
        }
        
        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            setRealtimeUpdates(prev => [message, ...prev.slice(0, 9)]) // Keep last 10 updates
            
            // Handle specific update types
            if (message.type === 'progress_update') {
              // Trigger re-animation of stats
              setAnimatedStats(prev => ({ ...prev }))
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }
        
        ws.onclose = () => {
          console.log('Progress WebSocket disconnected')
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000)
        }
        
        wsRef.current = ws
      } catch (error) {
        console.error('Failed to connect to progress WebSocket:', error)
      }
    }

    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [enableRealTimeUpdates])

  // Animate stats on mount and updates
  useEffect(() => {
    const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const current = start + (end - start) * easeOutQuart
        callback(Math.round(current))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }

    // Animate from current values to new values for smooth transitions
    animateValue(animatedStats.completedTasks, progressStats.completedTasks, 1000, (value) => 
      setAnimatedStats(prev => ({ ...prev, completedTasks: value }))
    )
    animateValue(animatedStats.earnedPoints, progressStats.earnedPoints, 1200, (value) => 
      setAnimatedStats(prev => ({ ...prev, earnedPoints: value }))
    )
    animateValue(animatedStats.currentStreak, progressStats.currentStreak, 800, (value) => 
      setAnimatedStats(prev => ({ ...prev, currentStreak: value }))
    )
    animateValue(animatedStats.averageScore, progressStats.averageScore, 1500, (value) => 
      setAnimatedStats(prev => ({ ...prev, averageScore: value }))
    )
  }, [progressStats])

  // Handle task actions
  const handleTaskStart = useCallback(async (taskId: string) => {
    if (onTaskStart) {
      try {
        await onTaskStart(taskId)
      } catch (error) {
        console.error('Failed to start task:', error)
      }
    }
  }, [onTaskStart])

  const handleTaskComplete = useCallback(async (taskId: string) => {
    if (onTaskComplete) {
      try {
        await onTaskComplete(taskId)
      } catch (error) {
        console.error('Failed to complete task:', error)
      }
    }
  }, [onTaskComplete])

  // Filter modules based on selected criteria
  const filteredModules = modules.filter(module => {
    if (!showAllModules && module.status === 'locked') return false
    if (selectedDifficulty && module.difficultyLevel !== selectedDifficulty) return false
    if (taskTypeFilter) {
      const hasTaskType = module.tasks.some(task => task.type === taskTypeFilter)
      if (!hasTaskType) return false
    }
    return true
  })

  const getStatusIcon = (status: LearningModule['status'], size: string = 'w-5 h-5') => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className={`${size} text-green-500`} />
      case 'current':
        return <PlayCircleIcon className={`${size} text-blue-500`} />
      case 'upcoming':
        return <ClockIcon className={`${size} text-yellow-500`} />
      case 'locked':
        return <LockClosedIcon className={`${size} text-gray-400`} />
    }
  }

  const getStatusColor = (status: LearningModule['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'current':
        return 'bg-blue-50 border-blue-200'
      case 'upcoming':
        return 'bg-yellow-50 border-yellow-200'
      case 'locked':
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTaskStatusIcon = (status: LearningTask['status'], size: string = 'w-4 h-4') => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className={`${size} text-green-500`} />
      case 'in_progress':
        return <PlayCircleIcon className={`${size} text-blue-500`} />
      case 'failed':
        return <ExclamationTriangleIcon className={`${size} text-red-500`} />
      default:
        return <ClockIcon className={`${size} text-gray-400`} />
    }
  }

  const getTaskTypeIcon = (type: LearningTask['type']) => {
    const config = taskTypeConfigs[type]
    if (!config) return <InformationCircleIcon className="w-4 h-4 text-gray-400" />
    
    const IconComponent = config.icon
    return <IconComponent className={`w-4 h-4 ${config.color}`} />
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

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getCompletionRate = (): number => {
    if (progressStats.totalTasks === 0) return 0
    return Math.round((progressStats.completedTasks / progressStats.totalTasks) * 100)
  }

  const getPointsProgress = (): number => {
    if (progressStats.totalPoints === 0) return 0
    return Math.round((progressStats.earnedPoints / progressStats.totalPoints) * 100)
  }

  const getModuleStatusSummary = () => {
    const summary = {
      completed: modules.filter(m => m.status === 'completed').length,
      current: modules.filter(m => m.status === 'current').length,
      upcoming: modules.filter(m => m.status === 'upcoming').length,
      locked: modules.filter(m => m.status === 'locked').length
    }
    return summary
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Real-time Connection Status */}
      {enableRealTimeUpdates && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Real-time updates active' : 'Connecting...'}
            </span>
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {realtimeUpdates.length > 0 && (
            <div className="flex items-center space-x-1">
              <BoltIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-500">
                {realtimeUpdates.length} recent updates
              </span>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {animatedStats.completedTasks}
                <span className="text-sm font-normal text-gray-500">
                  /{progressStats.totalTasks}
                </span>
              </p>
            </div>
            <div className="relative">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              {realtimeUpdates.some(u => u.type === 'task_completed') && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-gray-900">{getCompletionRate()}%</span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getCompletionRate()}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Points Earned</p>
              <p className="text-2xl font-bold text-gray-900">
                {animatedStats.earnedPoints.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">
                  /{progressStats.totalPoints.toLocaleString()}
                </span>
              </p>
            </div>
            <TrophyIcon className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-gray-900">{getPointsProgress()}%</span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-yellow-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getPointsProgress()}%` }}
                transition={{ duration: 1, delay: 0.7 }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{animatedStats.currentStreak}</p>
              <p className="text-xs text-gray-500">
                Best: {progressStats.longestStreak} days
              </p>
            </div>
            <div className="relative">
              <FireIcon className="w-8 h-8 text-orange-500" />
              {animatedStats.currentStreak > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0"
                >
                  <FireIcon className="w-8 h-8 text-orange-400 opacity-50" />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{animatedStats.averageScore}%</p>
              <p className="text-xs text-gray-500">
                Time spent: {formatTime(progressStats.timeSpentMinutes)}
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>
      </div>

      {/* Module Status Summary */}
      {showDetailedView && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Module Overview</h3>
            <div className="flex items-center space-x-4">
              {/* Filter Controls */}
              <select
                value={selectedDifficulty || ''}
                onChange={(e) => setSelectedDifficulty(e.target.value ? parseInt(e.target.value) : null)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="">All Difficulties</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </select>
              
              <select
                value={taskTypeFilter || ''}
                onChange={(e) => setTaskTypeFilter(e.target.value || null)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="">All Types</option>
                {Object.entries(taskTypeConfigs).map(([type, config]) => (
                  <option key={type} value={type}>{config.label}</option>
                ))}
              </select>
              
              <button
                onClick={() => setShowAllModules(!showAllModules)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
              >
                {showAllModules ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                <span>{showAllModules ? 'Hide Locked' : 'Show All'}</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(getModuleStatusSummary()).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Module Progress List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Module Progress</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track your progress through each learning module with detailed task breakdown
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredModules
            .sort((a, b) => a.order - b.order)
            .map((module, index) => {
              const isExpanded = expandedModules.has(module.id)
              const completedTasks = module.tasks.filter(task => task.status === 'completed').length
              const totalTasks = module.tasks.length
              const inProgressTasks = module.tasks.filter(task => task.status === 'in_progress').length

              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className={`p-6 cursor-pointer transition-all duration-200 ${
                      module.status === 'locked' 
                        ? 'cursor-not-allowed opacity-60' 
                        : 'hover:bg-gray-50 hover:shadow-sm'
                    } ${getStatusColor(module.status)}`}
                    onClick={() => {
                      if (module.status !== 'locked') {
                        onModuleToggle(module.id)
                        if (onModuleSelect) {
                          onModuleSelect(module)
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="relative">
                          {getStatusIcon(module.status, 'w-6 h-6')}
                          {module.status === 'current' && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 opacity-30"
                            >
                              {getStatusIcon(module.status, 'w-6 h-6')}
                            </motion.div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                {module.title}
                              </h4>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Level {module.difficultyLevel}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>{formatTime(module.estimatedTimeMinutes)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <AcademicCapIcon className="w-4 h-4" />
                                <span>{completedTasks}/{totalTasks} tasks</span>
                              </div>
                              {inProgressTasks > 0 && (
                                <div className="flex items-center space-x-1">
                                  <PlayCircleIcon className="w-4 h-4 text-blue-500" />
                                  <span className="text-blue-600">{inProgressTasks} active</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {module.description}
                          </p>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">Progress</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {module.progress}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    module.status === 'completed' ? 'bg-green-500' :
                                    module.status === 'current' ? 'bg-blue-500' :
                                    module.status === 'upcoming' ? 'bg-yellow-500' :
                                    'bg-gray-400'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${module.progress}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.1 }}
                                />
                              </div>
                            </div>
                            
                            {/* Learning Objectives Preview */}
                            {module.learningObjectives.length > 0 && (
                              <div className="text-xs text-gray-500">
                                <span className="font-medium">{module.learningObjectives.length}</span> objectives
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {module.tasks.length > 0 && (
                        <button 
                          className="ml-4 p-2 rounded-md hover:bg-gray-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            onModuleToggle(module.id)
                          }}
                        >
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                          </motion.div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Expanded Task List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-50 border-t border-gray-200"
                      >
                        <div className="px-6 py-4">
                          {/* Learning Objectives */}
                          {module.learningObjectives.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Learning Objectives</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {module.learningObjectives.map((objective, idx) => (
                                  <div key={idx} className="flex items-start space-x-2">
                                    <StarIcon className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs text-gray-600">{objective}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Task Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {module.tasks
                              .sort((a, b) => a.order - b.order)
                              .map((task) => {
                                const taskConfig = taskTypeConfigs[task.type]
                                
                                return (
                                  <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className={`p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                                      task.status === 'completed'
                                        ? 'border-green-200 bg-green-50'
                                        : task.status === 'in_progress'
                                        ? 'border-blue-200 bg-blue-50'
                                        : task.status === 'failed'
                                        ? 'border-red-200 bg-red-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                    onClick={() => {
                                      if (task.status === 'not_started' && onTaskStart) {
                                        handleTaskStart(task.id)
                                      }
                                    }}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        {getTaskTypeIcon(task.type)}
                                        <h6 className="text-sm font-medium text-gray-900 truncate">
                                          {task.title}
                                        </h6>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        {getTaskStatusIcon(task.status)}
                                        {task.status === 'completed' && onTaskComplete && (
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ml-1"
                                          >
                                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                          </motion.div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                      {task.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-0.5 rounded-full font-medium border ${getDifficultyColor(task.difficulty)}`}>
                                          {task.difficulty}
                                        </span>
                                        <span className="text-gray-500">
                                          {formatTime(task.estimatedTimeMinutes)}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <TrophyIcon className="w-3 h-3 text-yellow-500" />
                                        <span className="text-gray-600 font-medium">{task.points} XP</span>
                                      </div>
                                    </div>
                                    
                                    {/* Task Actions */}
                                    {task.status === 'not_started' && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleTaskStart(task.id)
                                          }}
                                          className="w-full text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                                        >
                                          Start Task
                                        </button>
                                      </div>
                                    )}
                                    
                                    {task.status === 'in_progress' && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleTaskComplete(task.id)
                                          }}
                                          className="w-full text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                                        >
                                          Mark Complete
                                        </button>
                                      </div>
                                    )}
                                  </motion.div>
                                )
                              })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

export default ProgressTrackingVisualization