/**
 * Streak Tracker Component - Display learning streak with milestone celebrations
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGamificationProfile } from '../../hooks/api/useGamification'
import { GamificationService } from '../../services/gamificationService'
import { useAuth } from '../../contexts/AuthContext'

interface StreakTrackerProps {
  userId?: string
  showMilestones?: boolean
  compact?: boolean
  className?: string
}

interface MilestoneCelebration {
  show: boolean
  milestone: {
    days: number
    name: string
    badge: string
    xp: number
    rarity: string
  }
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  userId,
  showMilestones = true,
  compact = false,
  className = '',
}) => {
  const { user } = useAuth()
  const targetUserId = userId || user?.id || ''
  const { data: profile, isLoading } = useGamificationProfile(targetUserId)
  
  const [celebration, setCelebration] = useState<MilestoneCelebration>({
    show: false,
    milestone: { days: 0, name: '', badge: '', xp: 0, rarity: 'common' }
  })

  // Check for milestone celebrations
  useEffect(() => {
    if (profile?.streak?.next_milestone && !celebration.show) {
      const { next_milestone } = profile.streak
      
      // Check if we just hit a milestone (days_remaining is 0)
      if (next_milestone.days_remaining === 0) {
        const milestones = GamificationService.getStreakMilestones()
        const milestone = milestones[next_milestone.days]
        
        if (milestone) {
          setCelebration({
            show: true,
            milestone: {
              days: next_milestone.days,
              name: milestone.name,
              badge: milestone.badge,
              xp: milestone.xp,
              rarity: milestone.rarity,
            }
          })
          
          // Hide celebration after 4 seconds
          setTimeout(() => {
            setCelebration(prev => ({ ...prev, show: false }))
          }, 4000)
        }
      }
    }
  }, [profile?.streak?.next_milestone, celebration.show])

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`bg-gray-200 rounded-lg ${compact ? 'h-16' : 'h-24'}`} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <p>Unable to load streak data</p>
      </div>
    )
  }

  // Provide default streak values if streak is undefined
  const streak = profile.streak || {
    current_streak: 0,
    longest_streak: 0,
    streak_status: 'inactive' as const,
    streak_multiplier: 1.0,
    last_activity: undefined,
    next_milestone: undefined,
  }
  const streakMultiplier = GamificationService.calculateStreakMultiplier(streak.current_streak)
  const weekendMultiplier = GamificationService.getWeekendMultiplier()

  // Streak status colors
  const statusColors = {
    active: 'from-orange-400 to-red-500',
    at_risk: 'from-yellow-400 to-orange-500',
    broken: 'from-gray-400 to-gray-600',
    inactive: 'from-gray-300 to-gray-500',
  }

  const statusIcons = {
    active: '🔥',
    at_risk: '⚠️',
    broken: '💔',
    inactive: '😴',
  }

  return (
    <div className={`relative ${className}`}>
      {/* Milestone Celebration */}
      <AnimatePresence>
        {celebration.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-8 py-6 rounded-xl shadow-2xl border-4 border-yellow-300"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="text-6xl mb-2"
                >
                  {celebration.milestone.badge}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold mb-1"
                >
                  MILESTONE REACHED!
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-lg font-semibold mb-1"
                >
                  {celebration.milestone.name}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-sm opacity-90"
                >
                  {celebration.milestone.days} days • +{celebration.milestone.xp} XP
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Streak Display */}
      <div className={`bg-white rounded-lg shadow-sm border ${compact ? 'p-3' : 'p-4'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl" role="img" aria-label="Streak status">
              {statusIcons[streak.streak_status]}
            </span>
            <div>
              <div className="font-semibold text-gray-900">
                {streak.current_streak} Day Streak
              </div>
              {!compact && (
                <div className="text-sm text-gray-600 capitalize">
                  {streak.streak_status.replace('_', ' ')}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-bold text-lg text-gray-900">
              {streakMultiplier.toFixed(1)}x
            </div>
            {!compact && (
              <div className="text-sm text-gray-600">
                XP Multiplier
              </div>
            )}
          </div>
        </div>

        {/* Streak Visualization */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Current Streak
            </span>
            <span className="text-sm text-gray-600">
              Best: {streak.longest_streak} days
            </span>
          </div>
          
          {/* Streak Fire Animation */}
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${statusColors[streak.streak_status]}`}
                initial={{ width: 0 }}
                animate={{ 
                  width: streak.next_milestone 
                    ? `${((streak.current_streak % streak.next_milestone.days) / streak.next_milestone.days) * 100}%`
                    : '100%'
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            
            {/* Streak flames */}
            {streak.current_streak > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="text-xs font-bold text-white drop-shadow-sm"
                >
                  🔥 {streak.current_streak}
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Next Milestone */}
        {showMilestones && streak.next_milestone && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{streak.next_milestone.badge}</span>
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    {streak.next_milestone.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {streak.next_milestone.days} day milestone
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-blue-600">
                  {streak.next_milestone.days_remaining} days
                </div>
                <div className="text-xs text-gray-500">
                  to go
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multiplier Info */}
        {!compact && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Streak Bonus</div>
              <div className="font-semibold flex items-center">
                <span className="mr-1">⚡</span>
                +{Math.round((streakMultiplier - 1) * 100)}%
              </div>
            </div>
            <div>
              <div className="text-gray-600">Weekend Bonus</div>
              <div className="font-semibold flex items-center">
                <span className="mr-1">🎉</span>
                {weekendMultiplier > 1 ? `+${Math.round((weekendMultiplier - 1) * 100)}%` : 'None'}
              </div>
            </div>
          </div>
        )}

        {/* Last Activity */}
        {streak.last_activity && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Last activity: {new Date(streak.last_activity).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {!compact && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-sm text-gray-700 italic">
              {getStreakMessage(streak.current_streak, streak.streak_status)}
            </div>
          </div>
        )}
      </div>

      {/* Accessibility */}
      <div className="sr-only">
        Current learning streak: {streak.current_streak} days.
        Status: {streak.streak_status}.
        Longest streak: {streak.longest_streak} days.
        XP multiplier: {streakMultiplier.toFixed(1)}x.
        {streak.next_milestone && 
          `Next milestone: ${streak.next_milestone.name} in ${streak.next_milestone.days_remaining} days.`
        }
      </div>
    </div>
  )
}

function getStreakMessage(streakDays: number, status: string): string {
  if (status === 'broken') {
    return "Don't worry! Every expert was once a beginner. Start your new streak today! 💪"
  }
  
  if (status === 'at_risk') {
    return "Your streak is at risk! Complete a task today to keep it alive! ⚠️"
  }
  
  if (streakDays === 0) {
    return "Ready to start your learning journey? Complete your first task! 🌱"
  }
  
  if (streakDays >= 100) {
    return "Incredible dedication! You're a true learning champion! 👑"
  }
  
  if (streakDays >= 30) {
    return "Amazing consistency! You're building incredible habits! 🔥"
  }
  
  if (streakDays >= 7) {
    return "Great momentum! Keep up the excellent work! ⚡"
  }
  
  if (streakDays >= 3) {
    return "Nice streak building up! Consistency is the key to success! 🌟"
  }
  
  return "Great start! Every day counts towards your goals! 🎯"
}

export default StreakTracker
