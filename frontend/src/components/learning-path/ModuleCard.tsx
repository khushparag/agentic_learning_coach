import React from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  PlayCircleIcon,
  LockClosedIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BookOpenIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  AcademicCapIcon
} from '@heroicons/react/24/solid'
import { LearningModule, LearningTask } from '../../types/learning-path'

interface ModuleCardProps {
  module: LearningModule
  isSelected: boolean
  isExpanded: boolean
  onSelect: () => void
  onToggleExpand: () => void
  onTaskStart: (taskId: string) => void
  onTaskSelect: (task: LearningTask) => void
  compact?: boolean
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onTaskStart,
  onTaskSelect,
  compact = false
}) => {
  const getStatusIcon = (status: LearningModule['status']) => {
    const iconClass = "w-5 h-5"
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

  const getStatusColor = (status: LearningModule['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'current':
        return 'border-blue-200 bg-blue-50'
      case 'upcoming':
        return 'border-yellow-200 bg-yellow-50'
      case 'locked':
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getTaskIcon = (type: LearningTask['type']) => {
    const iconClass = "w-4 h-4"
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
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const completedTasks = module.tasks.filter(task => task.status === 'completed').length
  const totalTasks = module.tasks.length

  return (
    <motion.div
      layout
      className={`rounded-lg border-2 cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-blue-500 bg-blue-50' : getStatusColor(module.status)
      } ${module.status === 'locked' ? 'cursor-not-allowed opacity-60' : 'hover:shadow-md'}`}
      onClick={module.status !== 'locked' ? onSelect : undefined}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(module.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {module.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {module.description}
              </p>
            </div>
          </div>

          {/* Expand/Collapse button */}
          {!compact && module.tasks.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand()
              }}
              className="flex-shrink-0 p-1 rounded-md hover:bg-gray-200 transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
              )}
            </button>
          )}
        </div>

        {/* Module metadata */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              {formatTime(module.estimatedTimeMinutes)}
            </span>
            <span className="flex items-center">
              <AcademicCapIcon className="w-4 h-4 mr-1" />
              Level {module.difficultyLevel}
            </span>
            {totalTasks > 0 && (
              <span>
                {completedTasks}/{totalTasks} tasks
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{module.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full transition-all duration-500 ${
                module.status === 'completed' ? 'bg-green-500' :
                module.status === 'current' ? 'bg-blue-500' :
                'bg-gray-400'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${module.progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Learning objectives */}
        {!compact && module.learningObjectives.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Learning Objectives</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {module.learningObjectives.slice(0, 3).map((objective, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {objective}
                </li>
              ))}
              {module.learningObjectives.length > 3 && (
                <li className="text-gray-400 text-xs">
                  +{module.learningObjectives.length - 3} more objectives
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Action button */}
        {module.status !== 'locked' && (
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (module.status === 'current') {
                  const nextTask = module.tasks.find(task => task.status === 'not_started' || task.status === 'in_progress')
                  if (nextTask) {
                    onTaskStart(nextTask.id)
                  }
                }
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                module.status === 'completed'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : module.status === 'current'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {module.status === 'completed' ? 'Review' :
               module.status === 'current' ? 'Continue' :
               'Preview'}
            </button>
          </div>
        )}
      </div>

      {/* Expanded task list */}
      {isExpanded && !compact && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-200 bg-gray-50"
        >
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tasks</h4>
            <div className="space-y-2">
              {module.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTaskSelect(task)
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    task.status === 'completed'
                      ? 'border-green-200 bg-green-50 hover:bg-green-100'
                      : task.status === 'in_progress'
                      ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTaskIcon(task.type)}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">{task.title}</h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 capitalize">{task.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(task.estimatedTimeMinutes)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {task.status === 'completed' && (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      )}
                      {task.status !== 'completed' && module.status === 'current' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onTaskStart(task.id)
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default ModuleCard