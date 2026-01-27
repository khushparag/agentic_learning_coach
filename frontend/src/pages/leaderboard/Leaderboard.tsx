/**
 * Leaderboard Page
 * Main page for displaying leaderboards, competitions, and competitive analytics
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrophyIcon,
  ChartBarIcon,
  FireIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { 
  GlobalLeaderboard,
  CompetitionInterface,
  CompetitiveAnalytics,
  RealTimeLeaderboard,
} from '../../components/leaderboard'
import { Card, Button, Badge } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'

type TabType = 'global' | 'competitions' | 'analytics' | 'live'

interface LeaderboardTab {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const tabs: LeaderboardTab[] = [
  {
    id: 'global',
    label: 'Global Rankings',
    icon: TrophyIcon,
    description: 'Overall XP and achievement leaderboards'
  },
  {
    id: 'competitions',
    label: 'Competitions',
    icon: FireIcon,
    description: 'Active and upcoming coding competitions'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: ChartBarIcon,
    description: 'Performance insights and competitive analysis'
  },
  {
    id: 'live',
    label: 'Live Events',
    icon: UserGroupIcon,
    description: 'Real-time competitions and challenges'
  }
]

export const Leaderboard: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('global')
  const [showSettings, setShowSettings] = useState(false)

  const renderTabContent = () => {
    switch (activeTab) {
      case 'global':
        return (
          <div className="space-y-6">
            <GlobalLeaderboard 
              showFilters={true}
              maxEntries={50}
              refreshInterval={30000}
            />
          </div>
        )
      
      case 'competitions':
        return (
          <div className="space-y-6">
            <CompetitionInterface 
              showUpcoming={true}
              showCompleted={true}
              maxCompetitions={10}
            />
          </div>
        )
      
      case 'analytics':
        return (
          <div className="space-y-6">
            <CompetitiveAnalytics 
              timeframe="month"
            />
          </div>
        )
      
      case 'live':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealTimeLeaderboard 
                leaderboardId="global-live"
                showUserHighlight={true}
                maxEntries={10}
              />
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Challenges</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-900">Speed Coding Challenge</h4>
                      <Badge variant="success" size="sm">Live</Badge>
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                      Complete algorithm challenges as fast as possible
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600">47 participants</span>
                      <Button size="sm">Join Now</Button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900">Code Golf Tournament</h4>
                      <Badge variant="primary" size="sm">Starting Soon</Badge>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Write the shortest possible solutions
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-600">Starts in 15 minutes</span>
                      <Button variant="outline" size="sm">Register</Button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Best Practices Battle</h4>
                      <Badge variant="secondary" size="sm">Upcoming</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Focus on code quality and maintainability
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tomorrow at 2 PM</span>
                      <Button variant="outline" size="sm">Set Reminder</Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <TrophyIcon className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Leaderboards</h1>
                <p className="text-sm text-gray-600">Compete, compare, and climb the rankings</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Welcome back!</p>
                  <p className="text-xs text-gray-600">Ready to compete?</p>
                </div>
              )}
              
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500"
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Description */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-blue-700">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refresh Interval
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="10">10 seconds</option>
                  <option value="30" selected>30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Show rank changes</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Highlight my position</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Sound notifications</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => setShowSettings(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={() => setShowSettings(false)}>
                Save Settings
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Leaderboard
