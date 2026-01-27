import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  ClockIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  LinkIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  LightBulbIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  BeakerIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/solid'
import { LearningTask, LearningResource, TaskSubmission } from '../../types/learning-path'
import { learningPathService } from '../../services/learningPathService'
import { TasksService } from '../../services/tasksService'

interface TaskDetailsModalProps {
  task: LearningTask
  onClose: () => void
  onStart: () => void
}

interface TaskAnalytics {
  averageScore: number
  averageTime: number
  successRate: number
  commonMistakes: string[]
  helpfulHints: string[]
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  onClose,
  onStart
}) => {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'submissions' | 'analytics' | 'hints'>('overview')
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(null)
  const [hints, setHints] = useState<string[]>([])
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  // Load comprehensive task data
  useEffect(() => {
    const loadTaskData = async () => {
      setLoading(true)
      try {
        const [submissionHistory, analytics, taskHints] = await Promise.all([
          loadSubmissions(),
          loadTaskAnalytics(),
          loadTaskHints()
        ])
        setSubmissions(submissionHistory)
        setTaskAnalytics(analytics)
        setHints(taskHints)
      } catch (error) {
        console.error('Failed to load task data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTaskData()
  }, [task.id])

  const loadSubmissions = async (): Promise<TaskSubmission[]> => {
    if (task.submissions && task.submissions.length > 0) {
      return task.submissions
    }
    try {
      return await learningPathService.getTaskSubmissions(task.id)
    } catch (error) {
      console.error('Failed to load submissions:', error)
      return []
    }
  }

  const loadTaskAnalytics = async (): Promise<TaskAnalytics> => {
    // Simulate analytics data - in real app, this would come from API
    return {
      averageScore: 78.5,
      averageTime: task.estimatedTimeMinutes * 1.3,
      successRate: 0.82,
      commonMistakes: [
        'Forgetting to handle edge cases',
        'Incorrect variable naming',
        'Missing error handling'
      ],
      helpfulHints: [
        'Start with the simplest case first',
        'Test your solution with different inputs',
        'Read the requirements carefully'
      ]
    }
  }

  const loadTaskHints = async (): Promise<string[]> => {
    try {
      const hintResponse = await TasksService.getTaskHint(task.id, 0)
      return [hintResponse.hint]
    } catch (error) {
      return task.requirements || []
    }
  }

  const loadNextHint = async () => {
    try {
      const hintResponse = await TasksService.getTaskHint(task.id, currentHintIndex + 1)
      setHints(prev => [...prev, hintResponse.hint])
      setCurrentHintIndex(prev => prev + 1)
    } catch (error) {
      console.error('No more hints available')
    }
  }

  const refreshTaskData = async () => {
    setRefreshing(true)
    try {
      const updatedTask = await learningPathService.getTaskDetails(task.id)
      // Update task data if needed
    } catch (error) {
      console.error('Failed to refresh task data:', error)
    } finally {
      setRefreshing(false)
    }
  }
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'resources':
        return renderResourcesTab()
      case 'submissions':
        return renderSubmissionsTab()
      case 'analytics':
        return renderAnalyticsTab()
      case 'hints':
        return renderHintsTab()
      default:
        return renderOverviewTab()
    }
  }

  const renderOverviewTab = () => (
    <div className="p-6 space-y-6">
      {/* Description */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
        <p className="text-gray-700 leading-relaxed">{task.description}</p>
      </div>

      {/* Task metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center text-gray-600 mb-1">
            <ClockIcon className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Estimated Time</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatTime(task.estimatedTimeMinutes)}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center text-gray-600 mb-1">
            <StarIcon className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Points</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{task.points} XP</p>
        </div>
      </div>

      {/* Requirements */}
      {task.requirements && task.requirements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
          <div className="space-y-3">
            {task.requirements.map((requirement, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{requirement}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance metrics */}
      {submissions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Performance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
              <div className="text-sm text-gray-600">Attempts</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...submissions.map(s => s.score || 0))}%
              </div>
              <div className="text-sm text-gray-600">Best Score</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)}%
              </div>
              <div className="text-sm text-gray-600">Average</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveTab('hints')}
            className="flex items-center justify-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <LightBulbIcon className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">View Hints</span>
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <BookOpenIcon className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">Resources</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderResourcesTab = () => (
    <div className="p-6">
      {task.resources && task.resources.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Learning Resources</h3>
            <button
              onClick={refreshTaskData}
              disabled={refreshing}
              className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {task.resources.map((resource) => (
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
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No resources available for this task</p>
        </div>
      )}
    </div>
  )

  const renderSubmissionsTab = () => (
    <div className="p-6">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading submission history...</p>
        </div>
      ) : submissions.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission History</h3>
          {submissions.map((submission, index) => (
            <div
              key={submission.id || index}
              className="p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    submission.status === 'passed' ? 'bg-green-500' :
                    submission.status === 'failed' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">
                    Attempt #{submissions.length - index}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleDateString()} at{' '}
                    {new Date(submission.submittedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {submission.score !== undefined && (
                    <span className="text-sm font-medium text-gray-900">
                      {submission.score}%
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    submission.status === 'passed' ? 'bg-green-100 text-green-800' :
                    submission.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.status}
                  </span>
                </div>
              </div>
              
              {submission.feedback && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Feedback</h5>
                  <p className="text-sm text-gray-600">
                    Score: {submission.feedback.score}% - {submission.feedback.passed ? 'Passed' : 'Failed'}
                  </p>
                  {submission.feedback.suggestions && submission.feedback.suggestions.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                      {submission.feedback.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No submissions yet</p>
          <p className="text-sm mt-1">Start the task to begin tracking your progress</p>
        </div>
      )}
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="p-6 space-y-6">
      {taskAnalytics ? (
        <>
          {/* Performance metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {(taskAnalytics.successRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Avg. Score</p>
                    <p className="text-2xl font-bold text-green-900">
                      {taskAnalytics.averageScore.toFixed(0)}%
                    </p>
                  </div>
                  <StarIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Avg. Time</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {formatTime(taskAnalytics.averageTime)}
                    </p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Common mistakes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Mistakes</h3>
            <div className="space-y-2">
              {taskAnalytics.commonMistakes.map((mistake, index) => (
                <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg border border-red-200">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{mistake}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Helpful tips */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Tips</h3>
            <div className="space-y-2">
              {taskAnalytics.helpfulHints.map((tip, index) => (
                <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
                  <LightBulbIcon className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{tip}</span>
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

  const renderHintsTab = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Hints & Tips</h3>
        <span className="text-sm text-gray-500">
          {hints.length} hint{hints.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {hints.length > 0 ? (
        <div className="space-y-3">
          {hints.map((hint, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
            >
              <div className="flex items-start">
                <div className="flex items-center justify-center w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full text-sm font-bold mr-3 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">{hint}</p>
                </div>
              </div>
            </motion.div>
          ))}
          
          <button
            onClick={loadNextHint}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            <LightBulbIcon className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm">Need another hint?</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <LightBulbIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No hints available for this task</p>
          <p className="text-sm mt-1">Try working through the requirements step by step</p>
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

  const getStatusBadge = () => {
    switch (task.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Completed
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <PlayIcon className="w-4 h-4 mr-1" />
            In Progress
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
            Not Started
          </span>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with enhanced tabs */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              {getTaskIcon(task.type)}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
                <div className="flex items-center space-x-3 mt-2">
                  {getStatusBadge()}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(task.difficulty)}`}>
                    {task.difficulty}
                  </span>
                  <span className="text-sm text-gray-500 capitalize">{task.type}</span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshTaskData}
                disabled={refreshing}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh task data"
              >
                <ArrowPathIcon className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Enhanced tab navigation */}
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
              onClick={() => setActiveTab('resources')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'resources'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpenIcon className="w-4 h-4 inline mr-2" />
              Resources ({task.resources?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('hints')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'hints'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LightBulbIcon className="w-4 h-4 inline mr-2" />
              Hints ({hints.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'submissions'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardDocumentListIcon className="w-4 h-4 inline mr-2" />
              History ({submissions.length})
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

        {/* Content with enhanced tabs */}
        <div className="overflow-y-auto max-h-[calc(90vh-250px)]">
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

        {/* Enhanced footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <UserIcon className="w-4 h-4 mr-1" />
                Task ID: {task.id.slice(0, 8)}...
              </span>
              <span className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Updated: {new Date(task.updatedAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              
              {task.status !== 'completed' && (
                <button
                  onClick={onStart}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {task.status === 'in_progress' ? 'Continue Task' : 'Start Task'}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default TaskDetailsModal
