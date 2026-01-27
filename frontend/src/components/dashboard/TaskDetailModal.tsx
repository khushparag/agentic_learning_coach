import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { motion } from 'framer-motion'
import {
  XMarkIcon,
  ClockIcon,
  BookOpenIcon,
  CodeBracketIcon,
  AcademicCapIcon,
  CubeIcon,
  PlayIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { TodayTask } from '../../types/dashboard'

interface TaskDetailModalProps {
  task: TodayTask | null
  isOpen: boolean
  onClose: () => void
  onAction: (action: 'start' | 'pause' | 'complete') => void
}

interface TaskResource {
  id: string
  title: string
  type: 'documentation' | 'tutorial' | 'example' | 'reference'
  url: string
  description?: string
}

// Mock resources for demonstration
const mockResources: TaskResource[] = [
  {
    id: '1',
    title: 'React Hooks Documentation',
    type: 'documentation',
    url: 'https://reactjs.org/docs/hooks-intro.html',
    description: 'Official React documentation for hooks'
  },
  {
    id: '2',
    title: 'useState Hook Tutorial',
    type: 'tutorial',
    url: 'https://example.com/usestate-tutorial',
    description: 'Interactive tutorial on useState hook'
  },
  {
    id: '3',
    title: 'useEffect Examples',
    type: 'example',
    url: 'https://example.com/useeffect-examples',
    description: 'Common useEffect patterns and examples'
  }
]

function TaskTypeIcon({ type }: { type: TodayTask['type'] }) {
  const iconClass = "w-6 h-6"
  
  switch (type) {
    case 'exercise':
      return <CodeBracketIcon className={iconClass} />
    case 'reading':
      return <BookOpenIcon className={iconClass} />
    case 'project':
      return <CubeIcon className={iconClass} />
    case 'quiz':
      return <AcademicCapIcon className={iconClass} />
    default:
      return <BookOpenIcon className={iconClass} />
  }
}

function TaskTypeColor({ type }: { type: TodayTask['type'] }) {
  switch (type) {
    case 'exercise':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'reading':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'project':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'quiz':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function ResourceItem({ resource }: { resource: TaskResource }) {
  const getResourceIcon = (type: TaskResource['type']) => {
    switch (type) {
      case 'documentation':
        return '📚'
      case 'tutorial':
        return '🎓'
      case 'example':
        return '💡'
      case 'reference':
        return '📖'
      default:
        return '📄'
    }
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
    >
      <span className="text-2xl mr-3">{getResourceIcon(resource.type)}</span>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {resource.title}
        </h4>
        {resource.description && (
          <p className="text-sm text-gray-600 truncate">{resource.description}</p>
        )}
      </div>
      <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
    </a>
  )
}

export default function TaskDetailModal({ task, isOpen, onClose, onAction }: TaskDetailModalProps) {
  if (!task) return null

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'

  const getActionButton = () => {
    switch (task.status) {
      case 'not_started':
        return (
          <button
            onClick={() => onAction('start')}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            Start Task
          </button>
        )
      case 'in_progress':
        return (
          <div className="flex space-x-3">
            <button
              onClick={() => onAction('pause')}
              className="flex items-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Pause
            </button>
            <button
              onClick={() => onAction('complete')}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <CheckIcon className="w-5 h-5 mr-2" />
              Complete
            </button>
          </div>
        )
      case 'completed':
        return (
          <div className="flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium">
            <CheckIcon className="w-5 h-5 mr-2" />
            Completed
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg border ${TaskTypeColor({ type: task.type })}`}>
                        <TaskTypeIcon type={task.type} />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-semibold text-gray-900 mb-2">
                          {task.title}
                        </Dialog.Title>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {task.estimatedMinutes} minutes
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {task.priority} priority
                          </span>
                          <span>{task.moduleName}</span>
                          {isOverdue && (
                            <span className="flex items-center text-red-600 font-medium">
                              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                      <p className="text-gray-700 leading-relaxed">{task.description}</p>
                    </div>

                    {/* Task Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-1">Type</h4>
                          <p className="text-gray-600 capitalize">{task.type}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                          <p className="text-gray-600 capitalize">{task.status.replace('_', ' ')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-1">Module</h4>
                          <p className="text-gray-600">{task.moduleName}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-1">Due Date</h4>
                          <p className="text-gray-600">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Learning Objectives */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Objectives</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700">Understand the fundamentals of React hooks</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700">Practice implementing useState and useEffect</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700">Build a functional component with state management</span>
                        </li>
                      </ul>
                    </div>

                    {/* Resources */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Resources</h3>
                      <div className="space-y-3">
                        {mockResources.map((resource) => (
                          <ResourceItem key={resource.id} resource={resource} />
                        ))}
                      </div>
                    </div>

                    {/* Instructions */}
                    {task.type === 'exercise' && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <ol className="space-y-2 text-gray-700">
                            <li>1. Read through the provided resources to understand React hooks</li>
                            <li>2. Create a new React component that uses useState to manage a counter</li>
                            <li>3. Add useEffect to log the counter value when it changes</li>
                            <li>4. Test your component and ensure it works correctly</li>
                            <li>5. Submit your solution for review</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Close
                    </button>
                    {getActionButton()}
                  </div>
                </motion.div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}