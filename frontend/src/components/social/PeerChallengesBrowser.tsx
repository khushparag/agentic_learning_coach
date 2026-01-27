/**
 * Peer Challenges Browser Component
 * 
 * Browse, filter, and participate in peer challenges
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrophyIcon,
  PlusIcon,
  FunnelIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { useUserChallenges, useChallengeLeaderboard, useSocialWithUtils } from '../../hooks/api/useSocial'
import { useAuthContext } from '../../contexts/AuthContext'
import { Card, Button, Badge, LoadingSpinner, ErrorMessage } from '../ui'
import ChallengeCard from './ChallengeCard'
import CreateChallengeModal from './CreateChallengeModal'
import ChallengeLeaderboard from './ChallengeLeaderboard'
import type { PeerChallenge } from '../../types/api'

interface PeerChallengesBrowserProps {
  className?: string
}

type FilterStatus = 'all' | 'pending' | 'active' | 'completed'
type FilterRole = 'all' | 'challenger' | 'challenged'

const PeerChallengesBrowser: React.FC<PeerChallengesBrowserProps> = ({ className = '' }) => {
  const { user } = useAuthContext()
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Fetch challenges data
  const challengesQuery = useUserChallenges(user?.id || null, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    asChallenger: roleFilter === 'all' ? true : roleFilter === 'challenger',
    asChallenged: roleFilter === 'all' ? true : roleFilter === 'challenged',
  })

  const leaderboardQuery = useChallengeLeaderboard(10)
  const socialUtils = useSocialWithUtils(user?.id || null)

  const challenges = challengesQuery.data || []
  const leaderboard = leaderboardQuery.data || []

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Challenges', count: challenges.length },
    { value: 'pending', label: 'Pending', count: challenges.filter(c => c.status === 'pending').length },
    { value: 'active', label: 'Active', count: challenges.filter(c => c.status === 'active').length },
    { value: 'completed', label: 'Completed', count: challenges.filter(c => c.status === 'completed').length },
  ]

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'challenger', label: 'As Challenger' },
    { value: 'challenged', label: 'As Challenged' },
  ]

  // Stats
  const stats = {
    total: challenges.length,
    active: socialUtils.activeChallenges,
    pending: socialUtils.pendingChallenges,
    won: socialUtils.wonChallenges,
  }

  if (challengesQuery.isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (challengesQuery.isError) {
    return (
      <div className={className}>
        <ErrorMessage 
          message="Failed to load challenges" 
          onRetry={() => challengesQuery.refetch()}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Peer Challenges</h2>
          <p className="text-gray-600 mt-1">
            Compete with other learners and improve your skills
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center space-x-2"
          >
            <TrophyIcon className="w-4 h-4" />
            <span>Leaderboard</span>
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Challenge</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClockIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FunnelIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrophyIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Won</p>
              <p className="text-xl font-semibold text-gray-900">{stats.won}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <div className="flex space-x-1">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value as FilterStatus)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === option.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                    {option.count > 0 && (
                      <Badge variant="secondary" size="sm" className="ml-1">
                        {option.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Role:</span>
            <div className="flex space-x-1">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRoleFilter(option.value as FilterRole)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    roleFilter === option.value
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Challenges List */}
      <div className="space-y-4">
        <AnimatePresence>
          {challenges.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-8 text-center">
                <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No challenges found
                </h3>
                <p className="text-gray-600 mb-4">
                  {statusFilter === 'all' 
                    ? "You haven't participated in any challenges yet."
                    : `No ${statusFilter} challenges found.`}
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  Create Your First Challenge
                </Button>
              </Card>
            </motion.div>
          ) : (
            challenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <ChallengeCard
                  challenge={challenge}
                  currentUserId={user?.id || ''}
                  onUpdate={() => challengesQuery.refetch()}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <CreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          challengesQuery.refetch()
        }}
      />

      <ChallengeLeaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        leaderboard={leaderboard}
        currentUserId={user?.id || ''}
        isLoading={leaderboardQuery.isLoading}
      />
    </div>
  )
}

export default PeerChallengesBrowser