/**
 * Gamification Dashboard - Complete gamification interface with XP, achievements, badges, and streaks
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGamificationWithUtils } from '../../hooks/api/useGamification'
import { useAuth } from '../../contexts/AuthContext'
import XPProgressBar from './XPProgressBar'
import AchievementGallery from './AchievementGallery'
import { BadgeCollection } from './BadgeCollection'
import StreakTracker from './StreakTracker'

interface GamificationDashboardProps {
  userId?: string
  className?: string
}

type TabType = 'overview' | 'achievements' | 'badges' | 'leaderboard'

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  userId,
  className = '',
}) => {
  const { user } = useAuth()
  const targetUserId = userId || user?.id || ''
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  const {
    profile,
    achievements,
    leaderboard,
    badgeShowcase,
    isLoading,
    isError,
    error,
    getMotivationalMessage,
    getNextAchievementSuggestions,
    calculateDailyXPGoal,
  } = useGamificationWithUtils(targetUserId)

  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: '📊' },
    { id: 'achievements' as TabType, name: 'Achievements', icon: '🏆' },
    { id: 'badges' as TabType, name: 'Badges', icon: '🎖️' },
    { id: 'leaderboard' as TabType, name: 'Leaderboard', icon: '👑' },
  ]

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Unable to load gamification data
        </h3>
        <p className="text-gray-600">
          {error || 'Please try again later'}
        </p>
      </div>
    )
  }

  const nextAchievements = getNextAchievementSuggestions(achievements, profile)
  const dailyXPGoal = calculateDailyXPGoal(profile)
  const motivationalMessage = getMotivationalMessage(profile)

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Learning Journey
        </h1>
        <p className="text-gray-600">
          {motivationalMessage}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              profile={profile}
              nextAchievements={nextAchievements}
              dailyXPGoal={dailyXPGoal}
              targetUserId={targetUserId}
            />
          )}
          
          {activeTab === 'achievements' && (
            <AchievementGallery userId={targetUserId} />
          )}
          
          {activeTab === 'badges' && (
            <BadgeCollection userId={targetUserId} />
          )}
          
          {activeTab === 'leaderboard' && (
            <LeaderboardTab leaderboard={leaderboard} currentUserId={targetUserId} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

interface OverviewTabProps {
  profile: any
  nextAchievements: any[]
  dailyXPGoal: number
  targetUserId: string
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  profile,
  nextAchievements,
  dailyXPGoal,
  targetUserId,
}) => {
  const todayXP = profile.recent_xp_events
    .filter((event: any) => {
      const eventDate = new Date(event.timestamp).toDateString()
      const today = new Date().toDateString()
      return eventDate === today
    })
    .reduce((sum: number, event: any) => sum + event.xp_earned, 0)

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">⚡</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {profile.total_xp.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total XP</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">🏆</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {profile.achievements_unlocked}
              </div>
              <div className="text-sm text-gray-600">
                of {profile.total_achievements} achievements
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">🔥</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {profile.streak?.current_streak || 0}
              </div>
              <div className="text-sm text-gray-600">Day streak</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-3xl">🎯</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {todayXP}/{dailyXPGoal}
              </div>
              <div className="text-sm text-gray-600">Daily XP goal</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* XP Progress */}
          <XPProgressBar userId={targetUserId} />
          
          {/* Streak Tracker */}
          <StreakTracker userId={targetUserId} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Daily XP Goal Progress */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Today's Progress
            </h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Daily XP Goal</span>
                <span>{todayXP} / {dailyXPGoal} XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (todayXP / dailyXPGoal) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
            {todayXP >= dailyXPGoal ? (
              <div className="text-green-600 text-sm font-medium">
                🎉 Daily goal achieved! Great work!
              </div>
            ) : (
              <div className="text-gray-600 text-sm">
                {dailyXPGoal - todayXP} XP remaining to reach your daily goal
              </div>
            )}
          </div>

          {/* Next Achievements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Next Achievements
            </h3>
            {nextAchievements.length > 0 ? (
              <div className="space-y-3">
                {nextAchievements.slice(0, 3).map(achievement => (
                  <div key={achievement.id} className="flex items-center space-x-3">
                    <div className="text-2xl">{achievement.badge}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{achievement.name}</div>
                      <div className="text-xs text-gray-600 mb-1">
                        {achievement.description}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-400 h-1.5 rounded-full"
                          style={{ width: `${achievement.progress * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(achievement.progress * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-sm">Keep learning to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent XP Activity
        </h3>
        {profile.recent_xp_events.length > 0 ? (
          <div className="space-y-2">
            {profile.recent_xp_events.slice(0, 5).map((event: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600 capitalize">
                    {event.event_type.replace(/_/g, ' ')}
                  </div>
                  {event.multiplier > 1 && (
                    <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      {event.multiplier}x
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-green-600">
                    +{event.xp_earned} XP
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-sm">Complete tasks to start earning XP!</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface LeaderboardTabProps {
  leaderboard: any[]
  currentUserId: string
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  leaderboard,
  currentUserId,
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          XP Leaderboard
        </h3>
        <p className="text-sm text-gray-600">
          See how you rank against other learners
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {leaderboard.length > 0 ? (
          leaderboard.map((entry, index) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 flex items-center space-x-4 ${
                entry.user_id === currentUserId ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${entry.rank <= 3 
                  ? entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                    entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  : 'bg-gray-50 text-gray-600'
                }
              `}>
                {entry.rank <= 3 ? 
                  (entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉') :
                  entry.rank
                }
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {entry.username || `User ${entry.user_id.slice(0, 8)}`}
                  {entry.user_id === currentUserId && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Level {entry.level} • {entry.streak} day streak
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {entry.total_xp.toLocaleString()} XP
                </div>
                <div className="text-sm text-gray-600">
                  {entry.badges_count} badges
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">👑</div>
            <p>No leaderboard data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GamificationDashboard
