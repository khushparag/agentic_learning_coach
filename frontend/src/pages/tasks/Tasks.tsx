import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { TaskManagementInterface } from '../../components/tasks'
import { useAuth } from '../../contexts/AuthContext'
import { 
  BellIcon,
  Cog6ToothIcon,
  PlusIcon,
  CalendarIcon,
  ChartBarIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline'
import { Toast } from '../../components/ui/Toast'

interface TasksPageProps {
  // Optional props for customization
}

const TasksPage: React.FC<TasksPageProps> = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all')

  // Get module filter from URL params
  const moduleId = searchParams.get('module')

  // Handle task completion
  const handleTaskComplete = (taskId: string) => {
    setToastMessage('✅ Task completed! Great job!')
    // In real implementation, this would trigger API call and optimistic updates
    console.log('Task completed:', taskId)
  }

  // Handle task start
  const handleTaskStart = (taskId: string) => {
    setToastMessage('🚀 Task started! You\'ve got this!')
    // In real implementation, this would trigger API call and optimistic updates
    console.log('Task started:', taskId)
  }

  // Handle tab change
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    // Update URL params to maintain state
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', tab)
    setSearchParams(newParams)
  }

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create_task':
        // Navigate to task creation (if implemented)
        console.log('Create new task')
        break
      case 'schedule_session':
        // Navigate to scheduling
        navigate('/schedule')
        break
      case 'view_calendar':
        // Navigate to calendar view
        navigate('/calendar')
        break
      case 'view_analytics':
        // Navigate to analytics
        navigate('/analytics')
        break
      case 'join_study_group':
        // Navigate to social features
        navigate('/social')
        break
      case 'settings':
        // Navigate to settings
        navigate('/settings')
        break
      default:
        console.log('Unknown action:', action)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Task Management
              </h1>
              <p className="text-gray-600 mt-1">
                Organize, track, and complete your learning tasks efficiently
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleQuickAction('create_task')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Task
              </button>

              <button
                onClick={() => handleQuickAction('schedule_session')}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Schedule
              </button>

              <button
                onClick={() => handleQuickAction('view_analytics')}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Analytics
              </button>

              <button
                onClick={() => handleQuickAction('settings')}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Cog6ToothIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', label: 'All Tasks', icon: null },
                { id: 'today', label: 'Today', icon: CalendarIcon },
                { id: 'upcoming', label: 'Upcoming', icon: BellIcon },
                { id: 'completed', label: 'Completed', icon: BookmarkIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as typeof activeTab)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon && <tab.icon className="w-4 h-4 mr-2" />}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Task Management Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TaskManagementInterface
            userId={user?.id}
            moduleId={moduleId || undefined}
            showHeader={false} // We're showing our own header
            enableRealTimeUpdates={true}
            onTaskComplete={handleTaskComplete}
            onTaskStart={handleTaskStart}
          />
        </motion.div>

        {/* Toast Notifications */}
        {toastMessage && (
          <Toast
            id="task-toast"
            title="Task Update"
            message={toastMessage}
            type="success"
            isVisible={!!toastMessage}
            onClose={() => setToastMessage(null)}
          />
        )}
      </div>
    </div>
  )
}

export default TasksPage
