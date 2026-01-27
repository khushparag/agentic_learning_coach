/**
 * Global Leaderboard Component
 * Shows overall XP and achievement rankings across all users
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrophyIcon,
  StarIcon,
  FireIcon,
  UserIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid'
import { Card, Button, Badge, Select, LoadingSpinner } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { GamificationService } from '../../services/gamificationService'
import type { LeaderboardEntry } from '../../types/api'

interface GlobalLeaderboardProps {
  className?: string
  showFilters?: boolean
  maxEntries?: number
  refreshInterval?: number
}

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'all_time'

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  className = '',
  showFilters = true,
  maxEntries = 50,
  refreshInterval = 30000, // 30 seconds
}) => {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all_time')
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(new Map())
  const [highlightedUsers, setHighlightedUsers] = useState<Set<string>>(new Set())

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      setError(null)
      const data = await GamificationService.getLeaderboard({
        timeframe: timeFrame,
        limit: maxEntries,
      })
      
      // Track rank changes
      const newHighlights = new Set<string>()
      data.forEach((entry) => {
        const previousRank = previousRanks.get(entry.user_id)
        if (previousRank && previousRank !== entry.rank) {
          newHighlights.add(entry.user_id)
        }
      })

      setHighlightedUsers(newHighlights)
      setPreviousRanks(new Map(data.map(entry => [entry.user_id, entry.rank])))
      setLeaderboard(data)
      
      // Clear highlights after animation
      setTimeout(() => setHighlightedUsers(new Set()), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load and periodic refresh
  useEffect(() => {
    fetchLeaderboard()
    
    const interval = setInterval(fetchLeaderboard, refreshInterval)
    return () => clearInterval(interval)
  }, [timeFrame, refreshInterval])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIconSolid className="w-6 h-6 text-yellow-500" />
      case 2:
        return <TrophyIcon className="w-6 h-6 text-gray-400" />
      case 3:
        return <TrophyIcon className="w-6 h-6 text-amber-600" />
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-500">#{rank}</span>
          </div>
        )
    }
  }

  const getRankChange = (entry: LeaderboardEntry) => {
    const previousRank = previousRanks.get(entry.user_id)
    if (!previousRank || previousRank === entry.rank) return null
    
    const change = previousRank - entry.rank
    if (change > 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center text-green-500 text-xs ml-2"
        >
          <ChevronUpIcon className="w-3 h-3" />
          <span>+{change}</span>
        </motion.div>
      )
    } else {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center text-red-500 text-xs ml-2"
        >
          <ChevronDownIcon className="w-3 h-3" />
          <span>{change}</span>
        </motion.div>
      )
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500'
    if (rank === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600'
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600'
    return 'bg-gradient-to-r from-gray-400 to-gray-600'
  }

  const getTimeFrameLabel = (tf: TimeFrame) => {
    const labels = {
      daily: 'Today',
      weekly: 'This Week',
      monthly: 'This Month',
      all_time: 'All Time',
    }
    return labels[tf]
  }

  const currentUserEntry = leaderboard.find(entry => entry.user_id === user?.id)
  const topThree = leaderboard.slice(0, 3)
  const remainingEntries = leaderboard.slice(3)

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <TrophyIcon className="w-12 h-12 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Failed to load leaderboard</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchLeaderboard} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <TrophyIcon className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900">Global Leaderboard</h2>
            <Badge variant="success" size="sm">Live</Badge>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <ClockIcon className="w-4 h-4" />
            <span>Updates every 30s</span>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Time Frame:</span>
            </div>
            <Select
              value={timeFrame}
              onChange={(value) => setTimeFrame(value as TimeFrame)}
              options={[
                { value: 'daily', label: 'Today' },
                { value: 'weekly', label: 'This Week' },
                { value: 'monthly', label: 'This Month' },
                { value: 'all_time', label: 'All Time' },
              ]}
              className="w-32"
            />
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-2">Loading leaderboard...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && leaderboard.length === 0 && (
        <div className="p-8 text-center">
          <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">No rankings available</p>
          <p className="text-sm text-gray-500">
            Complete some exercises to see the leaderboard!
          </p>
        </div>
      )}

      {/* Leaderboard Content */}
      {!isLoading && leaderboard.length > 0 && (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                🏆 Top Performers - {getTimeFrameLabel(timeFrame)}
              </h3>
              
              <div className="flex items-end justify-center space-x-4">
                {/* Second Place */}
                {topThree[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-20 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                      <span className="text-white font-bold text-lg">2</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm border-2 border-gray-200">
                      <UserIcon className="w-8 h-8 text-gray-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {topThree[1].user_id === user?.id ? 'You' : topThree[1].username}
                      </p>
                      <p className="text-xs text-gray-600">{GamificationService.formatXP(topThree[1].total_xp)}</p>
                    </div>
                  </motion.div>
                )}

                {/* First Place */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="w-20 h-24 bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg flex items-end justify-center pb-2 mb-2 relative">
                    <TrophyIconSolid className="w-6 h-6 text-yellow-200 absolute -top-2" />
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-md border-2 border-yellow-300">
                    <UserIcon className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {topThree[0].user_id === user?.id ? 'You' : topThree[0].username}
                    </p>
                    <p className="text-xs text-gray-600">{GamificationService.formatXP(topThree[0].total_xp)}</p>
                    <Badge variant="warning" size="sm" className="mt-1">Champion</Badge>
                  </div>
                </motion.div>

                {/* Third Place */}
                {topThree[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-t from-amber-400 to-amber-500 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                      <span className="text-white font-bold text-lg">3</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm border-2 border-amber-200">
                      <UserIcon className="w-8 h-8 text-amber-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {topThree[2].user_id === user?.id ? 'You' : topThree[2].username}
                      </p>
                      <p className="text-xs text-gray-600">{GamificationService.formatXP(topThree[2].total_xp)}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Current User Position (if not in top 3) */}
          {currentUserEntry && currentUserEntry.rank > 3 && (
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full ${getRankBadgeColor(currentUserEntry.rank)} flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">#{currentUserEntry.rank}</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Your Position</p>
                    <p className="text-sm text-blue-700">
                      {GamificationService.formatXP(currentUserEntry.total_xp)} • Level {currentUserEntry.level}
                    </p>
                  </div>
                </div>
                <Badge variant="primary">You</Badge>
              </div>
            </div>
          )}

          {/* Remaining Rankings */}
          {remainingEntries.length > 0 && (
            <div className="divide-y divide-gray-100">
              <AnimatePresence>
                {remainingEntries.map((entry, index) => (
                  <motion.div
                    key={entry.user_id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      backgroundColor: highlightedUsers.has(entry.user_id) ? '#fef3c7' : 'transparent'
                    }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`
                      p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors
                      ${entry.user_id === user?.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                    `}
                  >
                    {/* Rank */}
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full ${getRankBadgeColor(entry.rank)} flex items-center justify-center`}>
                        <span className="text-white text-sm font-bold">#{entry.rank}</span>
                      </div>
                      {getRankChange(entry)}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <UserIcon className="w-8 h-8 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {entry.user_id === user?.id ? 'You' : entry.username}
                          </p>
                          {entry.user_id === user?.id && (
                            <Badge variant="primary" size="sm">You</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Level {entry.level}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-gray-900">
                            {GamificationService.formatXP(entry.total_xp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">XP</p>
                      </div>
                      
                      {entry.streak > 0 && (
                        <div className="text-center">
                          <div className="flex items-center space-x-1">
                            <FireIcon className="w-4 h-4 text-orange-500" />
                            <span className="font-medium text-gray-900">{entry.streak}</span>
                          </div>
                          <p className="text-xs text-gray-500">Streak</p>
                        </div>
                      )}

                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <TrophyIcon className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-900">{entry.badges_count}</span>
                        </div>
                        <p className="text-xs text-gray-500">Badges</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 bg-gray-50 text-center border-t">
            <p className="text-xs text-gray-500">
              Showing top {Math.min(maxEntries, leaderboard.length)} of {leaderboard.length} learners
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Rankings update automatically • {getTimeFrameLabel(timeFrame)} leaderboard
            </p>
          </div>
        </>
      )}
    </Card>
  )
}

export default GlobalLeaderboard