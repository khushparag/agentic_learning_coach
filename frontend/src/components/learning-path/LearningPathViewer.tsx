import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon, 
  PlayCircleIcon, 
  LockClosedIcon,
  ClockIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid'
import { LearningModule, LearningPath, ModuleDependency } from '../../types/learning-path'
import ModuleCard from './ModuleCard'
import TaskDetailsModal from './TaskDetailsModal'
import DependencyVisualization from './DependencyVisualization'
import { learningPathService } from '../../services/learningPathService'

interface LearningPathViewerProps {
  learningPath: LearningPath
  onModuleSelect: (module: LearningModule) => void
  onTaskStart: (taskId: string) => void
  selectedModule?: LearningModule | null
  className?: string
}

const LearningPathViewer: React.FC<LearningPathViewerProps> = ({
  learningPath,
  onModuleSelect,
  onTaskStart,
  selectedModule,
  className = ''
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [showDependencies, setShowDependencies] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [analytics, setAnalytics] = useState<any>(null)

  // Auto-expand current module
  useEffect(() => {
    const currentModule = learningPath.modules.find(m => m.status === 'current')
    if (currentModule) {
      setExpandedModules(prev => new Set([...prev, currentModule.id]))
    }
  }, [learningPath.modules])

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analyticsData = await learningPathService.getCurriculumAnalytics(learningPath.id)
        setAnalytics(analyticsData)
      } catch (error) {
        console.warn('Failed to load analytics:', error)
      }
    }
    
    loadAnalytics()
  }, [learningPath.id])

  // Real-time progress sync
  const syncProgress = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await learningPathService.syncProgress()
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to sync progress:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Auto-sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(syncProgress, 30000)
    return () => clearInterval(interval)
  }, [syncProgress])

  const toggleModuleExpansion = (moduleId: string): void => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const handleTaskSelect = async (task: any) => {
    try {
      // Load detailed task information
      const detailedTask = await learningPathService.getTaskDetails(task.id)
      setSelectedTask(detailedTask)
    } catch (error) {
      console.error('Failed to load task details:', error)
      setSelectedTask(task) // Fallback to basic task data
    }
  }

  const getModuleStatusIcon = (status: LearningModule['status']) => {
    const iconClass = "w-6 h-6"
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />
      case 'current':
        return <PlayCircleIcon className={`${iconClass} text-blue-500`} />
      case 'upcoming':
        return <ClockIcon className={`${iconClass} text-yellow-500`} />
      case 'locked':
        return <LockClosedIcon className={`${iconClass} text-gray-400`} />
    }
  }

  const getModuleStatusColor = (status: LearningModule['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50 hover:bg-green-100'
      case 'current':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100'
      case 'upcoming':
        return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
      case 'locked':
        return 'border-gray-200 bg-gray-50'
    }
  }

  const calculateOverallProgress = (): number => {
    if (learningPath.modules.length === 0) return 0
    const totalProgress = learningPath.modules.reduce((sum, module) => sum + module.progress, 0)
    return Math.round(totalProgress / learningPath.modules.length)
  }

  const getEstimatedTimeRemaining = (): string => {
    const remainingMinutes = learningPath.modules
      .filter(m => m.status !== 'completed')
      .reduce((sum, module) => {
        const moduleRemaining = module.estimatedTimeMinutes * (1 - module.progress / 100)
        return sum + moduleRemaining
      }, 0)
    
    const hours = Math.floor(remainingMinutes / 60)
    const minutes = remainingMinutes % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    }
    return `${minutes}m remaining`
  }

  const getNextMilestone = (): { module: LearningModule; progress: number } | null => {
    const currentModule = learningPath.modules.find(m => m.status === 'current')
    if (currentModule && currentModule.progress < 100) {
      return { module: currentModule, progress: 100 - currentModule.progress }
    }
    
    const nextModule = learningPath.modules.find(m => m.status === 'upcoming')
    if (nextModule) {
      return { module: nextModule, progress: 100 }
    }
    
    return null
  }

  const renderTimelineView = () => (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
      
      <div className="space-y-6">
        {learningPath.modules
          .sort((a, b) => a.order - b.order)
          .map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Timeline node */}
              <div className="absolute left-6 top-6 w-4 h-4 rounded-full border-4 border-white bg-gray-300 z-10">
                <div className={`w-full h-full rounded-full ${
                  module.status === 'completed' ? 'bg-green-500' :
                  module.status === 'current' ? 'bg-blue-500' :
                  module.status === 'upcoming' ? 'bg-yellow-500' :
                  'bg-gray-300'
                }`} />
              </div>

              {/* Module card */}
              <div className="ml-16">
                <ModuleCard
                  module={module}
                  isSelected={selectedModule?.id === module.id}
                  isExpanded={expandedModules.has(module.id)}
                  onSelect={() => onModuleSelect(module)}
                  onToggleExpand={() => toggleModuleExpansion(module.id)}
                  onTaskStart={onTaskStart}
                  onTaskSelect={handleTaskSelect}
                />
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {learningPath.modules
        .sort((a, b) => a.order - b.order)
        .map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ModuleCard
              module={module}
              isSelected={selectedModule?.id === module.id}
              isExpanded={expandedModules.has(module.id)}
              onSelect={() => onModuleSelect(module)}
              onToggleExpand={() => toggleModuleExpansion(module.id)}
              onTaskStart={onTaskStart}
              onTaskSelect={handleTaskSelect}
              compact={true}
            />
          </motion.div>
        ))}
    </div>
  )

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{learningPath.title}</h2>
            <p className="text-gray-600 mt-1">{learningPath.description}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Real-time sync indicator */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <button
                onClick={syncProgress}
                disabled={isRefreshing}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Sync progress"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
            </div>

            {/* Dependencies toggle */}
            <button
              onClick={() => setShowDependencies(!showDependencies)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <AcademicCapIcon className="w-4 h-4 mr-2" />
              Dependencies
            </button>
          </div>
        </div>

        {/* Enhanced progress overview */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">{calculateOverallProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${calculateOverallProgress()}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-700">Time Remaining</div>
                <div className="text-sm text-gray-500">{getEstimatedTimeRemaining()}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <AcademicCapIcon className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-700">Modules</div>
                <div className="text-sm text-gray-500">
                  {learningPath.completedModules} of {learningPath.totalModules} completed
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <InformationCircleIcon className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-700">Next Milestone</div>
                <div className="text-sm text-gray-500">
                  {(() => {
                    const milestone = getNextMilestone()
                    return milestone 
                      ? `${milestone.module.title.substring(0, 20)}...`
                      : 'All complete!'
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics insights */}
        {analytics && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Learning Insights</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {analytics.insights || 'You\'re making great progress! Keep up the momentum.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dependencies visualization */}
      <AnimatePresence>
        {showDependencies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-200"
          >
            <DependencyVisualization modules={learningPath.modules} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="p-6">
        {viewMode === 'timeline' ? renderTimelineView() : renderGridView()}
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

export default LearningPathViewer