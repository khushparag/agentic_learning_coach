/**
 * Competition Hook
 * Custom hook for managing competition participation, real-time updates, and challenge state
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SocialService } from '../services/socialService'
import { useWebSocket } from './useWebSocket'
import { useAuth } from '../contexts/AuthContext'
import type { PeerChallenge } from '../types/apiTypes'

interface CompetitionSession {
  challengeId: string
  startTime: number
  timeLimit: number
  isActive: boolean
  code: string
  language: string
  submissions: number
  maxSubmissions: number
  currentScore?: number
  opponentScore?: number
}

interface UseCompetitionOptions {
  challengeId?: string
  enableRealTime?: boolean
  autoJoin?: boolean
}

interface CompetitionState {
  session: CompetitionSession | null
  challenge: PeerChallenge | null
  timeRemaining: number
  isLoading: boolean
  error: string | null
  liveUpdates: any[]
}

export const useCompetition = (options: UseCompetitionOptions = {}) => {
  const { challengeId, enableRealTime = true, autoJoin = false } = options
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/competition`
  const { connectionState, subscribe, unsubscribe, send } = useWebSocket(wsUrl, {
    enabled: enableRealTime && !!challengeId,
    connectionName: `competition-${challengeId}`,
  })
  
  const [competitionState, setCompetitionState] = useState<CompetitionState>({
    session: null,
    challenge: null,
    timeRemaining: 0,
    isLoading: false,
    error: null,
    liveUpdates: [],
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionRef = useRef<CompetitionSession | null>(null)

  // Fetch challenge details
  const {
    data: challenge,
    isLoading: challengeLoading,
    error: challengeError,
  } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: async () => {
      if (!challengeId || !user) return null
      const challenges = await SocialService.getUserChallenges(user.id)
      const challengesArray = Array.isArray(challenges) ? challenges : []
      return challengesArray.find(c => c.id === challengeId) || null
    },
    enabled: !!challengeId && !!user,
  })

  // Initialize competition session
  const initializeSession = useCallback((challenge: PeerChallenge) => {
    const timeLimit = getTimeLimitForType(challenge.challenge_type)
    const session: CompetitionSession = {
      challengeId: challenge.id,
      startTime: Date.now(),
      timeLimit,
      isActive: true,
      code: getStarterCode(challenge.challenge_type),
      language: 'javascript',
      submissions: 0,
      maxSubmissions: 3,
    }

    sessionRef.current = session
    setCompetitionState(prev => ({
      ...prev,
      session,
      challenge,
      timeRemaining: timeLimit,
      isLoading: false,
    }))

    // Start timer
    startTimer(timeLimit)

    // Join competition room for real-time updates
    if (enableRealTime && connectionState.isConnected) {
      send('join_competition', { challengeId: challenge.id, userId: user?.id })
    }
  }, [enableRealTime, connectionState.isConnected, user?.id, send])

  // Timer management
  const startTimer = useCallback((initialTime: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setCompetitionState(prev => {
        const newTimeRemaining = Math.max(0, prev.timeRemaining - 1)
        
        if (newTimeRemaining === 0 && prev.session?.isActive) {
          // Time's up - auto submit
          handleTimeUp()
        }
        
        return {
          ...prev,
          timeRemaining: newTimeRemaining,
        }
      })
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Handle time up
  const handleTimeUp = useCallback(() => {
    setCompetitionState(prev => ({
      ...prev,
      session: prev.session ? { ...prev.session, isActive: false } : null,
    }))
    
    stopTimer()
    
    // Auto-submit current code
    if (sessionRef.current && user) {
      submitResultMutation.mutate({
        challengeId: sessionRef.current.challengeId,
        userId: user.id,
        score: calculateScore(sessionRef.current),
      })
    }
  }, [user, stopTimer])

  // Join competition mutation
  const joinCompetitionMutation = useMutation({
    mutationFn: async ({ challengeId, userId }: { challengeId: string; userId: string }) => {
      return SocialService.acceptChallenge(challengeId, userId)
    },
    onSuccess: (result, variables) => {
      if (challenge) {
        initializeSession(challenge)
      }
    },
    onError: (error) => {
      setCompetitionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join competition',
      }))
    },
  })

  // Submit result mutation
  const submitResultMutation = useMutation({
    mutationFn: async ({ 
      challengeId, 
      userId, 
      score 
    }: { 
      challengeId: string
      userId: string
      score: number 
    }) => {
      return SocialService.submitChallengeResult(challengeId, userId, score)
    },
    onSuccess: (result) => {
      setCompetitionState(prev => ({
        ...prev,
        session: prev.session ? {
          ...prev.session,
          submissions: prev.session.submissions + 1,
          currentScore: result.your_score,
        } : null,
      }))

      if (result.completed) {
        // Competition completed
        stopTimer()
        setCompetitionState(prev => ({
          ...prev,
          session: prev.session ? { ...prev.session, isActive: false } : null,
        }))
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
    onError: (error) => {
      setCompetitionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to submit result',
      }))
    },
  })

  // Real-time WebSocket updates
  useEffect(() => {
    if (!enableRealTime || !connectionState.isConnected || !challengeId) return

    const handleCompetitionUpdate = (data: any) => {
      setCompetitionState(prev => ({
        ...prev,
        liveUpdates: [...prev.liveUpdates.slice(-9), data], // Keep last 10 updates
      }))

      if (data.type === 'opponent_score_update') {
        setCompetitionState(prev => ({
          ...prev,
          session: prev.session ? {
            ...prev.session,
            opponentScore: data.score,
          } : null,
        }))
      }
    }

    const handleParticipantJoined = (data: any) => {
      setCompetitionState(prev => ({
        ...prev,
        liveUpdates: [...prev.liveUpdates.slice(-9), {
          type: 'participant_joined',
          message: `${data.username} joined the competition`,
          timestamp: Date.now(),
        }],
      }))
    }

    const handleParticipantLeft = (data: any) => {
      setCompetitionState(prev => ({
        ...prev,
        liveUpdates: [...prev.liveUpdates.slice(-9), {
          type: 'participant_left',
          message: `${data.username} left the competition`,
          timestamp: Date.now(),
        }],
      }))
    }

    // Subscribe to WebSocket events
    subscribe('competition_update', handleCompetitionUpdate)
    subscribe('participant_joined', handleParticipantJoined)
    subscribe('participant_left', handleParticipantLeft)

    return () => {
      unsubscribe('competition_update', handleCompetitionUpdate)
      unsubscribe('participant_joined', handleParticipantJoined)
      unsubscribe('participant_left', handleParticipantLeft)
    }
  }, [
    enableRealTime,
    connectionState.isConnected,
    challengeId,
    subscribe,
    unsubscribe,
  ])

  // Auto-join if enabled
  useEffect(() => {
    if (autoJoin && challenge && user && !competitionState.session) {
      joinCompetitionMutation.mutate({
        challengeId: challenge.id,
        userId: user.id,
      })
    }
  }, [autoJoin, challenge, user, competitionState.session, joinCompetitionMutation])

  // Update code in session
  const updateCode = useCallback((newCode: string) => {
    setCompetitionState(prev => ({
      ...prev,
      session: prev.session ? { ...prev.session, code: newCode } : null,
    }))
    
    if (sessionRef.current) {
      sessionRef.current.code = newCode
    }
  }, [])

  // Submit solution
  const submitSolution = useCallback(() => {
    if (!competitionState.session || !user) return

    const score = calculateScore(competitionState.session)
    submitResultMutation.mutate({
      challengeId: competitionState.session.challengeId,
      userId: user.id,
      score,
    })
  }, [competitionState.session, user, submitResultMutation])

  // Exit competition
  const exitCompetition = useCallback(() => {
    stopTimer()
    setCompetitionState(prev => ({
      ...prev,
      session: null,
      challenge: null,
      timeRemaining: 0,
    }))
    
    if (enableRealTime && connectionState.isConnected && challengeId) {
      send('leave_competition', { challengeId, userId: user?.id })
    }
  }, [stopTimer, enableRealTime, connectionState.isConnected, challengeId, user?.id, send])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      if (enableRealTime && connectionState.isConnected && challengeId) {
        send('leave_competition', { challengeId, userId: user?.id })
      }
    }
  }, [stopTimer, enableRealTime, connectionState.isConnected, challengeId, user?.id, send])

  // Utility functions
  const canSubmit = (competitionState.session?.code?.trim()?.length ?? 0) > 0 && 
                   (competitionState.session?.submissions ?? 0) < (competitionState.session?.maxSubmissions ?? 0) && 
                   (competitionState.session?.isActive ?? false)

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return {
    // State
    session: competitionState.session,
    challenge: competitionState.challenge,
    timeRemaining: competitionState.timeRemaining,
    liveUpdates: competitionState.liveUpdates,
    
    // Loading states
    isLoading: competitionState.isLoading || challengeLoading,
    isJoining: joinCompetitionMutation.isPending,
    isSubmitting: submitResultMutation.isPending,
    
    // Error state
    error: competitionState.error || challengeError?.message || null,
    
    // Actions
    joinCompetition: (challengeId: string) => {
      if (user) {
        joinCompetitionMutation.mutate({ challengeId, userId: user.id })
      }
    },
    updateCode,
    submitSolution,
    exitCompetition,
    
    // Utilities
    canSubmit,
    formatTime: (seconds?: number) => formatTime(seconds ?? competitionState.timeRemaining),
    
    // Connection state
    isConnected: connectionState.isConnected,
  }
}

// Helper functions
function getTimeLimitForType(type: string): number {
  switch (type) {
    case 'speed_coding': return 900 // 15 minutes
    case 'code_golf': return 1800 // 30 minutes
    case 'best_practices': return 2700 // 45 minutes
    default: return 1800
  }
}

function getStarterCode(type: string): string {
  switch (type) {
    case 'speed_coding':
      return `// Speed Challenge: Implement the fastest solution
function solve(input) {
  // Your code here
  return result;
}`
    case 'code_golf':
      return `// Code Golf: Shortest solution wins
// Current best: 42 characters
function solve(input) {
  // Your code here
}`
    case 'best_practices':
      return `// Best Practices Challenge: Focus on clean, maintainable code
/**
 * Implement a solution following best practices:
 * - Clear variable names
 * - Proper error handling
 * - Good documentation
 * - Efficient algorithms
 */
function solve(input) {
  // Your code here
}`
    default:
      return '// Your code here'
  }
}

function calculateScore(session: CompetitionSession): number {
  const timeUsed = (Date.now() - session.startTime) / 1000
  const timeBonus = Math.max(0, (session.timeLimit - timeUsed) / session.timeLimit * 100)
  
  switch (session.challengeId.includes('speed')) {
    case true:
      return Math.round(500 + timeBonus * 5) // Speed bonus
    default:
      return Math.round(800 + Math.random() * 200) // Mock score
  }
}

export default useCompetition