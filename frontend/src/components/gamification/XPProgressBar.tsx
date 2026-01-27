/**
 * XP Progress Bar Component - Displays XP tracking with level progression and smooth animations
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGamificationProfile } from '../../hooks/api/useGamification'
import { GamificationService } from '../../services/gamificationService'
import { useAuth } from '../../contexts/AuthContext'

interface XPProgressBarProps {
  userId?: string
  showDetails?: boolean
  compact?: boolean
  animated?: boolean
  className?: string
}

interface LevelUpCelebration {
  show: boolean
  newLevel: number
  xpGained: number
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  userId,
  showDetails = true,
  compact = false,
  animated = true,
  className = '',
}) => {
  const { user } = useAuth()
  const targetUserId = userId || user?.id || null
  const { data: profile, isLoading } = useGamificationProfile(targetUserId)
  
  const [celebration, setCelebration] = useState<LevelUpCelebration>({
    show: false,
    newLevel: 0,
    xpGained: 0,
  })
  const [animatedXP, setAnimatedXP] = useState(0)
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // Animate XP changes
  useEffect(() => {
    if (profile && animated) {
      const targetXP = profile.total_xp
      const targetProgress = profile.level_progress
      
      // Animate XP counter
      const xpDuration = 1000
      const xpStart = Date.now()
      const xpStartValue = animatedXP
      
      const animateXP = () => {
        const elapsed = Date.now() - xpStart
        const progress = Math.min(elapsed / xpDuration, 1)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        
        setAnimatedXP(Math.floor(xpStartValue + (targetXP - xpStartValue) * easeOutQuart))
        
        if (progress < 1) {
          requestAnimationFrame(animateXP)
        }
      }
      
      // Animate progress bar
      const progressDuration = 800
      const progressStart = Date.now()
      const progressStartValue = animatedProgress
      
      const animateProgress = () => {
        const elapsed = Date.now() - progressStart
        const progress = Math.min(elapsed / progressDuration, 1)
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        
        setAnimatedProgress(progressStartValue + (targetProgress - progressStartValue) * easeOutCubic)
        
        if (progress < 1) {
          requestAnimationFrame(animateProgress)
        }
      }
      
      requestAnimationFrame(animateXP)
      requestAnimationFrame(animateProgress)
    } else if (profile) {
      setAnimatedXP(profile.total_xp)
      setAnimatedProgress(profile.level_progress)
    }
  }, [profile, animated])

  // Check for level up
  useEffect(() => {
    if (profile && animatedXP > 0) {
      const currentLevel = GamificationService.calculateLevel(animatedXP).level
      const previousLevel = GamificationService.calculateLevel(Math.max(0, animatedXP - 100)).level
      
      if (currentLevel > previousLevel && !celebration.show) {
        setCelebration({
          show: true,
          newLevel: currentLevel,
          xpGained: 100, // Approximate XP gained
        })
        
        // Hide celebration after 3 seconds
        setTimeout(() => {
          setCelebration(prev => ({ ...prev, show: false }))
        }, 3000)
      }
    }
  }, [animatedXP, celebration.show])

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`bg-gray-200 rounded-lg ${compact ? 'h-8' : 'h-16'}`} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <p>Unable to load XP data</p>
      </div>
    )
  }

  const levelInfo = GamificationService.getLevelInfo(profile.level)
  const progressPercentage = animatedProgress * 100

  return (
    <div className={`relative ${className}`}>
      {/* Level Up Celebration */}
      <AnimatePresence>
        {celebration.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">LEVEL UP!</div>
                <div className="text-lg">Level {celebration.newLevel}</div>
                <div className="text-sm opacity-90">+{celebration.xpGained} XP</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Progress Bar */}
      <div className={`bg-white rounded-lg shadow-sm border ${compact ? 'p-3' : 'p-4'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl" role="img" aria-label="Level badge">
              {levelInfo.badge}
            </span>
            <div>
              <div className="font-semibold text-gray-900">
                Level {profile.level}
              </div>
              {showDetails && (
                <div className="text-sm text-gray-600">
                  {levelInfo.title}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-bold text-lg text-gray-900">
              {GamificationService.formatXP(animatedXP)}
            </div>
            {showDetails && (
              <div className="text-sm text-gray-600">
                {profile.xp_to_next_level > 0 
                  ? `${profile.xp_to_next_level} to next level`
                  : 'Max level reached!'
                }
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${
                levelInfo.color === 'gold' ? 'from-yellow-400 to-yellow-600' :
                levelInfo.color === 'purple' ? 'from-purple-400 to-purple-600' :
                levelInfo.color === 'blue' ? 'from-blue-400 to-blue-600' :
                levelInfo.color === 'green' ? 'from-green-400 to-green-600' :
                levelInfo.color === 'yellow' ? 'from-yellow-300 to-yellow-500' :
                'from-gray-400 to-gray-600'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: animated ? 0.8 : 0, ease: 'easeOut' }}
            />
          </div>
          
          {/* Progress Percentage */}
          {showDetails && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          )}
        </div>

        {/* Additional Details */}
        {showDetails && !compact && (
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Current Streak</div>
              <div className="font-semibold flex items-center">
                <span className="mr-1">🔥</span>
                {profile.streak?.current_streak || 0} days
              </div>
            </div>
            <div>
              <div className="text-gray-600">Achievements</div>
              <div className="font-semibold flex items-center">
                <span className="mr-1">🏆</span>
                {profile.achievements_unlocked}/{profile.total_achievements}
              </div>
            </div>
          </div>
        )}

        {/* Recent XP Events */}
        {showDetails && !compact && profile.recent_xp_events.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-sm text-gray-600 mb-2">Recent Activity</div>
            <div className="space-y-1">
              {profile.recent_xp_events.slice(0, 3).map((event, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-600 capitalize">
                    {event.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium text-green-600">
                    +{event.xp_earned} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accessibility */}
      <div className="sr-only">
        Level {profile.level} with {animatedXP} total experience points. 
        Progress to next level: {Math.round(progressPercentage)}%.
        {profile.xp_to_next_level > 0 && `${profile.xp_to_next_level} XP needed for next level.`}
      </div>
    </div>
  )
}

export default XPProgressBar