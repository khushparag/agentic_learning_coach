import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboard } from '../../hooks/useDashboard'
import { useComprehensiveDashboard } from '../../hooks/api/useComprehensiveDashboard'
import { useWebSocketContext } from '../../contexts/WebSocketContext'
import { useProgressWebSocketUpdates } from '../../hooks/useWebSocket'
import DashboardGrid, { DashboardWidget } from '../../components/dashboard/DashboardGrid'
import StatsCards from '../../components/dashboard/StatsCards'
import TodayTasks from '../../components/dashboard/TodayTasks'
import ProgressAnalytics from '../../components/dashboard/ProgressAnalytics'
import TaskManagement from '../../components/dashboard/TaskManagement'
import QuickActions from '../../components/dashboard/QuickActions'
import TaskDetailModal from '../../components/dashboard/TaskDetailModal'
import { TodayTask } from '../../types/dashboard'
import { 
  BellIcon, 
  ArrowPathIcon,
  EyeIcon,
  ChartBarIcon,
  ListBulletIcon,
  SparklesIcon,
  WifiIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const {
    stats,
    todayTasks,
    progressMetrics,
    isLoadingStats,
    isLoadingTasks,
    isLoadingMetrics,
    updateTaskStatus,
    refreshDashboard
  } = useDashboard()

  // Get comprehensive dashboard data
  const { dashboard, isLoading: isLoadingComprehensive } = useComprehensiveDashboard('current-user')
  
  // WebSocket connections for real-time updates
  const { isConnected, connectionStates } = useWebSocketContext()
  const { progressUpdates } = useProgressWebSocketUpdates(user?.id)

  const [selectedTask, setSelectedTask] = useState<TodayTask | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'tasks'>('overview')
  const [showNotifications, setShowNotifications] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Handle real-time progress updates
  useEffect(() => {
    if (progressUpdates.length > 0) {
      const latestUpdate = progressUpdates[progressUpdates.length - 1]
      
      // Show appropriate toast messages
      if (latestUpdate.type === 'task_completed') {
        setToastMessage(`✅ Task "${latestUpdate.taskName}" completed! +${latestUpdate.xp || 0} XP`)
      } else if (latestUpdate.type === 'module_completed') {
        setToastMessage(`🎉 Module "${latestUpdate.moduleName}" completed! Great progress!`)
      }
    }
  }, [progressUpdates])

  // Connection status indicator
  const getConnectionStatus = () => {
    const connectedCount = Object.values(connectionStates).filter(Boolean).length
    const totalConnections = Object.keys(connectionStates).length
    
    if (connectedCount === totalConnections && totalConnections > 0) {
      return { status: 'connected', text: 'All systems connected', color: 'text-green-600' }
    } else if (connectedCount > 0) {
      return { status: 'partial', text: `${connectedCount}/${totalConnections} connected`, color: 'text-yellow-600' }
    } else {
      return { status: 'disconnected', text: 'Offline mode', color: 'text-gray-500' }
    }
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    const userName = user?.name || 'there'
    
    if (hour < 12) return `Good morning, ${userName}!`
    if (hour < 17) return `Good afternoon, ${userName}!`
    return `Good evening, ${userName}!`
  }

  const getMotivationalMessage = () => {
    if (!dashboard) return "Ready to continue your learning journey?"
    
    if (dashboard.gamification?.currentStreak >= 7) {
      return `Amazing ${dashboard.gamification.currentStreak}-day streak! Keep it going! 🔥`
    }
    
    if (dashboard.todaysFocus?.completedTasks === dashboard.todaysFocus?.totalTasks && dashboard.todaysFocus?.totalTasks > 0) {
      return "All tasks completed for today! You're on fire! 🎉"
    }
    
    if (dashboard.todaysFocus?.remainingTasks > 0) {
      return `${dashboard.todaysFocus.remainingTasks} tasks remaining today. You've got this! 💪`
    }
    
    return dashboard.gamification?.motivationalMessage || "Ready to learn something new today?"
  }

  const getNotificationCount = () => {
    if (!dashboard) return 0
    
    let count = 0
    if (dashboard.notifications?.streakAtRisk) count++
    if (dashboard.notifications?.hasNewAchievements) count++
    if (dashboard.notifications?.hasPendingChallenges) count++
    if (dashboard.notifications?.needsReview) count++
    
    return count
  }

  const handleTaskAction = async (taskId: string, action: 'start' | 'pause' | 'complete') => {
    try {
      const statusMap = {
        start: 'in_progress' as const,
        pause: 'not_started' as const,
        complete: 'completed' as const
      }
      await updateTaskStatus(taskId, statusMap[action])
      
      if (action === 'complete') {
        setToastMessage('✅ Task completed! Great job!')
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      setToastMessage('❌ Failed to update task. Please try again.')
    }
  }

  const handleTaskClick = (task: TodayTask) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'start_new_topic':
        window.location.href = '/learning-path'
        break
      case 'practice_challenge':
        window.location.href = '/exercises'
        break
      case 'change_technologies':
        window.location.href = '/onboarding'
        break
      case 'take_quiz':
        console.log('Navigate to quiz')
        break
      case 'view_progress':
        setActiveView('analytics')
        break
      case 'join_study_group':
        window.location.href = '/social'
        break
      case 'customize_plan':
        window.location.href = '/settings'
        break
      default:
        console.log('Unknown action:', actionId)
    }
  }

  const isLoading = isLoadingStats || isLoadingTasks || isLoadingMetrics || isLoadingComprehensive

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
                {isConnected && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Live Updates</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600">{getMotivationalMessage()}</p>
              
              {/* Progress indicator */}
              {dashboard?.todaysFocus && (
                <div className="mt-3 flex items-center space-x-4">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Today's Progress</span>
                      <span>{dashboard.todaysFocus.completedTasks}/{dashboard.todaysFocus.totalTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dashboard.todaysFocus.progressPercentage}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                      />
                    </div>
                  </div>
                  {dashboard.gamification?.currentStreak > 0 && (
                    <div className="flex items-center space-x-1 text-orange-600">
                      <SparklesIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{dashboard.gamification.currentStreak} day streak</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200">
                <WifiIcon className={`w-4 h-4 ${getConnectionStatus().color}`} />
                <span className={`text-xs font-medium ${getConnectionStatus().color}`}>
                  {getConnectionStatus().text}
                </span>
              </div>
              
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                {getNotificationCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {getNotificationCount()}
                  </span>
                )}
              </button>
              
              <button
                onClick={refreshDashboard}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh dashboard"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
              
              <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'overview'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'analytics'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  Analytics
                </button>
                <button
                  onClick={() => setActiveView('tasks')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'tasks'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4 mr-2" />
                  Tasks
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards - Always visible */}
        <div className="mb-8">
          <StatsCards stats={stats || { 
            currentStreak: 0, 
            weeklyXP: 0, 
            totalXP: 0, 
            completedTasks: 0, 
            totalTasks: 0, 
            level: 1, 
            nextLevelXP: 100, 
            achievements: [],
            learningTimeHours: 0,
            successRate: 0,
            skillsLearned: 0
          }} isLoading={isLoadingStats} />
        </div>

        {/* Notifications Panel */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                <div className="space-y-3">
                  {dashboard?.notifications?.streakAtRisk && (
                    <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-orange-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">Streak at risk!</p>
                        <p className="text-xs text-orange-600">Complete a task today to maintain your streak</p>
                      </div>
                    </div>
                  )}
                  
                  {dashboard?.notifications?.hasNewAchievements && (
                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-green-800">New achievements unlocked!</p>
                        <p className="text-xs text-green-600">Check your achievements page to see what you've earned</p>
                      </div>
                    </div>
                  )}
                  
                  {dashboard?.notifications?.hasPendingChallenges && (
                    <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Pending challenges</p>
                        <p className="text-xs text-blue-600">You have challenges waiting for your response</p>
                      </div>
                    </div>
                  )}
                  
                  {getNotificationCount() === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Content Based on Active View */}
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardGrid>
                {/* Today's Tasks - Primary focus */}
                <DashboardWidget colSpan={8} title="Today's Tasks">
                  <TodayTasks
                    tasks={todayTasks}
                    onTaskAction={handleTaskAction}
                    onTaskClick={handleTaskClick}
                    isLoading={isLoadingTasks}
                  />
                </DashboardWidget>

                {/* Quick Actions */}
                <DashboardWidget colSpan={4}>
                  <QuickActions onAction={handleQuickAction} />
                </DashboardWidget>

                {/* Progress Overview - Secondary */}
                {dashboard?.progressMetrics && (
                  <DashboardWidget colSpan={6} title="Progress Overview">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {dashboard.progressMetrics.summary?.overall_progress || 0}%
                          </div>
                          <div className="text-sm text-blue-600">Overall Progress</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {dashboard.gamification?.currentLevel || 1}
                          </div>
                          <div className="text-sm text-green-600">Current Level</div>
                        </div>
                      </div>
                      
                      {dashboard.progressMetrics.recommendations && dashboard.progressMetrics.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                          <div className="space-y-2">
                            {dashboard.progressMetrics.recommendations.slice(0, 3).map((rec: string, index: number) => (
                              <div key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DashboardWidget>
                )}

                {/* Recent Achievements */}
                {dashboard?.gamification?.profile && (
                  <DashboardWidget colSpan={6} title="Recent Achievements">
                    <div className="space-y-3">
                      {dashboard.gamification.profile.recent_xp_events?.slice(0, 5).map((event: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-yellow-600 text-sm">+{event.xp_earned}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{event.event_type?.replace('_', ' ')}</p>
                              <p className="text-xs text-gray-500">{event.source}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </DashboardWidget>
                )}
              </DashboardGrid>
            </motion.div>
          )}

          {activeView === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <ProgressAnalytics
                metrics={progressMetrics || { 
                  learningVelocity: [], 
                  activityHeatmap: [], 
                  performanceMetrics: { accuracy: 0, speed: 0, consistency: 0, retention: 0 },
                  knowledgeRetention: [],
                  weeklyProgress: [] 
                }}
                isLoading={isLoadingMetrics}
              />
            </motion.div>
          )}

          {activeView === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardGrid>
                <DashboardWidget colSpan={12}>
                  <TaskManagement
                    tasks={todayTasks}
                    onTaskAction={handleTaskAction}
                    onTaskClick={handleTaskClick}
                    isLoading={isLoadingTasks}
                  />
                </DashboardWidget>
              </DashboardGrid>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Detail Modal */}
        <TaskDetailModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false)
            setSelectedTask(null)
          }}
          onAction={(action) => {
            if (selectedTask) {
              handleTaskAction(selectedTask.id, action)
            }
          }}
        />

        {/* Toast Notifications */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{toastMessage}</span>
                <button
                  onClick={() => setToastMessage(null)}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-700">Loading dashboard...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
