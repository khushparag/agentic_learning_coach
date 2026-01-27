/**
 * Progress Sharing Feed Component
 * Displays and manages real-time progress sharing and celebrations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Trophy, 
  Star, 
  Flame, 
  Target, 
  Heart, 
  ThumbsUp, 
  Zap, 
  Award,
  TrendingUp,
  Clock,
  Users,
  Share2,
  MessageCircle
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import type { 
  ProgressShare, 
  CollaborationUser, 
  CollaborationSession 
} from '../../types/collaboration'
import { collaborationService } from '../../services/collaborationService'
import { formatDistanceToNow } from 'date-fns'

interface ProgressSharingFeedProps {
  session: CollaborationSession | null
  currentUser: CollaborationUser
  className?: string
}

interface CelebrationAnimation {
  id: string
  type: 'confetti' | 'fireworks' | 'sparkles'
  x: number
  y: number
  timestamp: Date
}

const ACHIEVEMENT_ICONS = {
  task_completed: Target,
  milestone_reached: Trophy,
  streak_achieved: Flame,
  level_up: Star
}

const CELEBRATION_EMOJIS = [
  '🎉', '🎊', '🥳', '🏆', '⭐', '💫', '🔥', '💪', 
  '👏', '🙌', '✨', '🌟', '🎯', '🚀', '💎', '🏅'
]

const QUICK_REACTIONS = [
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '👏', label: 'Applaud' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💪', label: 'Strong' },
  { emoji: '⭐', label: 'Star' },
  { emoji: '🚀', label: 'Rocket' }
]

export const ProgressSharingFeed: React.FC<ProgressSharingFeedProps> = ({
  session,
  currentUser,
  className = ''
}) => {
  const [progressShares, setProgressShares] = useState<ProgressShare[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [selectedAchievement, setSelectedAchievement] = useState<{
    type: ProgressShare['type']
    data: any
  } | null>(null)
  const [celebrations, setCelebrations] = useState<CelebrationAnimation[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const feedRef = useRef<HTMLDivElement>(null)
  const celebrationTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Handle new progress share
  const handleProgressShare = useCallback((share: ProgressShare) => {
    setProgressShares(prev => [share, ...prev].slice(0, 50)) // Keep last 50 shares
    
    // Trigger celebration animation
    if (share.userId !== currentUser.id) {
      triggerCelebration(share.type)
    }
  }, [currentUser.id])

  // Trigger celebration animation
  const triggerCelebration = useCallback((type: ProgressShare['type']) => {
    const animationType = type === 'level_up' ? 'fireworks' : 
                         type === 'streak_achieved' ? 'sparkles' : 'confetti'
    
    const celebration: CelebrationAnimation = {
      id: `celebration-${Date.now()}-${Math.random()}`,
      type: animationType,
      x: Math.random() * (window.innerWidth - 200) + 100,
      y: Math.random() * (window.innerHeight - 200) + 100,
      timestamp: new Date()
    }

    setCelebrations(prev => [...prev, celebration])

    // Remove celebration after animation
    const timeout = setTimeout(() => {
      setCelebrations(prev => prev.filter(c => c.id !== celebration.id))
    }, 3000)

    celebrationTimeoutRef.current.set(celebration.id, timeout)
  }, [])

  // Share progress
  const shareProgress = useCallback(async () => {
    if (!selectedAchievement || !session) return

    try {
      collaborationService.shareProgress({
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        type: selectedAchievement.type,
        data: selectedAchievement.data,
        message: shareMessage.trim() || undefined
      })

      setShowShareModal(false)
      setShareMessage('')
      setSelectedAchievement(null)
    } catch (error) {
      console.error('Failed to share progress:', error)
    }
  }, [selectedAchievement, session, currentUser, shareMessage])

  // Celebrate progress
  const celebrateProgress = useCallback((shareId: string, emoji: string) => {
    collaborationService.celebrateProgress(shareId, emoji)
    
    // Update local state optimistically
    setProgressShares(prev => prev.map(share => {
      if (share.id === shareId) {
        const existingReaction = share.reactions.find(r => r.userId === currentUser.id)
        if (existingReaction) {
          // Update existing reaction
          return {
            ...share,
            reactions: share.reactions.map(r => 
              r.userId === currentUser.id ? { ...r, emoji } : r
            )
          }
        } else {
          // Add new reaction
          return {
            ...share,
            reactions: [...share.reactions, {
              emoji,
              userId: currentUser.id,
              username: currentUser.username
            }],
            celebrationCount: share.celebrationCount + 1
          }
        }
      }
      return share
    }))
  }, [currentUser])

  // Format achievement data
  const formatAchievementData = useCallback((share: ProgressShare) => {
    switch (share.type) {
      case 'task_completed':
        return `Completed "${share.data.taskName}"`
      case 'milestone_reached':
        return `Reached milestone: ${share.data.milestoneName}`
      case 'streak_achieved':
        return `${share.data.streakDays} day learning streak!`
      case 'level_up':
        return `Leveled up to Level ${share.data.newLevel}!`
      default:
        return 'Achievement unlocked!'
    }
  }, [])

  // Get achievement color
  const getAchievementColor = useCallback((type: ProgressShare['type']) => {
    switch (type) {
      case 'task_completed':
        return 'text-blue-600 bg-blue-100'
      case 'milestone_reached':
        return 'text-purple-600 bg-purple-100'
      case 'streak_achieved':
        return 'text-orange-600 bg-orange-100'
      case 'level_up':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }, [])

  // Setup event listeners
  useEffect(() => {
    if (!session) return

    const unsubscribers = [
      collaborationService.on('progress_shared', handleProgressShare),
      collaborationService.on('progress_celebration', (data: { shareId: string; emoji: string; userId: string; username: string }) => {
        setProgressShares(prev => prev.map(share => {
          if (share.id === data.shareId) {
            const existingReactionIndex = share.reactions.findIndex(r => r.userId === data.userId)
            if (existingReactionIndex >= 0) {
              // Update existing reaction
              const newReactions = [...share.reactions]
              newReactions[existingReactionIndex] = {
                ...newReactions[existingReactionIndex],
                emoji: data.emoji
              }
              return { ...share, reactions: newReactions }
            } else {
              // Add new reaction
              return {
                ...share,
                reactions: [...share.reactions, {
                  emoji: data.emoji,
                  userId: data.userId,
                  username: data.username
                }],
                celebrationCount: share.celebrationCount + 1
              }
            }
          }
          return share
        }))
      }),
      collaborationService.on('connection_status', (data: { connected: boolean }) => {
        setIsConnected(data.connected)
      })
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [session, handleProgressShare])

  // Load initial progress shares
  useEffect(() => {
    if (!session) return

    const loadProgressShares = async () => {
      try {
        const response = await fetch(`/api/collaboration/sessions/${session.id}/progress-shares`)
        if (response.ok) {
          const shares = await response.json()
          setProgressShares(shares)
        }
      } catch (error) {
        console.error('Failed to load progress shares:', error)
      }
    }

    loadProgressShares()
  }, [session])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      celebrationTimeoutRef.current.forEach(timeout => clearTimeout(timeout))
      celebrationTimeoutRef.current.clear()
    }
  }, [])

  // Mock function to simulate achievement detection
  const detectAchievement = useCallback(() => {
    // This would normally be triggered by actual progress events
    const achievements = [
      {
        type: 'task_completed' as const,
        data: { taskName: 'Array Manipulation Challenge', xpGained: 50 }
      },
      {
        type: 'streak_achieved' as const,
        data: { streakDays: 7 }
      },
      {
        type: 'level_up' as const,
        data: { newLevel: 5, xpGained: 100 }
      }
    ]

    const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)]
    setSelectedAchievement(randomAchievement)
    setShowShareModal(true)
  }, [])

  return (
    <>
      <Card className={`flex flex-col h-full ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">Progress Feed</h3>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={detectAchievement}
          >
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>

        {/* Progress Feed */}
        <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {progressShares.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No progress shared yet</p>
              <p className="text-sm">Be the first to share an achievement!</p>
            </div>
          ) : (
            progressShares.map((share) => {
              const IconComponent = ACHIEVEMENT_ICONS[share.type]
              const colorClass = getAchievementColor(share.type)
              
              return (
                <Card key={share.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {share.avatar ? (
                        <img
                          src={share.avatar}
                          alt={share.username}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">{share.username}</span>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${colorClass}`}>
                          <IconComponent className="w-3 h-3" />
                          <span className="font-medium">{share.type.replace('_', ' ')}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(share.timestamp), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-gray-900 mb-2">
                        {formatAchievementData(share)}
                      </p>

                      {share.message && (
                        <p className="text-gray-700 text-sm mb-3 italic">
                          "{share.message}"
                        </p>
                      )}

                      {/* Achievement Details */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        {share.data.xpGained && (
                          <div className="flex items-center space-x-1">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span>+{share.data.xpGained} XP</span>
                          </div>
                        )}
                        {share.data.badge && (
                          <div className="flex items-center space-x-1">
                            <Award className="w-4 h-4 text-purple-500" />
                            <span>{share.data.badge.name}</span>
                          </div>
                        )}
                        {share.data.streakDays && (
                          <div className="flex items-center space-x-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span>{share.data.streakDays} days</span>
                          </div>
                        )}
                      </div>

                      {/* Reactions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {QUICK_REACTIONS.map((reaction) => (
                            <button
                              key={reaction.emoji}
                              onClick={() => celebrateProgress(share.id, reaction.emoji)}
                              className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                              title={reaction.label}
                            >
                              <span>{reaction.emoji}</span>
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {share.celebrationCount > 0 && (
                            <span className="flex items-center space-x-1">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span>{share.celebrationCount}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Existing Reactions */}
                      {share.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {share.reactions.reduce((acc, reaction) => {
                            const existing = acc.find(r => r.emoji === reaction.emoji)
                            if (existing) {
                              existing.users.push(reaction.username)
                              existing.count++
                            } else {
                              acc.push({
                                emoji: reaction.emoji,
                                users: [reaction.username],
                                count: 1
                              })
                            }
                            return acc
                          }, [] as Array<{ emoji: string; users: string[]; count: number }>).map((reaction, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded-full text-xs"
                              title={reaction.users.join(', ')}
                            >
                              <span>{reaction.emoji}</span>
                              <span>{reaction.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </Card>

      {/* Share Progress Modal */}
      {showShareModal && selectedAchievement && (
        <Modal
          isOpen={true}
          onClose={() => setShowShareModal(false)}
          title="Share Your Achievement"
        >
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                {React.createElement(ACHIEVEMENT_ICONS[selectedAchievement.type], {
                  className: "w-8 h-8 text-yellow-600"
                })}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {formatAchievementData({
                  type: selectedAchievement.type,
                  data: selectedAchievement.data
                } as ProgressShare)}
              </h3>
              {selectedAchievement.data.xpGained && (
                <p className="text-sm text-gray-600">
                  +{selectedAchievement.data.xpGained} XP earned
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a message (optional)
              </label>
              <Input
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="Share your thoughts about this achievement..."
                className="w-full"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={shareProgress}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Achievement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Celebration Animations */}
      {celebrations.map((celebration) => (
        <CelebrationAnimation
          key={celebration.id}
          type={celebration.type}
          x={celebration.x}
          y={celebration.y}
        />
      ))}
    </>
  )
}

// Celebration Animation Component
interface CelebrationAnimationProps {
  type: 'confetti' | 'fireworks' | 'sparkles'
  x: number
  y: number
}

const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({ type, x, y }) => {
  useEffect(() => {
    const element = document.createElement('div')
    element.className = `celebration-animation celebration-${type}`
    element.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      z-index: 9999;
      animation: celebration-${type} 3s ease-out forwards;
    `

    // Add animation content based on type
    if (type === 'confetti') {
      element.innerHTML = CELEBRATION_EMOJIS.slice(0, 8).map((emoji, i) => 
        `<span style="
          position: absolute;
          animation: confetti-fall 3s ease-out ${i * 0.1}s forwards;
          font-size: 24px;
        ">${emoji}</span>`
      ).join('')
    } else if (type === 'fireworks') {
      element.innerHTML = '🎆'.repeat(5)
      element.style.fontSize = '32px'
    } else {
      element.innerHTML = '✨'.repeat(8)
      element.style.fontSize = '20px'
    }

    document.body.appendChild(element)

    // Remove after animation
    setTimeout(() => {
      if (document.body.contains(element)) {
        document.body.removeChild(element)
      }
    }, 3000)

    return () => {
      if (document.body.contains(element)) {
        document.body.removeChild(element)
      }
    }
  }, [type, x, y])

  return null
}

// Add CSS animations
const celebrationStyles = `
  @keyframes celebration-confetti {
    0% { transform: scale(0) rotate(0deg); opacity: 1; }
    50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
    100% { transform: scale(0.8) rotate(360deg); opacity: 0; }
  }

  @keyframes celebration-fireworks {
    0% { transform: scale(0); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.8; }
    100% { transform: scale(2); opacity: 0; }
  }

  @keyframes celebration-sparkles {
    0% { transform: scale(0) rotate(0deg); opacity: 1; }
    50% { transform: scale(1) rotate(180deg); opacity: 1; }
    100% { transform: scale(0) rotate(360deg); opacity: 0; }
  }

  @keyframes confetti-fall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(200px) rotate(720deg); opacity: 0; }
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = celebrationStyles
  document.head.appendChild(styleElement)
}

export default ProgressSharingFeed
