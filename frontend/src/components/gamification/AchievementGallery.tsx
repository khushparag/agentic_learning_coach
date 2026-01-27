/**
 * Achievement Gallery Component - Showcase achievements with categories, unlock animations, and rarity display
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAchievements } from '../../hooks/api/useGamification'
import { GamificationService } from '../../services/gamificationService'
import { useAuth } from '../../contexts/AuthContext'
import type { Achievement } from '../../types/apiTypes'

interface AchievementGalleryProps {
  userId?: string
  category?: 'streak' | 'skill' | 'social' | 'milestone' | 'special'
  showUnlockedOnly?: boolean
  compact?: boolean
  className?: string
}

interface AchievementCardProps {
  achievement: Achievement
  onClick: () => void
  isNew?: boolean
}

const AchievementCard: React.FC<AchievementCardProps> = ({ 
  achievement, 
  onClick, 
  isNew = false 
}) => {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  }

  const rarityBorders = {
    common: 'border-gray-300',
    rare: 'border-blue-300',
    epic: 'border-purple-300',
    legendary: 'border-yellow-300',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
        ${achievement.unlocked 
          ? `bg-white shadow-md hover:shadow-lg ${rarityBorders[achievement.rarity]}` 
          : 'bg-gray-50 border-gray-200 opacity-60'
        }
        ${isNew ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}
      `}
      onClick={onClick}
    >
      {/* New Achievement Indicator */}
      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full"
        >
          NEW!
        </motion.div>
      )}

      {/* Rarity Glow Effect */}
      {achievement.unlocked && achievement.rarity !== 'common' && (
        <div className={`
          absolute inset-0 rounded-lg opacity-20 blur-sm
          bg-gradient-to-br ${rarityColors[achievement.rarity]}
        `} />
      )}

      {/* Achievement Badge */}
      <div className="relative text-center">
        <div className="text-4xl mb-2" role="img" aria-label={`${achievement.name} badge`}>
          {achievement.badge}
        </div>
        
        {/* Achievement Name */}
        <h3 className={`font-semibold text-sm mb-1 ${
          achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
        }`}>
          {achievement.name}
        </h3>
        
        {/* Achievement Description */}
        <p className={`text-xs mb-2 ${
          achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {achievement.description}
        </p>

        {/* Rarity Badge */}
        <div className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
          ${achievement.unlocked 
            ? `bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white`
            : 'bg-gray-200 text-gray-500'
          }
        `}>
          {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
        </div>

        {/* XP Reward */}
        <div className={`mt-2 text-xs font-medium ${
          achievement.unlocked ? 'text-green-600' : 'text-gray-400'
        }`}>
          {achievement.xp_reward} XP
        </div>

        {/* Progress Bar (for locked achievements) */}
        {!achievement.unlocked && achievement.progress > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <motion.div
                className="bg-blue-400 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${achievement.progress * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(achievement.progress * 100)}% complete
            </div>
          </div>
        )}

        {/* Unlock Date */}
        {achievement.unlocked && achievement.unlocked_at && (
          <div className="text-xs text-gray-500 mt-1">
            Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({
  userId,
  category,
  showUnlockedOnly = false,
  compact = false,
  className = '',
}) => {
  const { user } = useAuth()
  const targetUserId = userId || user?.id || null
  const { data: achievements = [], isLoading } = useAchievements(targetUserId, {
    category,
    unlockedOnly: showUnlockedOnly,
  })

  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all')
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'date' | 'progress'>('rarity')

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let filtered = achievements

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory)
    }

    // Sort achievements
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rarity':
          const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 }
          return rarityOrder[b.rarity] - rarityOrder[a.rarity]
        case 'date':
          if (a.unlocked && b.unlocked) {
            return new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime()
          }
          return a.unlocked ? -1 : b.unlocked ? 1 : 0
        case 'progress':
          return b.progress - a.progress
        default:
          return 0
      }
    })

    return filtered
  }, [achievements, selectedCategory, sortBy])

  // Group achievements by category for stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; unlocked: number }> = {}
    
    achievements.forEach(achievement => {
      const cat = achievement.category
      if (!stats[cat]) {
        stats[cat] = { total: 0, unlocked: 0 }
      }
      stats[cat].total++
      if (achievement.unlocked) {
        stats[cat].unlocked++
      }
    })

    return stats
  }, [achievements])

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'milestone', name: 'Milestones', icon: '🎯' },
    { id: 'skill', name: 'Skills', icon: '🧠' },
    { id: 'streak', name: 'Streaks', icon: '🔥' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'special', name: 'Special', icon: '⭐' },
  ]

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Achievement Gallery
        </h2>
        <p className="text-gray-600">
          Unlock achievements by completing challenges and reaching milestones
        </p>
      </div>

      {/* Category Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => {
            const stats = cat.id === 'all' 
              ? { 
                  total: achievements.length, 
                  unlocked: achievements.filter(a => a.unlocked).length 
                }
              : categoryStats[cat.id] || { total: 0, unlocked: 0 }

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedCategory === cat.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-xs opacity-75">
                  {stats.unlocked}/{stats.total}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="rarity">Rarity</option>
            <option value="name">Name</option>
            <option value="date">Date Unlocked</option>
            <option value="progress">Progress</option>
          </select>
        </div>
      </div>

      {/* Achievement Grid */}
      <motion.div 
        layout
        className={`grid gap-4 ${
          compact 
            ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' 
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        }`}
      >
        <AnimatePresence>
          {filteredAchievements.map(achievement => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onClick={() => setSelectedAchievement(achievement)}
              isNew={Boolean(achievement.unlocked && achievement.unlocked_at && 
                     new Date(achievement.unlocked_at).getTime() > Date.now() - 24 * 60 * 60 * 1000)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No achievements found
          </h3>
          <p className="text-gray-600">
            {selectedCategory === 'all' 
              ? 'Start learning to unlock your first achievement!'
              : `No ${selectedCategory} achievements available.`
            }
          </p>
        </div>
      )}

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {selectedAchievement.badge}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedAchievement.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedAchievement.description}
                </p>
                
                <div className="flex justify-center space-x-4 mb-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Rarity</div>
                    <div className="font-medium capitalize">
                      {selectedAchievement.rarity}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">XP Reward</div>
                    <div className="font-medium text-green-600">
                      {selectedAchievement.xp_reward} XP
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Category</div>
                    <div className="font-medium capitalize">
                      {selectedAchievement.category}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <strong>Requirement:</strong> {selectedAchievement.requirement}
                </div>

                {selectedAchievement.unlocked ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-green-800 font-medium">
                      ✅ Achievement Unlocked!
                    </div>
                    {selectedAchievement.unlocked_at && (
                      <div className="text-green-600 text-sm">
                        {new Date(selectedAchievement.unlocked_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-gray-700 font-medium mb-2">
                      Progress: {Math.round(selectedAchievement.progress * 100)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${selectedAchievement.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility */}
      <div className="sr-only">
        Achievement gallery showing {filteredAchievements.length} achievements.
        {filteredAchievements.filter(a => a.unlocked).length} unlocked,
        {filteredAchievements.filter(a => !a.unlocked).length} locked.
        Current filter: {selectedCategory}.
      </div>
    </div>
  )
}

export default AchievementGallery
