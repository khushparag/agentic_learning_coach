/**
 * User Profile Hook - Comprehensive user profile management combining multiple domains
 */

import { useMemo } from 'react'
import { useGoalsWithUtils } from './useGoals'
import { useProgressWithUtils } from './useProgress'
import { useGamificationWithUtils } from './useGamification'
import { useAnalyticsWithUtils } from './useAnalytics'
import { useSocialWithUtils } from './useSocial'

interface UserProfileData {
  // Basic profile information
  userId: string
  isOnboarded: boolean
  profileCompleteness: number
  
  // Learning profile
  learningProfile: {
    goals: string[]
    skillLevel: string
    timeConstraints: any
    preferences: any
    currentStreak: number
    longestStreak: number
    totalTimeSpent: number
    averageScore: number | null
  }
  
  // Achievement profile
  achievementProfile: {
    level: number
    totalXP: number
    xpToNextLevel: number
    achievementsUnlocked: number
    totalAchievements: number
    badges: string[]
    recentAchievements: any[]
  }
  
  // Learning analytics
  learningAnalytics: {
    efficiencyScore: any
    learningVelocity: any
    progressLevel: any
    streakStatus: any
    recommendations: string[]
    strugglingAreas: string[]
    strongAreas: string[]
  }
  
  // Social profile
  socialProfile: {
    challengesWon: number
    solutionsShared: number
    likesReceived: number
    studyGroupsJoined: number
    followingCount: number
    engagementLevel: string
  }
  
  // Progress summary
  progressSummary: {
    overallProgress: number
    completedTasks: number
    totalTasks: number
    completedModules: number
    totalModules: number
    hasActivePlan: boolean
  }
}

/**
 * Hook that provides comprehensive user profile data
 */
export function useUserProfile(userId: string | null) {
  // Get data from all relevant domains
  const goals = useGoalsWithUtils()
  const progress = useProgressWithUtils()
  const gamification = useGamificationWithUtils(userId)
  const analytics = useAnalyticsWithUtils(userId)
  const social = useSocialWithUtils(userId)

  // Combine loading states
  const isLoading = useMemo(() => {
    return goals.isLoading || 
           progress.isLoading || 
           gamification.isLoading || 
           analytics.isLoading || 
           social.isLoading
  }, [
    goals.isLoading,
    progress.isLoading,
    gamification.isLoading,
    analytics.isLoading,
    social.isLoading,
  ])

  // Combine error states
  const error = useMemo(() => {
    return goals.error || 
           progress.error || 
           gamification.error || 
           analytics.error || 
           social.error
  }, [
    goals.error,
    progress.error,
    gamification.error,
    analytics.error,
    social.error,
  ])

  // Create comprehensive user profile
  const userProfile = useMemo((): UserProfileData | null => {
    if (!userId || isLoading) return null

    // Calculate profile completeness
    const completenessFactors = [
      goals.hasGoals ? 25 : 0,
      progress.hasActivePlan ? 25 : 0,
      (progress.summary?.completed_tasks || 0) > 0 ? 25 : 0,
      gamification.achievementsUnlocked > 0 ? 25 : 0,
    ]
    const profileCompleteness = completenessFactors.reduce((sum, factor) => sum + factor, 0)

    // Determine skill level from progress and gamification
    const skillLevel = (() => {
      if (gamification.currentLevel >= 10) return 'advanced'
      if (gamification.currentLevel >= 5) return 'intermediate'
      return 'beginner'
    })()

    // Extract struggling and strong areas from analytics
    const strugglingAreas = analytics.insights?.struggle_patterns.map(p => p.topic) || []
    const strongAreas = analytics.insights?.skill_progressions
      .filter(s => s.progression_rate > 0.5)
      .map(s => s.skill) || []

    return {
      userId,
      isOnboarded: goals.hasGoals && progress.hasActivePlan,
      profileCompleteness,
      
      learningProfile: {
        goals: goals.goals?.goals || [],
        skillLevel,
        timeConstraints: goals.goals?.time_constraints,
        preferences: {}, // Would come from user preferences API
        currentStreak: gamification.currentStreak,
        longestStreak: gamification.longestStreak,
        totalTimeSpent: progress.summary?.total_time_spent_minutes || 0,
        averageScore: progress.summary?.average_score || null,
      },
      
      achievementProfile: {
        level: gamification.currentLevel,
        totalXP: gamification.totalXP,
        xpToNextLevel: gamification.xpToNextLevel,
        achievementsUnlocked: gamification.achievementsUnlocked,
        totalAchievements: gamification.totalAchievements,
        badges: gamification.profile?.badges || [],
        recentAchievements: gamification.profile?.recent_xp_events.slice(0, 5) || [],
      },
      
      learningAnalytics: {
        efficiencyScore: analytics.efficiencyScore,
        learningVelocity: progress.learningVelocity,
        progressLevel: progress.progressLevel,
        streakStatus: progress.streakStatus,
        recommendations: progress.recommendations,
        strugglingAreas,
        strongAreas,
      },
      
      socialProfile: {
        challengesWon: social.wonChallenges,
        solutionsShared: social.sharedSolutions,
        likesReceived: social.totalLikes,
        studyGroupsJoined: social.joinedGroups,
        followingCount: 0, // Would come from following data
        engagementLevel: (() => {
          const engagementScore = social.activeChallenges + social.sharedSolutions + social.joinedGroups
          if (engagementScore >= 10) return 'high'
          if (engagementScore >= 5) return 'medium'
          return 'low'
        })(),
      },
      
      progressSummary: {
        overallProgress: progress.overallProgress,
        completedTasks: progress.summary?.completed_tasks || 0,
        totalTasks: progress.summary?.total_tasks || 0,
        completedModules: progress.summary?.completed_modules || 0,
        totalModules: progress.summary?.total_modules || 0,
        hasActivePlan: progress.hasActivePlan,
      },
    }
  }, [
    userId,
    isLoading,
    goals,
    progress,
    gamification,
    analytics,
    social,
  ])

  // Profile insights and recommendations
  const profileInsights = useMemo(() => {
    if (!userProfile) return null

    const insights = {
      // Strengths
      strengths: [] as string[],
      
      // Areas for improvement
      improvements: [] as string[],
      
      // Next steps
      nextSteps: [] as string[],
      
      // Profile health score
      healthScore: 0,
    }

    // Analyze strengths
    if (userProfile.learningProfile.currentStreak >= 7) {
      insights.strengths.push('Excellent learning consistency')
    }
    
    if (userProfile.achievementProfile.level >= 5) {
      insights.strengths.push('Strong learning progress')
    }
    
    if (userProfile.socialProfile.engagementLevel === 'high') {
      insights.strengths.push('Active community participation')
    }
    
    if ((userProfile.learningProfile.averageScore || 0) >= 80) {
      insights.strengths.push('High performance on exercises')
    }

    // Analyze improvements
    if (userProfile.learningProfile.currentStreak < 3) {
      insights.improvements.push('Build a more consistent learning habit')
    }
    
    if (userProfile.socialProfile.engagementLevel === 'low') {
      insights.improvements.push('Engage more with the learning community')
    }
    
    if (userProfile.progressSummary.overallProgress < 25) {
      insights.improvements.push('Focus on completing more learning modules')
    }
    
    if (userProfile.learningAnalytics.strugglingAreas.length > 2) {
      insights.improvements.push('Review struggling topics more frequently')
    }

    // Generate next steps
    if (!userProfile.isOnboarded) {
      insights.nextSteps.push('Complete your learning profile setup')
    } else if (userProfile.progressSummary.overallProgress < 10) {
      insights.nextSteps.push('Start working on your first learning module')
    } else if (userProfile.learningProfile.currentStreak === 0) {
      insights.nextSteps.push('Begin a new learning streak today')
    } else {
      insights.nextSteps.push('Continue your excellent learning momentum')
    }
    
    if (userProfile.socialProfile.solutionsShared === 0) {
      insights.nextSteps.push('Share your first solution with the community')
    }
    
    if (userProfile.socialProfile.studyGroupsJoined === 0) {
      insights.nextSteps.push('Join a study group for collaborative learning')
    }

    // Calculate health score
    const healthFactors = [
      userProfile.profileCompleteness / 100 * 20, // 20% for profile completeness
      Math.min(userProfile.learningProfile.currentStreak / 30, 1) * 20, // 20% for streak
      userProfile.progressSummary.overallProgress / 100 * 30, // 30% for progress
      Math.min((userProfile.learningProfile.averageScore || 0) / 100, 1) * 15, // 15% for performance
      (userProfile.socialProfile.engagementLevel === 'high' ? 1 : 
       userProfile.socialProfile.engagementLevel === 'medium' ? 0.6 : 0.3) * 15, // 15% for social
    ]
    
    insights.healthScore = Math.round(healthFactors.reduce((sum, factor) => sum + factor, 0))

    return insights
  }, [userProfile])

  // Profile actions
  const profileActions = {
    // Update goals
    updateGoals: goals.updateGoals,
    
    // Refetch all profile data
    refetchProfile: () => {
      goals.refetch()
      progress.refetch()
      gamification.refetch()
      analytics.refetch()
      social.refetch()
    },
    
    // Get profile export data
    getProfileExport: () => {
      if (!userProfile) return null
      
      return {
        exportedAt: new Date().toISOString(),
        userId: userProfile.userId,
        profileData: userProfile,
        insights: profileInsights,
      }
    },
  }

  return {
    userProfile,
    profileInsights,
    profileActions,
    isLoading,
    error,
    
    // Quick access to key metrics
    quickStats: userProfile ? {
      level: userProfile.achievementProfile.level,
      streak: userProfile.learningProfile.currentStreak,
      progress: userProfile.progressSummary.overallProgress,
      xp: userProfile.achievementProfile.totalXP,
      completeness: userProfile.profileCompleteness,
      healthScore: profileInsights?.healthScore || 0,
    } : null,
    
    // Profile status flags
    status: userProfile ? {
      isOnboarded: userProfile.isOnboarded,
      hasActiveStreak: userProfile.learningProfile.currentStreak > 0,
      isHighPerformer: (userProfile.learningProfile.averageScore || 0) >= 80,
      isSociallyActive: userProfile.socialProfile.engagementLevel !== 'low',
      needsAttention: (profileInsights?.healthScore || 0) < 60,
    } : null,
  }
}