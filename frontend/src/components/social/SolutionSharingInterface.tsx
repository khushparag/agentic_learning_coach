/**
 * Solution Sharing Interface Component
 * 
 * Main interface for browsing and sharing code solutions
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShareIcon,
  FunnelIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  CodeBracketIcon,
  StarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { useSharedSolutions, useSocialWithUtils } from '../../hooks/api/useSocial'
import { useAuthContext } from '../../contexts/AuthContext'
import { Card, Button, Badge, Select, LoadingSpinner, ErrorMessage } from '../ui'
import SharedSolutionCard from './SharedSolutionCard'
import ShareSolutionModal from './ShareSolutionModal'
import type { SharedSolution } from '../../types/apiTypes'

interface SolutionSharingInterfaceProps {
  className?: string
}

type SortOption = 'recent' | 'popular' | 'helpful'

const SolutionSharingInterface: React.FC<SolutionSharingInterfaceProps> = ({ className = '' }) => {
  const { user } = useAuthContext()
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [exerciseFilter, setExerciseFilter] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Fetch solutions data
  const solutionsQuery = useSharedSolutions({
    exerciseId: exerciseFilter || undefined,
    featuredOnly,
    sortBy,
    limit: 20,
  })

  const socialUtils = useSocialWithUtils(user?.id || null)
  const solutions = solutionsQuery.data || []

  // Sort options
  const sortOptions = [
    { value: 'recent', label: 'Most Recent', icon: ClockIcon },
    { value: 'popular', label: 'Most Liked', icon: HeartIcon },
    { value: 'helpful', label: 'Most Discussed', icon: ChatBubbleLeftIcon },
  ]

  // Programming languages for filtering
  const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++']

  // Stats
  const stats = {
    total: solutions.length,
    yourSolutions: solutions.filter(s => s.user_id === user?.id).length,
    totalLikes: solutions.reduce((sum, s) => sum + s.likes, 0),
    totalComments: solutions.reduce((sum, s) => sum + s.comments_count, 0),
  }

  if (solutionsQuery.isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (solutionsQuery.isError) {
    return (
      <div className={className}>
        <ErrorMessage 
          message="Failed to load solutions" 
          onRetry={() => solutionsQuery.refetch()}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Solution Sharing</h2>
          <p className="text-gray-600 mt-1">
            Share your solutions and learn from others
          </p>
        </div>
        <Button
          onClick={() => setShowShareModal(true)}
          className="flex items-center space-x-2"
        >
          <ShareIcon className="w-4 h-4" />
          <span>Share Solution</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CodeBracketIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Solutions</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShareIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Your Solutions</p>
              <p className="text-xl font-semibold text-gray-900">{stats.yourSolutions}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <HeartIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Likes</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalLikes}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChatBubbleLeftIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Comments</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalComments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Sorting */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            {/* Featured Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Featured only</span>
              <StarIcon className="w-4 h-4 text-yellow-500" />
            </label>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <div className="flex space-x-1">
              {sortOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as SortOption)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      sortBy === option.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Solutions Grid */}
      <div className="space-y-6">
        <AnimatePresence>
          {solutions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-8 text-center">
                <CodeBracketIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No solutions found
                </h3>
                <p className="text-gray-600 mb-4">
                  {featuredOnly 
                    ? "No featured solutions available."
                    : "Be the first to share a solution!"}
                </p>
                <Button onClick={() => setShowShareModal(true)}>
                  Share Your First Solution
                </Button>
              </Card>
            </motion.div>
          ) : (
            solutions.map((solution, index) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <SharedSolutionCard
                  solution={solution}
                  currentUserId={user?.id || ''}
                  onUpdate={() => solutionsQuery.refetch()}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {solutions.length >= 20 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              // Implement pagination
              console.log('Load more solutions')
            }}
          >
            Load More Solutions
          </Button>
        </div>
      )}

      {/* Share Solution Modal */}
      <ShareSolutionModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSuccess={() => {
          setShowShareModal(false)
          solutionsQuery.refetch()
        }}
      />
    </div>
  )
}

export default SolutionSharingInterface
