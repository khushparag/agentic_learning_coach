import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  EyeIcon, 
  Squares2X2Icon, 
  ChartBarIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon
} from '@heroicons/react/24/solid'
import { useLearningPath } from '../../hooks/useLearningPath'
import { useProgressWebSocket } from '../../hooks/useProgressWebSocket'
import { useTaskNavigation } from '../../hooks/useTaskNavigation'
import LearningPathViewer from '../../components/learning-path/LearningPathViewer'
import ProgressTrackingVisualization from '../../components/learning-path/ProgressTrackingVisualization'
import ModuleDetailView from '../../components/learning-path/ModuleDetailView'
import NavigationLoadingOverlay from '../../components/ui/NavigationLoadingOverlay'
import { LearningModule } from '../../types/learning-path'

type ViewMode = 'overview' | 'progress' | 'module-detail'

interface Notification {
  id: string
  type: 'success' | 'info' | 'warning'
  message: string
  timestamp: Date
}

export default function LearningPath() {
  // Get current user ID (in a real app, this would come from auth context)
  const userId = sessionStorage.getItem('demo_user_id') || 'demo-user'

  const {
    learningPath,
    modules,
    progressStats,
    selectedModule,
    expandedModules,
    loading,
    error,
    isConnected,
    lastUpdated,
    selectModule,
    toggleModuleExpansion,
    startTask,
    completeTask,
    refreshData,
    syncProgress
  } = useLearningPath(userId)

  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Use the new task navigation hook with proper error handling
  const { navigateToTask, isNavigating, navigationError, clearError } = useTaskNavigation({
    onError: (error) => {
      console.error('Navigation error:', error)
      setNotifications(prev => [{
        id: `nav-error-${Date.now()}`,
        type: 'warning',
        message: `⚠️ ${error.message}`,
        timestamp: new Date()
      }, ...prev.slice(0, 4)])
    },
    onLoadingChange: (loading) => {
      // Loading state is managed by isNavigating
      console.log('Navigation loading state:', loading)
    }
  })

  // WebSocket for real-time notifications
  useProgressWebSocket({
    userId,
    enabled: true,
    onMessage: (message) => {
      // Add notification for important events
      if (message.type === 'achievement_unlocked' && message.data.achievement) {
        setNotifications(prev => [{
          id: `achievement-${Date.now()}`,
          type: 'success',
          message: `🏆 Achievement unlocked: ${message.data.achievement?.name ?? 'Unknown'}!`,
          timestamp: new Date()
        }, ...prev.slice(0, 4)]) // Keep only last 5 notifications
      } else if (message.type === 'task_completed') {
        setNotifications(prev => [{
          id: `task-${Date.now()}`,
          type: 'success',
          message: '✅ Task completed successfully!',
          timestamp: new Date()
        }, ...prev.slice(0, 4)])
      } else if (message.type === 'module_completed') {
        setNotifications(prev => [{
          id: `module-${Date.now()}`,
          type: 'success',
          message: '🎉 Module completed! Great progress!',
          timestamp: new Date()
        }, ...prev.slice(0, 4)])
      }
    }
  })

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(0, -1))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notifications])

  const handleTaskStart = async (taskId: string): Promise<void> => {
    try {
      // Clear any previous navigation errors
      clearError()
      
      // Try to start task (may fail if endpoint doesn't exist yet)
      // Don't let API failure block navigation - graceful degradation
      try {
        await startTask(taskId)
      } catch (apiError: any) {
        // Log but continue - graceful degradation
        console.warn('Task start API call failed, continuing with navigation:', apiError)
        
        // Show informative notification based on error type
        const errorMessage = apiError?.response?.status === 404
          ? '⚠️ Task tracking unavailable. You can still work on the task.'
          : apiError?.response?.status === 403
          ? '⚠️ You don\'t have permission to access this task.'
          : apiError?.message?.includes('Network Error')
          ? '⚠️ Offline mode active. Progress will sync when connection returns.'
          : '⚠️ Unable to track task start. Continuing anyway.'
        
        setNotifications(prev => [{
          id: `info-${Date.now()}`,
          type: 'info',
          message: errorMessage,
          timestamp: new Date()
        }, ...prev.slice(0, 4)])
      }
      
      // Use the new navigation hook for safe, validated navigation
      // This will show loading overlay, validate task, and navigate
      await navigateToTask(taskId)
      
    } catch (error: any) {
      console.error('Failed to start task:', error)
      
      // Error notification is already handled by useTaskNavigation hook
      // Just log here for debugging
    }
  }

  const handleTaskComplete = async (taskId: string): Promise<void> => {
    try {
      await completeTask(taskId)
    } catch (error) {
      console.error('Failed to complete task:', error)
      setNotifications(prev => [{
        id: `error-${Date.now()}`,
        type: 'warning',
        message: '⚠️ Failed to mark task as complete. Please try again.',
        timestamp: new Date()
      }, ...prev.slice(0, 4)])
    }
  }

  const handleTaskSelect = (): void => {
    // Task selection is handled by navigation in handleTaskStart
  }

  const handleModuleSelect = (module: LearningModule): void => {
    selectModule(module)
    if (viewMode !== 'module-detail') {
      setViewMode('module-detail')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your learning path...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Learning Path</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!learningPath) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Squares2X2Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Learning Path Found</h2>
          <p className="text-gray-600 mb-4">
            It looks like you haven't set up your learning path yet. Complete the onboarding process to get started.
          </p>
          <button
            onClick={() => window.location.href = '/onboarding'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Onboarding
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Loading overlay - replaces old isGeneratingContent overlay */}
      <NavigationLoadingOverlay
        isLoading={isNavigating}
        message="Preparing your learning content..."
        showElapsedTime={true}
      />

      {/* Notifications */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 space-y-2"
          >
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className={`p-4 rounded-lg shadow-lg max-w-sm ${
                  notification.type === 'success' ? 'bg-green-50 border border-green-200' :
                  notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {notification.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />}
                  {notification.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5" />}
                  {notification.type === 'info' && <BoltIcon className="w-5 h-5 text-blue-500 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with view mode toggle and connection status */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Learning Path</h1>
            {/* Connection status indicator */}
            <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
          <p className="text-gray-600 mt-1">
            Track your progress and continue your learning journey
            {lastUpdated && (
              <span className="text-sm text-gray-500 ml-2">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setViewMode('progress')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'progress'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Progress
            </button>
          </div>

          <button
            onClick={syncProgress}
            disabled={isNavigating}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sync progress"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full p-6"
            >
              <LearningPathViewer
                learningPath={learningPath}
                onModuleSelect={handleModuleSelect}
                onTaskStart={handleTaskStart}
                selectedModule={selectedModule}
                className="h-full"
              />
            </motion.div>
          )}

          {viewMode === 'progress' && progressStats && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full p-6 overflow-y-auto"
            >
              <ProgressTrackingVisualization
                modules={modules}
                progressStats={progressStats}
                onModuleToggle={toggleModuleExpansion}
                expandedModules={expandedModules}
                isConnected={isConnected}
                lastUpdated={lastUpdated}
                onTaskStart={handleTaskStart}
                onTaskComplete={handleTaskComplete}
                onModuleSelect={handleModuleSelect}
                showDetailedView={true}
                enableRealTimeUpdates={true}
              />
            </motion.div>
          )}

          {viewMode === 'module-detail' && selectedModule && (
            <motion.div
              key="module-detail"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full p-6"
            >
              <ModuleDetailView
                module={selectedModule}
                onTaskStart={handleTaskStart}
                onTaskSelect={handleTaskSelect}
                onClose={() => setViewMode('overview')}
                className="h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}