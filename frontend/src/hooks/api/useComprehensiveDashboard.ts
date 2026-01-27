/**
 * Comprehensive Dashboard Hook - Combines multiple domains for dashboard view
 */

import { useMemo } from 'react'
import { useGoalsWithUtils } from './useGoals'
import { useCurriculumWithUtils } from './useCurriculum'
import { useTasksWithUtils } from './useTasks'
import { useProgressWithUtils } from './useProgress'
import { useGamificationWithUtils } from './useGamification'
import { useAnalyticsWithUtils } from './useAnalytics'
import { useSocialWithUtils } from './useSocial'

/**
 * Hook that provides comprehensive dashboard data by combining multiple domains
 */
export function useComprehensiveDashboard(userId: string | null) {
  // Get data from all domains
  const goals = useGoalsWithUtils()
  const curriculum = useCurriculumWithUtils()
  const tasks = useTasksWithUtils()
  const progress = useProgressWithUtils()
  const gamification = useGamificationWithUtils(userId)
  const analytics = useAnalyticsWithUtils(userId)
  const social = useSocialWithUtils(userId)

  // Combine loading states
  const isLoading = useMemo(() => {
    return goals.isLoading || 
           curriculum.isLoading || 
           tasks.isLoading || 
           progress.isLoading || 
           gamification.isLoading || 
           analytics.isLoading || 
           social.isLoading
  }, [
    goals.isLoading,
    curriculum.isLoading,
    tasks.isLoading,
    progress.isLoading,
    gamification.isLoading,
    analytics.isLoading,
    social.isLoading,
  ])

  // Combine error states
  const error = useMemo(() => {
    return goals.error || 
           curriculum.error || 
           tasks.error || 
           progress.error || 
           gamification.error || 
           analytics.error || 
           social.error
  }, [
    goals.error,
    curriculum.error,
    tasks.error,
    progress.error,
    gamification.error,
    analytics.error,
    social.error,
  ])

  // Create comprehensive dashboard data
  const dashboard = useMemo(() => {
    if (isLoading) return null

    return {
      // User status and onboarding
      userStatus: {
        hasGoals: goals.hasGoals,
        hasActiveCurriculum: curriculum.hasActiveCurriculum,
        isOnboarded: goals.hasGoals && curriculum.hasActiveCurriculum,
        needsSetup: !goals.hasGoals || !curriculum.hasActiveCurriculum,
      },

      // Learning overview
      learningOverview: {
        currentGoals: goals.goals?.goals || [],
        goalCount: goals.goalCount,
        overallProgress: progress.overallProgress,
        currentModule: curriculum.currentModule,
        nextTask: curriculum.nextTask,
        timeEstimate: curriculum.timeEstimate,
      },

      // Today's focus
      todaysFocus: {
        tasks: tasks.todayTasks?.tasks || [],
        totalTasks: tasks.totalTodayTasks,
        completedTasks: tasks.completedTodayTasks,
        remainingTasks: tasks.remainingTodayTasks,
        progressPercentage: tasks.todayProgress,
        estimatedTime: tasks.estimatedTimeToday,
        progressMessage: tasks.todayTasks ? tasks.getProgressMessage(tasks.todayTasks) : '',
      },

      // Progress metrics
      progressMetrics: {
        summary: progress.summary,
        learningVelocity: progress.learningVelocity,
        progressLevel: progress.progressLevel,
        streakStatus: progress.streakStatus,
        estimatedCompletion: progress.estimatedCompletion,
        recommendations: progress.recommendations,
      },

      // Gamification elements
      gamification: {
        profile: gamification.profile,
        currentLevel: gamification.currentLevel,
        totalXP: gamification.totalXP,
        xpToNextLevel: gamification.xpToNextLevel,
        levelProgress: gamification.levelProgress,
        currentStreak: gamification.currentStreak,
        longestStreak: gamification.longestStreak,
        achievementsUnlocked: gamification.achievementsUnlocked,
        motivationalMessage: gamification.profile 
          ? gamification.getMotivationalMessage(gamification.profile)
          : '',
      },

      // Analytics insights
      analytics: {
        insights: analytics.insights,
        efficiencyScore: analytics.efficiencyScore,
        learningPatterns: analytics.learningPatterns,
        retentionAnalysis: analytics.retentionAnalysis,
        studySchedule: analytics.studySchedule,
        learningROI: analytics.learningROI,
      },

      // Social engagement
      social: {
        activeChallenges: social.activeChallenges,
        pendingChallenges: social.pendingChallenges,
        wonChallenges: social.wonChallenges,
        sharedSolutions: social.sharedSolutions,
        totalLikes: social.totalLikes,
        joinedGroups: social.joinedGroups,
        activityFeed: social.activityFeed.slice(0, 5), // Latest 5 activities
      },

      // Quick actions
      quickActions: {
        canStartLearning: curriculum.hasActiveCurriculum && tasks.hasTodayTasks,
        canCreateCurriculum: goals.hasGoals && !curriculum.hasActiveCurriculum,
        canSetGoals: !goals.hasGoals,
        canViewProgress: progress.hasActivePlan,
        canShareSolution: tasks.completedTodayTasks > 0,
        canJoinChallenge: social.pendingChallenges > 0,
      },

      // Notifications and alerts
      notifications: {
        streakAtRisk: progress.streakStatus?.status === 'at_risk',
        hasNewAchievements: (gamification.profile?.recent_xp_events?.length ?? 0) > 0,
        hasPendingChallenges: social.pendingChallenges > 0,
        needsReview: (analytics.retentionAnalysis?.criticalCount ?? 0) > 0,
        upcomingDeadlines: [], // Would be calculated from curriculum deadlines
      },

      // Performance indicators
      performance: {
        weeklyGoalProgress: progress.summary ? {
          target: 7, // 7 tasks per week target
          current: progress.summary.completed_tasks, // This week's tasks
          percentage: Math.min(100, (progress.summary.completed_tasks / 7) * 100),
        } : null,
        
        learningEfficiency: analytics.efficiencyScore?.score || 0,
        socialEngagement: social.activeChallenges + social.sharedSolutions + social.joinedGroups,
        consistencyScore: analytics.learningPatterns?.consistencyScore || 0,
      },
    }
  }, [
    isLoading,
    goals,
    curriculum,
    tasks,
    progress,
    gamification,
    analytics,
    social,
  ])

  // Refetch all data
  const refetchAll = () => {
    goals.refetch()
    curriculum.refetch()
    tasks.refetch()
    progress.refetch()
    gamification.refetch()
    analytics.refetch()
    social.refetch()
  }

  return {
    dashboard,
    isLoading,
    error,
    refetchAll,
    
    // Individual domain data for specific components
    domains: {
      goals,
      curriculum,
      tasks,
      progress,
      gamification,
      analytics,
      social,
    },
  }
}