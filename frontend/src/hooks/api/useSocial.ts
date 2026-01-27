/**
 * Social API Hooks - React Query hooks for social learning and peer interactions
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SocialService } from '../../services/socialService'
import { queryKeys, handleQueryError } from '../../lib/queryClient'
import type {
  CreateChallengeRequest,
  PeerChallenge,
  ShareSolutionRequest,
  SharedSolution,
  Comment,
  CreateStudyGroupRequest,
  StudyGroup,
  StudyGroupProgress,
  ActivityFeedItem,
} from '../../types/api'

// =============================================================================
// Peer Challenges Hooks
// =============================================================================

/**
 * Hook to get challenges for a user
 */
export function useUserChallenges(
  userId: string | null,
  options: {
    status?: 'pending' | 'active' | 'completed' | 'expired' | 'declined'
    asChallenger?: boolean
    asChallenged?: boolean
  } = {}
) {
  return useQuery({
    queryKey: queryKeys.social.challenges(userId || '', options),
    queryFn: () => SocialService.getUserChallenges(userId!, options),
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

/**
 * Hook to get challenge wins leaderboard
 */
export function useChallengeLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.social.leaderboard(limit),
    queryFn: () => SocialService.getChallengeLeaderboard(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to create a peer challenge
 */
export function useCreateChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateChallengeRequest) => SocialService.createChallenge(request),
    onSuccess: (data: PeerChallenge, variables) => {
      // Invalidate challenges for both users
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.social.challenges(variables.challenger_id, {}) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.social.challenges(variables.challenged_id, {}) 
      })
    },
    onError: (error) => {
      console.error('Failed to create challenge:', handleQueryError(error))
    },
  })
}

/**
 * Hook to accept a peer challenge
 */
export function useAcceptChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ challengeId, userId }: { challengeId: string; userId: string }) =>
      SocialService.acceptChallenge(challengeId, userId),
    onSuccess: (_, variables) => {
      // Invalidate challenges for the user
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.social.challenges(variables.userId, {}) 
      })
    },
    onError: (error) => {
      console.error('Failed to accept challenge:', handleQueryError(error))
    },
  })
}

/**
 * Hook to submit a challenge result
 */
export function useSubmitChallengeResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ challengeId, userId, score }: { 
      challengeId: string; 
      userId: string; 
      score: number 
    }) => SocialService.submitChallengeResult(challengeId, userId, score),
    onSuccess: (_, variables) => {
      // Invalidate challenges and leaderboard
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.social.challenges(variables.userId, {}) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.social.leaderboard() 
      })
      
      // If challenge completed, award XP
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.gamification.profile(variables.userId) 
      })
    },
    onError: (error) => {
      console.error('Failed to submit challenge result:', handleQueryError(error))
    },
  })
}

// =============================================================================
// Solution Sharing Hooks
// =============================================================================

/**
 * Hook to get shared solutions
 */
export function useSharedSolutions(options: {
  exerciseId?: string
  userId?: string
  featuredOnly?: boolean
  sortBy?: 'recent' | 'popular' | 'helpful'
  limit?: number
} = {}) {
  return useQuery({
    queryKey: queryKeys.social.solutions(options),
    queryFn: () => SocialService.getSharedSolutions(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get comments for a solution
 */
export function useSolutionComments(solutionId: string | null) {
  return useQuery({
    queryKey: queryKeys.social.comments(solutionId || ''),
    queryFn: () => SocialService.getComments(solutionId!),
    enabled: Boolean(solutionId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to share a solution
 */
export function useShareSolution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ShareSolutionRequest) => SocialService.shareSolution(request),
    onSuccess: (data: SharedSolution) => {
      // Invalidate solutions list
      queryClient.invalidateQueries({ queryKey: queryKeys.social.solutions({}) })
      
      // Add to cache
      queryClient.setQueryData(
        queryKeys.social.solutions({ exerciseId: data.exercise_id }),
        (old: SharedSolution[] | undefined) => {
          if (!old) return [data]
          return [data, ...old]
        }
      )
    },
    onError: (error) => {
      console.error('Failed to share solution:', handleQueryError(error))
    },
  })
}

/**
 * Hook to like a solution
 */
export function useLikeSolution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ solutionId, userId }: { solutionId: string; userId: string }) =>
      SocialService.likeSolution(solutionId, userId),
    onMutate: async ({ solutionId }) => {
      // Optimistically update likes count
      queryClient.setQueriesData(
        { queryKey: queryKeys.social.solutions({}) },
        (old: SharedSolution[] | undefined) => {
          if (!old) return old
          return old.map(solution =>
            solution.id === solutionId
              ? { ...solution, likes: solution.likes + 1 }
              : solution
          )
        }
      )
    },
    onError: (error, { solutionId }) => {
      console.error('Failed to like solution:', handleQueryError(error))
      
      // Revert optimistic update
      queryClient.setQueriesData(
        { queryKey: queryKeys.social.solutions({}) },
        (old: SharedSolution[] | undefined) => {
          if (!old) return old
          return old.map(solution =>
            solution.id === solutionId
              ? { ...solution, likes: Math.max(0, solution.likes - 1) }
              : solution
          )
        }
      )
    },
  })
}

/**
 * Hook to add a comment
 */
export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ solutionId, userId, content }: { 
      solutionId: string; 
      userId: string; 
      content: string 
    }) => SocialService.addComment(solutionId, userId, content),
    onSuccess: (data: Comment, variables) => {
      // Add comment to cache
      queryClient.setQueryData(
        queryKeys.social.comments(variables.solutionId),
        (old: Comment[] | undefined) => {
          if (!old) return [data]
          return [...old, data]
        }
      )
      
      // Update solution comments count
      queryClient.setQueriesData(
        { queryKey: queryKeys.social.solutions({}) },
        (old: SharedSolution[] | undefined) => {
          if (!old) return old
          return old.map(solution =>
            solution.id === variables.solutionId
              ? { ...solution, comments_count: solution.comments_count + 1 }
              : solution
          )
        }
      )
    },
    onError: (error) => {
      console.error('Failed to add comment:', handleQueryError(error))
    },
  })
}

// =============================================================================
// Study Groups Hooks
// =============================================================================

/**
 * Hook to get available study groups
 */
export function useStudyGroups(options: {
  topic?: string
  publicOnly?: boolean
} = {}) {
  return useQuery({
    queryKey: queryKeys.social.groups(options),
    queryFn: () => SocialService.getStudyGroups(options),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get progress for a study group
 */
export function useStudyGroupProgress(groupId: string | null) {
  return useQuery({
    queryKey: queryKeys.social.groupProgress(groupId || ''),
    queryFn: () => SocialService.getGroupProgress(groupId!),
    enabled: Boolean(groupId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })
}

/**
 * Hook to create a study group
 */
export function useCreateStudyGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateStudyGroupRequest) => SocialService.createStudyGroup(request),
    onSuccess: (data: StudyGroup) => {
      // Invalidate study groups list
      queryClient.invalidateQueries({ queryKey: queryKeys.social.groups({}) })
      
      // Add to cache
      queryClient.setQueryData(
        queryKeys.social.groups({}),
        (old: StudyGroup[] | undefined) => {
          if (!old) return [data]
          return [data, ...old]
        }
      )
    },
    onError: (error) => {
      console.error('Failed to create study group:', handleQueryError(error))
    },
  })
}

/**
 * Hook to join a study group
 */
export function useJoinStudyGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      SocialService.joinStudyGroup(groupId, userId),
    onSuccess: (_, variables) => {
      // Invalidate study groups and group progress
      queryClient.invalidateQueries({ queryKey: queryKeys.social.groups({}) })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.social.groupProgress(variables.groupId) 
      })
    },
    onError: (error) => {
      console.error('Failed to join study group:', handleQueryError(error))
    },
  })
}

// =============================================================================
// Follow System Hooks
// =============================================================================

/**
 * Hook to get list of users being followed
 */
export function useFollowing(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.social.following(userId || ''),
    queryFn: () => SocialService.getFollowing(userId!),
    enabled: Boolean(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get activity feed
 */
export function useActivityFeed(userId: string | null, limit: number = 20) {
  return useQuery({
    queryKey: queryKeys.social.feed(userId || '', limit),
    queryFn: () => SocialService.getActivityFeed(userId!, limit),
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

/**
 * Hook to follow a user
 */
export function useFollowUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, targetUserId }: { userId: string; targetUserId: string }) =>
      SocialService.followUser(userId, targetUserId),
    onSuccess: (_, variables) => {
      // Update following list
      queryClient.setQueryData(
        queryKeys.social.following(variables.userId),
        (old: string[] | undefined) => {
          if (!old) return [variables.targetUserId]
          return [...old, variables.targetUserId]
        }
      )
      
      // Invalidate activity feed to include new user's activities
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.social.feed(variables.userId, undefined) 
      })
    },
    onError: (error) => {
      console.error('Failed to follow user:', handleQueryError(error))
    },
  })
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook with social utilities and computed values
 */
export function useSocialWithUtils(userId: string | null) {
  const challengesQuery = useUserChallenges(userId)
  const solutionsQuery = useSharedSolutions({ userId: userId ?? undefined })
  const studyGroupsQuery = useStudyGroups()
  const activityFeedQuery = useActivityFeed(userId)

  const challenges = Array.isArray(challengesQuery.data) ? challengesQuery.data : []
  const solutions = Array.isArray(solutionsQuery.data) ? solutionsQuery.data : []
  const studyGroups = Array.isArray(studyGroupsQuery.data) ? studyGroupsQuery.data : []
  const activityFeed = Array.isArray(activityFeedQuery.data) ? activityFeedQuery.data : []

  return {
    // Query data and state
    challenges,
    solutions,
    studyGroups,
    activityFeed,
    isLoading: challengesQuery.isLoading || solutionsQuery.isLoading || 
               studyGroupsQuery.isLoading || activityFeedQuery.isLoading,
    isError: challengesQuery.isError || solutionsQuery.isError || 
             studyGroupsQuery.isError || activityFeedQuery.isError,
    error: challengesQuery.error ? handleQueryError(challengesQuery.error) :
           solutionsQuery.error ? handleQueryError(solutionsQuery.error) :
           studyGroupsQuery.error ? handleQueryError(studyGroupsQuery.error) :
           activityFeedQuery.error ? handleQueryError(activityFeedQuery.error) : null,
    
    // Computed properties
    activeChallenges: challenges.filter(c => c.status === 'active').length,
    pendingChallenges: challenges.filter(c => c.status === 'pending').length,
    wonChallenges: challenges.filter(c => c.status === 'completed' && c.winner_id === userId).length,
    sharedSolutions: solutions.length,
    totalLikes: solutions.reduce((sum, s) => sum + s.likes, 0),
    joinedGroups: studyGroups.filter(g => g.members.includes(userId || '')).length,
    
    // Utilities
    getChallengeTypeInfo: SocialService.getChallengeTypeInfo,
    getChallengeStatusColor: SocialService.getChallengeStatusColor,
    formatChallengeDuration: SocialService.formatChallengeDuration,
    validateSolutionShare: SocialService.validateSolutionShare,
    getMemberRole: (group: StudyGroup) => SocialService.getMemberRole(group, userId || ''),
    calculateGroupActivityScore: SocialService.calculateGroupActivityScore,
    
    // Refetch functions
    refetch: () => {
      challengesQuery.refetch()
      solutionsQuery.refetch()
      studyGroupsQuery.refetch()
      activityFeedQuery.refetch()
    },
  }
}

/**
 * Hook for social engagement analytics
 */
export function useSocialEngagement(userId: string | null) {
  const socialQuery = useSocialWithUtils(userId)
  const leaderboardQuery = useChallengeLeaderboard()

  const {
    challenges,
    solutions,
    studyGroups,
    activeChallenges,
    wonChallenges,
    sharedSolutions,
    totalLikes,
    joinedGroups,
  } = socialQuery

  const leaderboard = Array.isArray(leaderboardQuery.data) ? leaderboardQuery.data : []
  const userRank = leaderboard.findIndex(entry => entry.user_id === userId) + 1

  // Calculate engagement score first
  const engagementScore = Math.min(100, 
    (activeChallenges * 10) + 
    (wonChallenges * 15) + 
    (sharedSolutions * 5) + 
    (totalLikes * 2) + 
    (joinedGroups * 8)
  )

  // Determine engagement level based on score
  const getEngagementLevel = (score: number) => {
    if (score >= 80) return 'very_high'
    if (score >= 60) return 'high'
    if (score >= 40) return 'medium'
    if (score >= 20) return 'low'
    return 'very_low'
  }

  const engagement = {
    // Overall engagement score
    engagementScore,
    
    // Social metrics
    socialMetrics: {
      challengesParticipated: challenges.length,
      challengesWon: wonChallenges,
      winRate: challenges.length > 0 ? (wonChallenges / challenges.length) * 100 : 0,
      solutionsShared: sharedSolutions,
      likesReceived: totalLikes,
      studyGroupsJoined: joinedGroups,
      leaderboardRank: userRank || null,
    },
    
    // Engagement level
    engagementLevel: getEngagementLevel(engagementScore),
    
    // Recommendations
    recommendations: (() => {
      const recommendations: string[] = []
      
      if (activeChallenges === 0) {
        recommendations.push('Try participating in peer challenges to boost engagement')
      }
      
      if (sharedSolutions === 0) {
        recommendations.push('Share your solutions to help others and gain recognition')
      }
      
      if (joinedGroups === 0) {
        recommendations.push('Join a study group to learn collaboratively')
      }
      
      if (wonChallenges > 0 && wonChallenges / challenges.length > 0.7) {
        recommendations.push('Great challenge performance! Consider mentoring others')
      }
      
      return recommendations
    })(),
  }

  return {
    engagement,
    isLoading: socialQuery.isLoading || leaderboardQuery.isLoading,
    error: socialQuery.error || 
           (leaderboardQuery.error ? handleQueryError(leaderboardQuery.error) : null),
    refetch: () => {
      socialQuery.refetch()
      leaderboardQuery.refetch()
    },
  }
}