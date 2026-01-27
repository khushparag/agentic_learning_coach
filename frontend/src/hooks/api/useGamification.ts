/**
 * Gamification API Hooks - React Query hooks for badges, achievements, XP system, and streaks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GamificationService } from '../../services/gamificationService'
import { queryKeys, handleQueryError, optimisticUpdates } from '../../lib/queryClient'
import type {
  Achievement,
  UserGamificationProfile,
  AwardXPRequest,
  AwardXPResponse,
  LeaderboardEntry,
  BadgeShowcase,
} from '../../types/apiTypes'

/**
 * Hook to get complete gamification profile for a user
 */
export function useGamificationProfile(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.gamification.profile(userId || ''),
    queryFn: () => GamificationService.getGamificationProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

/**
 * Hook to get all achievements for a user
 */
export function useAchievements(
  userId: string | null,
  options: {
    category?: 'streak' | 'skill' | 'social' | 'milestone' | 'special'
    unlockedOnly?: boolean
  } = {}
) {
  return useQuery({
    queryKey: queryKeys.gamification.achievements(userId || '', options),
    queryFn: () => GamificationService.getAchievements(userId!, options),
    enabled: Boolean(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get the XP leaderboard
 */
export function useLeaderboard(options: {
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time'
  limit?: number
} = {}) {
  return useQuery({
    queryKey: queryKeys.gamification.leaderboard(options),
    queryFn: () => GamificationService.getLeaderboard(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })
}

/**
 * Hook to get a user's badge showcase
 */
export function useBadgeShowcase(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.gamification.badges(userId || ''),
    queryFn: () => GamificationService.getBadgeShowcase(userId!),
    enabled: Boolean(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to award XP to a user
 */
export function useAwardXP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: AwardXPRequest) => GamificationService.awardXP(request),
    onMutate: async (variables) => {
      // Optimistically update XP
      optimisticUpdates.awardXP(variables.user_id, variables.xp_amount)
    },
    onSuccess: (data: AwardXPResponse, variables) => {
      // Update the gamification profile with actual data
      queryClient.setQueryData(
        queryKeys.gamification.profile(variables.user_id),
        (old: UserGamificationProfile | undefined) => {
          if (!old) return old
          return {
            ...old,
            total_xp: data.total_xp,
            level: data.level,
            recent_xp_events: [
              {
                event_type: variables.event_type,
                xp_earned: data.xp_awarded,
                multiplier: data.xp_awarded / variables.xp_amount,
                source: variables.source,
                timestamp: new Date().toISOString(),
              },
              ...old.recent_xp_events.slice(0, 9),
            ],
          }
        }
      )

      // If new achievements were unlocked, invalidate achievements query
      if (data.new_achievements.length > 0) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.gamification.achievements(variables.user_id, {}) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.gamification.badges(variables.user_id) 
        })
      }

      // If level up occurred, invalidate leaderboard
      if (data.level_up) {
        queryClient.invalidateQueries({ queryKey: queryKeys.gamification.leaderboard({}) })
      }
    },
    onError: (error, variables) => {
      console.error('Failed to award XP:', handleQueryError(error))
      
      // Revert optimistic update on error
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.gamification.profile(variables.user_id) 
      })
    },
  })
}

/**
 * Hook to update user's learning streak
 */
export function useUpdateStreak() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => GamificationService.updateStreak(userId),
    onSuccess: (data, userId) => {
      // Update the gamification profile with new streak data
      queryClient.setQueryData(
        queryKeys.gamification.profile(userId),
        (old: UserGamificationProfile | undefined) => {
          if (!old) return old
          return {
            ...old,
            streak: {
              ...old.streak,
              current_streak: data.streak,
              longest_streak: data.longest_streak,
              last_activity: new Date().toISOString(),
              streak_status: 'active',
            },
          }
        }
      )

      // If new achievements were unlocked, invalidate related queries
      if (data.new_achievements.length > 0) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.gamification.achievements(userId, {}) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.gamification.badges(userId) 
        })
      }
    },
    onError: (error) => {
      console.error('Failed to update streak:', handleQueryError(error))
    },
  })
}

/**
 * Hook with gamification utilities and computed values
 */
export function useGamificationWithUtils(userId: string | null) {
  const profileQuery = useGamificationProfile(userId)
  const achievementsQuery = useAchievements(userId)
  const leaderboardQuery = useLeaderboard()
  const badgeShowcaseQuery = useBadgeShowcase(userId)
  const awardXPMutation = useAwardXP()
  const updateStreakMutation = useUpdateStreak()

  const profile = profileQuery.data
  const achievements = Array.isArray(achievementsQuery.data) ? achievementsQuery.data : []
  const leaderboard = Array.isArray(leaderboardQuery.data) ? leaderboardQuery.data : []
  const badgeShowcase = badgeShowcaseQuery.data

  return {
    // Query data and state
    profile,
    achievements,
    leaderboard,
    badgeShowcase,
    isLoading: profileQuery.isLoading || achievementsQuery.isLoading,
    isError: profileQuery.isError || achievementsQuery.isError,
    error: profileQuery.error ? handleQueryError(profileQuery.error) :
           achievementsQuery.error ? handleQueryError(achievementsQuery.error) : null,
    
    // Mutations
    awardXP: awardXPMutation.mutate,
    updateStreak: updateStreakMutation.mutate,
    
    // Mutation states
    isAwardingXP: awardXPMutation.isPending,
    isUpdatingStreak: updateStreakMutation.isPending,
    
    // Computed properties
    currentLevel: profile?.level || 1,
    totalXP: profile?.total_xp || 0,
    xpToNextLevel: profile?.xp_to_next_level || 100,
    levelProgress: profile?.level_progress || 0,
    currentStreak: profile?.streak?.current_streak || 0,
    longestStreak: profile?.streak?.longest_streak || 0,
    achievementsUnlocked: profile?.achievements_unlocked || 0,
    totalAchievements: profile?.total_achievements || 0,
    
    // Utilities
    calculateLevel: GamificationService.calculateLevel,
    getXPValues: GamificationService.getXPValues,
    getStreakMilestones: GamificationService.getStreakMilestones,
    getRarityColor: GamificationService.getRarityColor,
    getLevelInfo: GamificationService.getLevelInfo,
    calculateStreakMultiplier: GamificationService.calculateStreakMultiplier,
    getWeekendMultiplier: GamificationService.getWeekendMultiplier,
    formatXP: GamificationService.formatXP,
    getMotivationalMessage: (profile: UserGamificationProfile) => 
      GamificationService.getMotivationalMessage(profile),
    getNextAchievementSuggestions: (achievements: Achievement[], profile: UserGamificationProfile) =>
      GamificationService.getNextAchievementSuggestions(achievements, profile),
    calculateDailyXPGoal: (profile: UserGamificationProfile) =>
      GamificationService.calculateDailyXPGoal(profile),
    getCategoryInfo: GamificationService.getCategoryInfo,
    validateXPAward: GamificationService.validateXPAward,
    
    // Refetch functions
    refetch: () => {
      profileQuery.refetch()
      achievementsQuery.refetch()
      leaderboardQuery.refetch()
      badgeShowcaseQuery.refetch()
    },
  }
}

/**
 * Hook for gamification analytics and insights
 */
export function useGamificationAnalytics(userId: string | null) {
  const profileQuery = useGamificationProfile(userId)
  const achievementsQuery = useAchievements(userId)
  
  const profile = profileQuery.data
  const achievements = Array.isArray(achievementsQuery.data) ? achievementsQuery.data : []

  const analytics = profile ? {
    // Level progression
    levelProgression: {
      currentLevel: profile.level,
      levelInfo: GamificationService.getLevelInfo(profile.level),
      progressToNext: profile.level_progress,
      xpNeeded: profile.xp_to_next_level,
      estimatedTimeToNextLevel: profile.xp_to_next_level / 100, // Assuming 100 XP per day average
    },
    
    // Achievement analysis
    achievementAnalysis: {
      unlockedCount: profile.achievements_unlocked,
      totalCount: profile.total_achievements,
      completionRate: (profile.achievements_unlocked / profile.total_achievements) * 100,
      
      // By category
      byCategory: achievements.reduce((acc, achievement) => {
        const category = achievement.category
        if (!acc[category]) {
          acc[category] = { total: 0, unlocked: 0 }
        }
        acc[category].total++
        if (achievement.unlocked) {
          acc[category].unlocked++
        }
        return acc
      }, {} as Record<string, { total: number; unlocked: number }>),
      
      // By rarity
      byRarity: achievements.reduce((acc, achievement) => {
        const rarity = achievement.rarity
        if (!acc[rarity]) {
          acc[rarity] = { total: 0, unlocked: 0 }
        }
        acc[rarity].total++
        if (achievement.unlocked) {
          acc[rarity].unlocked++
        }
        return acc
      }, {} as Record<string, { total: number; unlocked: number }>),
      
      // Next achievements to unlock
      nextToUnlock: GamificationService.getNextAchievementSuggestions(achievements, profile),
    },
    
    // Streak analysis
    streakAnalysis: {
      current: profile.streak?.current_streak || 0,
      longest: profile.streak?.longest_streak || 0,
      status: profile.streak?.streak_status || 'inactive',
      multiplier: GamificationService.calculateStreakMultiplier(profile.streak?.current_streak || 0),
      nextMilestone: profile.streak?.next_milestone || 7,
      
      // Streak health
      health: (profile.streak?.current_streak || 0) >= 7 ? 'excellent' :
              (profile.streak?.current_streak || 0) >= 3 ? 'good' :
              (profile.streak?.current_streak || 0) >= 1 ? 'fair' : 'poor',
    },
    
    // XP analysis
    xpAnalysis: {
      total: profile.total_xp,
      dailyGoal: GamificationService.calculateDailyXPGoal(profile),
      recentEvents: profile.recent_xp_events,
      
      // XP sources breakdown
      sourceBreakdown: profile.recent_xp_events.reduce((acc, event) => {
        const source = event.source
        if (!acc[source]) {
          acc[source] = { count: 0, totalXP: 0 }
        }
        acc[source].count++
        acc[source].totalXP += event.xp_earned
        return acc
      }, {} as Record<string, { count: number; totalXP: number }>),
      
      // Average XP per day (last 7 days)
      averageDaily: profile.recent_xp_events
        .filter(event => {
          const eventDate = new Date(event.timestamp)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return eventDate >= weekAgo
        })
        .reduce((sum, event) => sum + event.xp_earned, 0) / 7,
    },
    
    // Motivation metrics
    motivation: {
      message: GamificationService.getMotivationalMessage(profile),
      score: Math.min(100, 
        ((profile.streak?.current_streak || 0) * 5) + 
        (profile.level * 3) + 
        (profile.achievements_unlocked * 2)
      ),
      
      // Engagement level
      engagement: profile.recent_xp_events.length >= 5 ? 'high' :
                  profile.recent_xp_events.length >= 2 ? 'medium' : 'low',
    },
  } : null

  return {
    analytics,
    isLoading: profileQuery.isLoading || achievementsQuery.isLoading,
    error: profileQuery.error ? handleQueryError(profileQuery.error) :
           achievementsQuery.error ? handleQueryError(achievementsQuery.error) : null,
    refetch: () => {
      profileQuery.refetch()
      achievementsQuery.refetch()
    },
  }
}

/**
 * Hook for automatic XP awarding based on actions
 */
export function useAutoXPAward(userId: string | null) {
  const awardXPMutation = useAwardXP()
  const updateStreakMutation = useUpdateStreak()

  const awardForAction = (
    action: 'task_completed' | 'exercise_passed' | 'perfect_score' | 'first_attempt_pass' | 
           'challenge_won' | 'solution_shared' | 'module_completed' | 'curriculum_completed',
    customAmount?: number
  ) => {
    if (!userId) return

    const xpValues = GamificationService.getXPValues()
    const xpAmount = customAmount || xpValues[action] || 50

    awardXPMutation.mutate({
      user_id: userId,
      xp_amount: xpAmount,
      event_type: action,
      source: 'auto_award',
    })

    // Update streak for learning actions
    if (['task_completed', 'exercise_passed', 'module_completed'].includes(action)) {
      updateStreakMutation.mutate(userId)
    }
  }

  const awardForTaskCompletion = (score?: number) => {
    if (!userId) return

    let action: 'task_completed' | 'exercise_passed' | 'perfect_score' | 'first_attempt_pass' = 'task_completed'
    
    if (score !== undefined) {
      if (score >= 100) {
        action = 'perfect_score'
      } else if (score >= 70) {
        action = 'exercise_passed'
      }
    }

    awardForAction(action)
  }

  return {
    awardForAction,
    awardForTaskCompletion,
    isAwarding: awardXPMutation.isPending || updateStreakMutation.isPending,
  }
}
