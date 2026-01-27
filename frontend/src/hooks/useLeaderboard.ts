/**
 * Leaderboard Hook
 * Custom hook for managing leaderboard data, real-time updates, and competition state
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GamificationService } from '../services/gamificationService'
import { SocialService } from '../services/socialService'
import { useWebSocket } from './useWebSocket'
import { useAuth } from '../contexts/AuthContext'
import type { LeaderboardEntry, PeerChallenge } from '../types/apiTypes'

interface UseLeaderboardOptions {
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time'
  limit?: number
  refreshInterval?: number
  enableRealTime?: boolean
}

interface LeaderboardState {
  entries: LeaderboardEntry[]
  userRank?: number
  totalParticipants: number
  lastUpdated: string
  isLoading: boolean
  error: string | null
}

interface CompetitionState {
  activeCompetitions: PeerChallenge[]
  userCompetitions: PeerChallenge[]
  isLoading: boolean
  error: string | null
}

export const useLeaderboard = (options: UseLeaderboardOptions = {}) => {
  const {
    timeframe = 'all_time',
    limit = 50,
    refreshInterval = 30000,
    enableRealTime = true,
  } = options

  const { user } = useAuth()
  const queryClient = useQueryClient()
  const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/leaderboard`
  const { connectionState, subscribe, unsubscribe } = useWebSocket(wsUrl, {
    enabled: enableRealTime,
    connectionName: 'leaderboard',
  })
  
  const [leaderboardState, setLeaderboardState] = useState<LeaderboardState>({
    entries: [],
    totalParticipants: 0,
    lastUpdated: new Date().toISOString(),
    isLoading: true,
    error: null,
  })

  const [competitionState, setCompetitionState] = useState<CompetitionState>({
    activeCompetitions: [],
    userCompetitions: [],
    isLoading: true,
    error: null,
  })

  const previousRanks = useRef<Map<string, number>>(new Map())
  const [rankChanges, setRankChanges] = useState<Map<string, number>>(new Map())

  // Fetch global leaderboard
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ['leaderboard', timeframe, limit],
    queryFn: () => GamificationService.getLeaderboard({ timeframe, limit }),
    refetchInterval: refreshInterval,
    staleTime: 10000, // Consider data stale after 10 seconds
  })

  // Fetch user competitions
  const {
    data: userCompetitions,
    isLoading: competitionsLoading,
    error: competitionsError,
    refetch: refetchCompetitions,
  } = useQuery({
    queryKey: ['userCompetitions', user?.id],
    queryFn: () => user ? SocialService.getUserChallenges(user.id) : Promise.resolve([]),
    enabled: !!user,
    refetchInterval: refreshInterval,
  })

  // Fetch challenge leaderboard
  const {
    data: challengeLeaderboard,
    refetch: refetchChallengeLeaderboard,
  } = useQuery({
    queryKey: ['challengeLeaderboard'],
    queryFn: () => SocialService.getChallengeLeaderboard(limit),
    refetchInterval: refreshInterval,
  })

  // Update leaderboard state when data changes
  useEffect(() => {
    const entries = Array.isArray(leaderboardData) ? leaderboardData : []
    if (entries.length > 0 || !leaderboardLoading) {
      // Track rank changes
      const newRankChanges = new Map<string, number>()
      entries.forEach((entry) => {
        const previousRank = previousRanks.current.get(entry.user_id)
        if (previousRank && previousRank !== entry.rank) {
          newRankChanges.set(entry.user_id, previousRank - entry.rank)
        }
        previousRanks.current.set(entry.user_id, entry.rank)
      })

      setRankChanges(newRankChanges)
      
      // Clear rank changes after animation
      setTimeout(() => setRankChanges(new Map()), 3000)

      const userEntry = entries.find(entry => entry.user_id === user?.id)
      
      setLeaderboardState({
        entries: entries,
        userRank: userEntry?.rank,
        totalParticipants: entries.length,
        lastUpdated: new Date().toISOString(),
        isLoading: leaderboardLoading,
        error: leaderboardError?.message || null,
      })
    }
  }, [leaderboardData, leaderboardLoading, leaderboardError, user?.id])

  // Update competition state
  useEffect(() => {
    const competitions = Array.isArray(userCompetitions) ? userCompetitions : []
    if (competitions.length > 0 || !competitionsLoading) {
      const activeCompetitions = competitions.filter(
        comp => comp.status === 'active' || comp.status === 'pending'
      )

      setCompetitionState({
        activeCompetitions,
        userCompetitions: competitions,
        isLoading: competitionsLoading,
        error: competitionsError?.message || null,
      })
    }
  }, [userCompetitions, competitionsLoading, competitionsError])

  // Real-time WebSocket updates
  useEffect(() => {
    if (!enableRealTime || !connectionState.isConnected) return

    const handleLeaderboardUpdate = (data: any) => {
      // Update leaderboard data
      queryClient.setQueryData(['leaderboard', timeframe, limit], data.leaderboard)
      
      // Trigger refetch to ensure consistency
      refetchLeaderboard()
    }

    const handleCompetitionUpdate = (data: any) => {
      // Update competition data
      if (data.type === 'competition_started' || data.type === 'competition_ended') {
        refetchCompetitions()
      }
      
      if (data.type === 'challenge_completed') {
        refetchChallengeLeaderboard()
      }
    }

    const handleRankChange = (data: any) => {
      if (data.userId === user?.id) {
        // User's rank changed
        setLeaderboardState(prev => ({
          ...prev,
          userRank: data.newRank,
        }))
      }
    }

    // Subscribe to WebSocket events
    subscribe('leaderboard_update', handleLeaderboardUpdate)
    subscribe('competition_update', handleCompetitionUpdate)
    subscribe('rank_change', handleRankChange)

    return () => {
      unsubscribe('leaderboard_update', handleLeaderboardUpdate)
      unsubscribe('competition_update', handleCompetitionUpdate)
      unsubscribe('rank_change', handleRankChange)
    }
  }, [
    enableRealTime,
    connectionState.isConnected,
    timeframe,
    limit,
    user?.id,
    queryClient,
    refetchLeaderboard,
    refetchCompetitions,
    refetchChallengeLeaderboard,
    subscribe,
    unsubscribe,
  ])

  // Join competition mutation
  const joinCompetitionMutation = useMutation({
    mutationFn: async ({ challengeId, userId }: { challengeId: string; userId: string }) => {
      return SocialService.acceptChallenge(challengeId, userId)
    },
    onSuccess: () => {
      refetchCompetitions()
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
    },
  })

  // Submit challenge result mutation
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
    onSuccess: () => {
      refetchCompetitions()
      refetchChallengeLeaderboard()
      refetchLeaderboard()
    },
  })

  // Utility functions
  const getUserRankChange = useCallback((userId: string): number | null => {
    return rankChanges.get(userId) || null
  }, [rankChanges])

  const isUserInTopTen = useCallback((): boolean => {
    return (leaderboardState.userRank || Infinity) <= 10
  }, [leaderboardState.userRank])

  const getUserPercentile = useCallback((): number => {
    if (!leaderboardState.userRank || !leaderboardState.totalParticipants) return 0
    return Math.round((1 - (leaderboardState.userRank - 1) / leaderboardState.totalParticipants) * 100)
  }, [leaderboardState.userRank, leaderboardState.totalParticipants])

  const getCompetitionsByStatus = useCallback((status: string) => {
    return competitionState.userCompetitions.filter(comp => comp.status === status)
  }, [competitionState.userCompetitions])

  const hasActiveCompetitions = useCallback((): boolean => {
    return competitionState.activeCompetitions.length > 0
  }, [competitionState.activeCompetitions])

  // Manual refresh functions
  const refreshLeaderboard = useCallback(() => {
    refetchLeaderboard()
  }, [refetchLeaderboard])

  const refreshCompetitions = useCallback(() => {
    refetchCompetitions()
  }, [refetchCompetitions])

  const refreshAll = useCallback(() => {
    refetchLeaderboard()
    refetchCompetitions()
    refetchChallengeLeaderboard()
  }, [refetchLeaderboard, refetchCompetitions, refetchChallengeLeaderboard])

  return {
    // Leaderboard state
    leaderboard: leaderboardState,
    competitions: competitionState,
    challengeLeaderboard,
    
    // User-specific data
    userRank: leaderboardState.userRank,
    userPercentile: getUserPercentile(),
    isInTopTen: isUserInTopTen(),
    
    // Rank changes
    getRankChange: getUserRankChange,
    rankChanges,
    
    // Competition helpers
    activeCompetitions: competitionState.activeCompetitions,
    hasActiveCompetitions: hasActiveCompetitions(),
    getCompetitionsByStatus,
    
    // Actions
    joinCompetition: joinCompetitionMutation.mutate,
    submitResult: submitResultMutation.mutate,
    
    // Refresh functions
    refreshLeaderboard,
    refreshCompetitions,
    refreshAll,
    
    // Loading states
    isJoiningCompetition: joinCompetitionMutation.isPending,
    isSubmittingResult: submitResultMutation.isPending,
    
    // Connection state
    isConnected: connectionState.isConnected,
  }
}

export default useLeaderboard
