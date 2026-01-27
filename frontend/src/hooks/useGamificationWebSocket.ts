/**
 * Gamification WebSocket Hook - Real-time updates for XP, achievements, and streaks
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryClient'

interface GamificationEvent {
  type: 'xp_awarded' | 'achievement_unlocked' | 'level_up' | 'streak_updated' | 'milestone_reached'
  data: {
    user_id: string
    xp_amount?: number
    total_xp?: number
    level?: number
    achievement?: {
      id: string
      name: string
      badge: string
      rarity: string
      xp_reward: number
    }
    streak?: {
      current_streak: number
      milestone?: {
        name: string
        badge: string
        days: number
      }
    }
    timestamp: string
  }
}

export function useGamificationWebSocket() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (!user?.id) return

    try {
      const wsUrl = `${import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'}/ws/gamification/${user.id}`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('Gamification WebSocket connected')
        reconnectAttempts.current = 0
      }

      wsRef.current.onmessage = (event) => {
        try {
          const gamificationEvent: GamificationEvent = JSON.parse(event.data)
          handleGamificationEvent(gamificationEvent)
        } catch (error) {
          console.error('Failed to parse gamification WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('Gamification WebSocket disconnected:', event.code, event.reason)
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('Gamification WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create gamification WebSocket connection:', error)
    }
  }

  const handleGamificationEvent = (event: GamificationEvent) => {
    const { type, data } = event

    // Only handle events for the current user
    if (data.user_id !== user?.id) return

    switch (type) {
      case 'xp_awarded':
        handleXPAwarded(data)
        break
      case 'achievement_unlocked':
        handleAchievementUnlocked(data)
        break
      case 'level_up':
        handleLevelUp(data)
        break
      case 'streak_updated':
        handleStreakUpdated(data)
        break
      case 'milestone_reached':
        handleMilestoneReached(data)
        break
    }

    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.gamification.profile(user?.id || '') 
    })
  }

  const handleXPAwarded = (data: GamificationEvent['data']) => {
    if (data.xp_amount) {
      console.log(`+${data.xp_amount} XP earned!`)
    }
  }

  const handleAchievementUnlocked = (data: GamificationEvent['data']) => {
    if (data.achievement) {
      const { achievement } = data
      console.log(`Achievement Unlocked: ${achievement.name} (+${achievement.xp_reward} XP)`)

      // Invalidate achievements query
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.gamification.achievements(user?.id || '', {}) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.gamification.badges(user?.id || '') 
      })
    }
  }

  const handleLevelUp = (data: GamificationEvent['data']) => {
    if (data.level) {
      console.log(`LEVEL UP! Now Level ${data.level}`)
    }
  }

  const handleStreakUpdated = (data: GamificationEvent['data']) => {
    if (data.streak) {
      const { current_streak } = data.streak
      if (current_streak > 0) {
        console.log(`${current_streak} day streak! Keep it up!`)
      }
    }
  }

  const handleMilestoneReached = (data: GamificationEvent['data']) => {
    if (data.streak?.milestone) {
      const { milestone } = data.streak
      console.log(`Milestone Reached: ${milestone.name} (${milestone.days} days)`)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting')
      wsRef.current = null
    }
  }

  useEffect(() => {
    if (user?.id) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [user?.id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnectAttempts: reconnectAttempts.current,
    connect,
    disconnect,
  }
}
