import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  KeyIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  CogIcon,
  DocumentArrowDownIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

interface Tab {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  description: string
}

const tabs: Tab[] = [
  {
    id: 'llm',
    name: 'LLM Configuration',
    icon: KeyIcon,
    path: '/settings/llm',
    description: 'Configure AI providers and API keys',
  },
  {
    id: 'learning',
    name: 'Learning Preferences',
    icon: UserIcon,
    path: '/settings/learning',
    description: 'Customize your learning experience',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: BellIcon,
    path: '/settings/notifications',
    description: 'Manage notification preferences',
  },
  {
    id: 'privacy',
    name: 'Privacy & Security',
    icon: ShieldCheckIcon,
    path: '/settings/privacy',
    description: 'Control privacy and security settings',
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    icon: EyeIcon,
    path: '/settings/accessibility',
    description: 'Configure accessibility features and preferences',
  },
  {
    id: 'system',
    name: 'System',
    icon: CogIcon,
    path: '/settings/system',
    description: 'System preferences and appearance',
  },
  {
    id: 'data',
    name: 'Data Management',
    icon: DocumentArrowDownIcon,
    path: '/settings/data',
    description: 'Export data and account management',
  },
]

export default function SettingsTabs() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Default to LLM configuration if on base settings path
  const currentPath = location.pathname === '/settings' ? '/settings/llm' : location.pathname
  const activeTab = tabs.find(tab => tab.path === currentPath) || tabs[0]

  const handleTabClick = (tab: Tab) => {
    navigate(tab.path)
  }

  return (
    <div className="border-b border-gray-200">
      {/* Desktop Tabs */}
      <div className="hidden md:block">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab.id
            const Icon = tab.icon
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5 transition-colors
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Mobile Dropdown */}
      <div className="md:hidden">
        <select
          value={activeTab.id}
          onChange={(e) => {
            const tab = tabs.find(t => t.id === e.target.value)
            if (tab) handleTabClick(tab)
          }}
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.name}
            </option>
          ))}
        </select>
        
        {/* Active tab description */}
        <p className="mt-2 text-sm text-gray-600">
          {activeTab.description}
        </p>
      </div>
    </div>
  )
}
