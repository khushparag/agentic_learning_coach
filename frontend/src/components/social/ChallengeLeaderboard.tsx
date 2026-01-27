/**
 * Challenge Leaderboard Component
 * 
 * Displays challenge wins leaderboard
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  TrophyIcon,
  StarIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { Modal, Badge, LoadingSpinner } from '../ui'

interface LeaderboardEntry {
  rank: number
  user_id: string
  wins: number
}

interface ChallengeLeaderboardProps {
  isOpen: boolean
  onClose: () => void
  leaderboard: LeaderboardEntry[]
  currentUserId: string
  isLoading?: boolean
}

const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  isOpen,
  onClose,
  leaderboard,
  currentUserId,
  isLoading = false,
}) => {
  // Get rank colors and icons
  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: <TrophyIcon className="w-5 h-5 text-yellow-500" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        }
      case 2:
        return {
          icon: <TrophyIcon className="w-5 h-5 text-gray-400" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        }
      case 3:
        return {
          icon: <StarIcon className="w-5 h-5 text-orange-500" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        }
      default:
        return {
          icon: <UserIcon className="w-5 h-5 text-blue-500" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        }
    }
  }

  // Find current user's rank
  const currentUserEntry = leaderboard.find(entry => entry.user_id === currentUserId)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Challenge Leaderboard"
      size="md"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <TrophyIcon className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-600">
            Top performers in peer challenges
          </p>
        </div>

        {/* Current User Rank */}
        {currentUserEntry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Your Rank</p>
                  <p className="text-sm text-blue-700">
                    #{currentUserEntry.rank} with {currentUserEntry.wins} wins
                  </p>
                </div>
              </div>
              <Badge variant="primary">You</Badge>
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <TrophyIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No challenge data available yet</p>
              <p className="text-sm text-gray-500">
                Complete some challenges to see the leaderboard!
              </p>
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const rankDisplay = getRankDisplay(entry.rank)
              const isCurrentUser = entry.user_id === currentUserId

              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    isCurrentUser
                      ? 'border-blue-300 bg-blue-50'
                      : `${rankDisplay.borderColor} ${rankDisplay.bgColor}`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className="flex items-center space-x-2">
                        <span className={`text-2xl font-bold ${rankDisplay.color}`}>
                          #{entry.rank}
                        </span>
                        {rankDisplay.icon}
                      </div>

                      {/* User Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">
                            {isCurrentUser ? 'You' : `User ${entry.user_id.slice(0, 8)}`}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="primary" size="sm">You</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {entry.wins} challenge{entry.wins !== 1 ? 's' : ''} won
                        </p>
                      </div>
                    </div>

                    {/* Wins Badge */}
                    <div className="text-right">
                      <Badge
                        variant={entry.rank <= 3 ? 'success' : 'secondary'}
                        size="lg"
                      >
                        {entry.wins} wins
                      </Badge>
                    </div>
                  </div>

                  {/* Special Recognition */}
                  {entry.rank === 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-3 p-2 bg-yellow-100 border border-yellow-200 rounded text-center"
                    >
                      <p className="text-sm font-medium text-yellow-800">
                        🏆 Challenge Champion! 🏆
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t">
          <p className="text-xs text-gray-500">
            Rankings are updated in real-time based on challenge wins
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default ChallengeLeaderboard