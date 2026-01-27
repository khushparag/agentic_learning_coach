import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayIcon,
  PauseIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  CodeBracketIcon,
  AcademicCapIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import { TodayTask } from '../../types/dashboard'

interface TodayTasksProps {
  tasks: TodayTask[]
  onTaskAction: (taskId: string, action: 'start' | 'pause' | 'complete') => void
  onTaskClick: (task: TodayTask) => void
  isLoading?: boolean
}

interface TaskCardProps {
  task: TodayTask
  onAction: (action: 'start' | 'pause' | 'complete') => void
  onClick: () => void
}

function TaskCard({ task, onAction, onClick }: TaskCardProps) {
  const getTypeIcon = (type: TodayTask['type']) => {
    switch (type) {
      case 'exercise':
        return CodeBracketIcon
      case 'reading':
        return BookOpenIcon
      case 'project':
        return CubeIcon
      case 'quiz':
        return AcademicCapIcon
      default:
        return BookOpenIcon
    }
  }

  const getTypeColor = (type: TodayTask['type']) => {
    switch (type) {
      case 'exercise':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'reading':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'project':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'quiz':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: TodayTask['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: TodayTask['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'in_progress':
        return 'bg-blue-50 border-blue-200'
      case 'not_started':
        return 'bg-white border-gray-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const getActionButton = () => {
    switch (task.status) {
      case 'not_started':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAction('start')
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            Start
          </button>
        )
      case 'in_progress':
        return (
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction('pause')
              }}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <PauseIcon className="w-4 h-4 mr-1" />
              Pause
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction('complete')
              }}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckIcon className="w-4 h-4 mr-1" />
              Complete
            </button>
          </div>
        )
      case 'completed':
        return (
          <div className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
            <CheckIcon className="w-4 h-4 mr-2" />
            Completed
          </div>
        )
      default:
        return null
    }
  }

  const TypeIcon = getTypeIcon(task.type)
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${getStatusColor(task.status)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg border ${getTypeColor(task.type)}`}>
              <TypeIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{task.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              {task.estimatedMinutes}m
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className="text-gray-400">•</span>
            <span>{task.moduleName}</span>
            {isOverdue && (
              <>
                <span className="text-gray-400">•</span>
                <span className="flex items-center text-red-600">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  Overdue
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0">
          {getActionButton()}
        </div>
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="flex space-x-4">
              <div className="h-3 bg-gray-200 rounded w-12"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TodayTasks({ tasks, onTaskAction, onTaskClick, isLoading = false }: TodayTasksProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress'>('all')

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending':
        return task.status === 'not_started'
      case 'in_progress':
        return task.status === 'in_progress'
      default:
        return task.status !== 'completed'
    }
  })

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const totalCount = tasks.length

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
          <p className="text-sm text-gray-600">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'in_progress'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            In Progress
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onAction={(action) => onTaskAction(task.id, action)}
                onClick={() => onTaskClick(task)}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tasks found for the selected filter</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
