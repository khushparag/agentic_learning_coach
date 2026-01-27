import { motion } from 'framer-motion'
import {
  BookOpenIcon,
  CodeBracketIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  PlusIcon,
  PlayIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import { QuickAction } from '../../types/dashboard'

interface QuickActionsProps {
  onAction: (actionId: string) => void
}

const quickActions: QuickAction[] = [
  {
    id: 'start_new_topic',
    title: 'Start New Topic',
    description: 'Begin learning something new',
    icon: 'BookOpenIcon',
    color: 'blue',
    action: () => console.log('Start new topic')
  },
  {
    id: 'practice_challenge',
    title: 'Practice Challenge',
    description: 'Test your skills with exercises',
    icon: 'CodeBracketIcon',
    color: 'green',
    action: () => console.log('Practice challenge')
  },
  {
    id: 'change_technologies',
    title: 'Change Technologies',
    description: 'Update your tech stack preferences',
    icon: 'WrenchScrewdriverIcon',
    color: 'indigo',
    action: () => console.log('Change technologies')
  },
  {
    id: 'take_quiz',
    title: 'Take Quiz',
    description: 'Assess your knowledge',
    icon: 'AcademicCapIcon',
    color: 'purple',
    action: () => console.log('Take quiz')
  },
  {
    id: 'view_progress',
    title: 'View Progress',
    description: 'Check your learning analytics',
    icon: 'ChartBarIcon',
    color: 'orange',
    action: () => console.log('View progress')
  },
  {
    id: 'join_study_group',
    title: 'Join Study Group',
    description: 'Learn with peers',
    icon: 'UserGroupIcon',
    color: 'pink',
    action: () => console.log('Join study group')
  },
  {
    id: 'customize_plan',
    title: 'Customize Plan',
    description: 'Adjust your learning path',
    icon: 'CogIcon',
    color: 'gray',
    action: () => console.log('Customize plan')
  }
]

function getIcon(iconName: string) {
  const icons = {
    BookOpenIcon,
    CodeBracketIcon,
    AcademicCapIcon,
    ChartBarIcon,
    UserGroupIcon,
    CogIcon,
    PlusIcon,
    PlayIcon,
    WrenchScrewdriverIcon
  }
  return icons[iconName as keyof typeof icons] || BookOpenIcon
}

function getColorClasses(color: string) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      hover: 'hover:bg-blue-100 hover:border-blue-300'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      hover: 'hover:bg-green-100 hover:border-green-300'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      hover: 'hover:bg-purple-100 hover:border-purple-300'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      hover: 'hover:bg-orange-100 hover:border-orange-300'
    },
    pink: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      icon: 'text-pink-600',
      hover: 'hover:bg-pink-100 hover:border-pink-300'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'text-gray-600',
      hover: 'hover:bg-gray-100 hover:border-gray-300'
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      icon: 'text-indigo-600',
      hover: 'hover:bg-indigo-100 hover:border-indigo-300'
    }
  }
  
  return colorMap[color as keyof typeof colorMap] || colorMap.blue
}

interface QuickActionCardProps {
  action: QuickAction
  onClick: () => void
  index: number
}

function QuickActionCard({ action, onClick, index }: QuickActionCardProps) {
  const Icon = getIcon(action.icon)
  const colors = getColorClasses(action.color)

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 border-dashed transition-all text-left group ${colors.bg} ${colors.border} ${colors.hover}`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{action.title}</h3>
          <p className="text-xs text-gray-600 truncate">{action.description}</p>
        </div>
        <PlayIcon className={`w-4 h-4 ${colors.icon} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
      </div>
    </motion.button>
  )
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          Customize
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {quickActions.map((action, index) => (
          <QuickActionCard
            key={action.id}
            action={action}
            onClick={() => onAction(action.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}