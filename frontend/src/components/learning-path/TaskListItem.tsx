import React from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  PlayCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  TrophyIcon,
  BookmarkIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid'
import { LearningTask, LearningModule } from '../../types/learning-path'

interface TaskListItemProps {
  task: LearningTask
  onStart: () => void
  onSelect: () => void
  moduleStatus: LearningModule['status']
  compact?: boolean
  showBookmark?: boolean
  isBookmarked?: boolean
  onToggleBookmark?: () => void
  showProgress?: boolean
  showMetadata?: boolean
}

const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  onStart,
  onSelect,
  moduleStatus,
  compact = false,
  showBookmark = false,
  isBookmarked = false,
  onToggleBookmark,
  showProgress = true,
  showMetadata = false
}) => {
  const getTaskIcon = (type: LearningTask['type']) => {
    const iconClass = "w-5 h-5"
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

  const getStatusIcon = (status: LearningTask['status']) => {
    const iconClass = "w-5 h-5"
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />
      case 'in_progress':
        return <PlayCircleIcon className={`${iconClass} text-blue-500`} />
      case 'failed':
        return <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />
      default:
        return <ClockIcon className={`${iconClass} text-gray-400`} />
    }
  }

  const getStatusColor = (status: LearningTask['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'in_progress':
        return 'border-blue-200 bg-blue-50'
      case 'failed':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
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

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const canStart = moduleStatus === 'current' && (task.status === 'not_started' || task.status === 'failed')
  const canContinue = moduleStatus === 'current' && task.status === 'in_progress'
  const isLocked = moduleStatus === 'locked'

  const getProgressPercentage = (): number => {
    if (task.status === 'completed') return 100
    if (task.status === 'in_progress') {
      // Estimate progress based on submissions
      if (task.submissions && task.submissions.length > 0) {
        const latestSubmission = task.submissions[task.submissions.length - 1]
        return latestSubmission.score || 50 // Default to 50% if in progress
      }
      return 25 // Default progress for in-progress tasks
    }
    return 0
  }

  const getBestScore = (): number => {
    if (!task.submissions || task.submissions.length === 0) return 0
    return Math.max(...task.submissions.map(s => s.score || 0))
  }

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.01 } : {}}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isLocked ? 'cursor-not-allowed opacity-60' : 'hover:shadow-md'
      } ${getStatusColor(task.status)} ${isBookmarked ? 'ring-2 ring-yellow-300' : ''}`}
      onClick={!isLocked ? onSelect : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {getTaskIcon(task.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-lg font-medium text-gray-900 pr-4">
                {task.title}
              </h4>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {showBookmark && onToggleBookmark && (
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
                    title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    <BookmarkIcon className="w-4 h-4" />
                  </button>
                )}
                {getStatusIcon(task.status)}
              </div>
            </div>
            
            {!compact && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Progress bar */}
            {showProgress && task.status !== 'not_started' && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs text-gray-500">{getProgressPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      task.status === 'failed' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage()}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(task.difficulty)}`}>
                  {task.difficulty}
                </span>
                <span className="text-gray-500 capitalize">{task.type}</span>
                <span className="flex items-center text-gray-500">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {formatTime(task.estimatedTimeMinutes)}
                </span>
                <span className="flex items-center text-gray-500">
                  <TrophyIcon className="w-4 h-4 mr-1" />
                  {task.points} XP
                </span>
                {task.submissions && task.submissions.length > 0 && (
                  <span className="flex items-center text-gray-500">
                    <ChartBarIcon className="w-4 h-4 mr-1" />
                    Best: {getBestScore()}%
                  </span>
                )}
              </div>
              
              {!isLocked && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect()
                    }}
                    className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <EyeIcon className="w-3 h-3 mr-1" />
                    Details
                  </button>

                  {task.status === 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect()
                      }}
                      className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200 transition-colors"
                    >
                      Review
                    </button>
                  )}
                  
                  {canStart && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStart()
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Start
                    </button>
                  )}
                  
                  {canContinue && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStart()
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Continue
                    </button>
                  )}
                  
                  {task.status === 'failed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStart()
                      }}
                      className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Metadata */}
            {showMetadata && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <UserIcon className="w-3 h-3 mr-1" />
                    ID: {task.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            )}
            
            {/* Requirements preview */}
            {!compact && task.requirements && task.requirements.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h5 className="text-xs font-medium text-gray-700 mb-1">Requirements:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {task.requirements.slice(0, 2).map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                      {requirement}
                    </li>
                  ))}
                  {task.requirements.length > 2 && (
                    <li className="text-gray-400">
                      +{task.requirements.length - 2} more requirements
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Submission history indicator */}
            {task.submissions && task.submissions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{task.submissions.length} attempt{task.submissions.length > 1 ? 's' : ''}</span>
                  <div className="flex items-center space-x-3">
                    <span>Best: {getBestScore()}%</span>
                    <span>
                      Latest: {new Date(task.submissions[task.submissions.length - 1].submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default TaskListItem
