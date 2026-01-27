/**
 * Real-time Leaderboard Component
 * Shows live updates of competition rankings and user positions
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrophyIcon, 
  FireIcon, 
  StarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useLeaderboardWebSocket } from '../../hooks/useWebSocket'
import { useAuth } from '../../contexts/AuthContext'

interface LeaderboardEntry {
  id: string
  userId: string
  username: string
  avatar?: string
  score: number
  xp: number
  rank: number
  previousRank?: number
  streak: number
  lastActive: string
  isOnline: boolean
}

interface LeaderboardData {
  entries: LeaderboardEntry[]
  totalParticipants: number
  userRank?: number
  lastUpdated: string
  competitionId?: string
  timeRemaining?: number
}

interface RealTimeLeaderboardProps {
  leaderboardId: string
  competitionId?: string
  showUserHighlight?: boolean
  maxEntries?: number
  refreshInterval?: number
}

export const RealTimeLeaderboard: React.FC<RealTimeLeaderboardProps> = ({
  leaderboardId,
  competitionId,
  showUserHighlight = true,
  maxEntries = 10,
  refreshInterval = 5000
}) => {
  const { user } = useAuth()
  const { connectionState, leaderboardData, joinLeaderboard, leaveLeaderboard } = useLeaderboardWebSocket(leaderboardId)
  
  const [previousData, setPreviousData] = useState<LeaderboardData | null>(null)
  const [highlightedEntries, setHighlightedEntries] = useState<Set<string>>(new Set())

  // Join leaderboard when component mounts
  useEffect(() => {
    if (connectionState.isConnected) {
      joinLeaderboard()
    }

    return () => {
      leaveLeaderboard()
    }
  }, [connectionState.isConnected, joinLeaderboard, leaveLeaderboard])

  // Track position changes and highlight updates
  useEffect(() => {
    if (leaderboardData && previousData) {
      const newHighlights = new Set<string>()
      
      leaderboardData.entries.forEach((entry: LeaderboardEntry) => {
        const previousEntry = previousData.entries.find(p => p.userId === entry.userId)
        if (previousEntry && previousEntry.rank !== entry.rank) {
          newHighlights.add(entry.userId)
        }
      })

      setHighlightedEntries(newHighlights)
      
      // Clear highlights after animation
      setTimeout(() => setHighlightedEntries(new Set()), 2000)
    }

    if (leaderboardData) {
      setPreviousData(leaderboardData)
    }
  }, [leaderboardData, previousData])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="w-6 h-6 text-yellow-500" />
      case 2:
        return <TrophyIcon className="w-6 h-6 text-gray-400" />
      case 3:
        return <TrophyIcon className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankChange = (entry: LeaderboardEntry) => {
    if (!entry.previousRank || entry.previousRank === entry.rank) return null
    
    const change = entry.previousRank - entry.rank
    if (change > 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center text-green-500 text-xs"
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
          className="flex items-center text-red-500 text-xs"
        >
          <ChevronDownIcon className="w-3 h-3" />
          <span>{change}</span>
        </motion.div>
      )
    }
  }

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  if (!connectionState.isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>Connecting to leaderboard...</span>
        </div>
      </div>
    )
  }

  if (!leaderboardData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <TrophyIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  const displayEntries = leaderboardData.entries.slice(0, maxEntries)
  const userEntry = leaderboardData.entries.find((entry: LeaderboardEntry) => entry.userId === user?.id)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrophyIcon className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">{leaderboardData.totalParticipants} participants</p>
            {leaderboardData.timeRemaining && (
              <div className="flex items-center space-x-1 text-xs text-orange-600">
                <ClockIcon className="w-3 h-3" />
                <span>{formatTimeRemaining(leaderboardData.timeRemaining)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Entries */}
      <div className="divide-y divide-gray-100">
        <AnimatePresence>
          {displayEntries.map((entry: LeaderboardEntry, index) => (
            <motion.div
              key={entry.userId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                backgroundColor: highlightedEntries.has(entry.userId) ? '#fef3c7' : 'transparent'
              }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`
                p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors
                ${showUserHighlight && entry.userId === user?.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
              `}
            >
              {/* Rank */}
              <div className="flex items-center space-x-2">
                {getRankIcon(entry.rank)}
                {getRankChange(entry)}
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative">
                  {entry.avatar ? (
                    <img
                      src={entry.avatar}
                      alt={entry.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                  
                  {entry.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {entry.username}
                    {entry.userId === user?.id && (
                      <span className="ml-2 text-xs text-blue-600 font-medium">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last active: {new Date(entry.lastActive).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-gray-900">{entry.score.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-3 h-3 text-yellow-500" />
                    <span className="font-medium text-gray-900">{entry.xp.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500">XP</p>
                </div>

                {entry.streak > 0 && (
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <FireIcon className="w-3 h-3 text-orange-500" />
                      <span className="font-medium text-gray-900">{entry.streak}</span>
                    </div>
                    <p className="text-xs text-gray-500">Streak</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* User Position (if not in top entries) */}
      {userEntry && userEntry.rank > maxEntries && (
        <div className="border-t border-gray-200 p-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">Your Position:</span>
              <span className="text-sm font-bold text-blue-600">#{userEntry.rank}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="font-medium">{userEntry.score.toLocaleString()} pts</span>
              <div className="flex items-center space-x-1">
                <StarIcon className="w-3 h-3 text-yellow-500" />
                <span>{userEntry.xp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 bg-gray-50 text-center">
        <p className="text-xs text-gray-500">
          Last updated: {new Date(leaderboardData.lastUpdated).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

export default RealTimeLeaderboard
