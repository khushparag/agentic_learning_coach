/**
 * Analytics API Hooks - React Query hooks for learning analytics and insights
 */

import { useQuery } from '@tanstack/react-query'
import { AnalyticsService } from '../../services/analyticsService'
import { queryKeys, handleQueryError } from '../../lib/queryClient'

/**
 * Hook to get comprehensive learning insights and analytics
 */
export function useLearningInsights(userId: string | null, timeRangeDays: number = 30) {
  return useQuery({
    queryKey: queryKeys.analytics.insights(userId || '', timeRangeDays),
    queryFn: () => AnalyticsService.getLearningInsights(userId!, timeRangeDays),
    enabled: Boolean(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
  })
}

/**
 * Hook to predict optimal difficulty for the next exercise
 */
export function useDifficultyPrediction(userId: string | null, topic: string | null) {
  return useQuery({
    queryKey: queryKeys.analytics.difficulty(userId || '', topic || ''),
    queryFn: () => AnalyticsService.predictOptimalDifficulty(userId!, topic!),
    enabled: Boolean(userId && topic),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Hook to analyze knowledge retention and recommend reviews
 */
export function useRetentionAnalysis(userId: string | null, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.analytics.retention(userId || '', limit),
    queryFn: () => AnalyticsService.analyzeRetention(userId!, limit),
    enabled: Boolean(userId),
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  })
}

/**
 * Hook to get activity heatmap data for visualization
 */
export function useActivityHeatmap(userId: string | null, weeks: number = 12) {
  return useQuery({
    queryKey: queryKeys.analytics.heatmap(userId || '', weeks),
    queryFn: () => AnalyticsService.getActivityHeatmap(userId!, weeks),
    enabled: Boolean(userId),
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to get anonymized peer comparison metrics
 */
export function usePeerComparison(userId: string | null, metric: string = 'velocity') {
  return useQuery({
    queryKey: queryKeys.analytics.comparison(userId || '', metric),
    queryFn: () => AnalyticsService.getPeerComparison(userId!, metric),
    enabled: Boolean(userId),
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to get AI-powered personalized recommendations
 */
export function usePersonalizedRecommendations(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.analytics.recommendations(userId || ''),
    queryFn: () => AnalyticsService.getPersonalizedRecommendations(userId!),
    enabled: Boolean(userId),
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  })
}

/**
 * Hook with analytics utilities and computed values
 */
export function useAnalyticsWithUtils(userId: string | null) {
  const insightsQuery = useLearningInsights(userId)
  const retentionQuery = useRetentionAnalysis(userId)
  const heatmapQuery = useActivityHeatmap(userId)
  const recommendationsQuery = usePersonalizedRecommendations(userId)

  const insights = insightsQuery.data
  const retentionData = Array.isArray(retentionQuery.data) ? retentionQuery.data : []
  const heatmap = heatmapQuery.data
  const recommendations = recommendationsQuery.data

  return {
    // Query data and state
    insights,
    retention: retentionData,
    heatmap,
    recommendations,
    isLoading: insightsQuery.isLoading || retentionQuery.isLoading || 
               heatmapQuery.isLoading || recommendationsQuery.isLoading,
    isError: insightsQuery.isError || retentionQuery.isError || 
             heatmapQuery.isError || recommendationsQuery.isError,
    error: insightsQuery.error ? handleQueryError(insightsQuery.error) :
           retentionQuery.error ? handleQueryError(retentionQuery.error) :
           heatmapQuery.error ? handleQueryError(heatmapQuery.error) :
           recommendationsQuery.error ? handleQueryError(recommendationsQuery.error) : null,
    
    // Computed properties
    efficiencyScore: insights ? AnalyticsService.calculateEfficiencyScore(insights) : null,
    learningPatterns: heatmap ? AnalyticsService.analyzeLearningPatterns(heatmap) : null,
    retentionAnalysis: retentionData.length > 0 ? AnalyticsService.formatRetentionAnalysis(retentionData) : null,
    studySchedule: insights && retentionData.length > 0 
      ? AnalyticsService.generateStudySchedule(insights, retentionData) 
      : [],
    learningROI: insights ? AnalyticsService.calculateLearningROI(insights) : null,
    
    // Utilities
    getRetentionUrgencyColor: AnalyticsService.getRetentionUrgencyColor,
    
    // Refetch functions
    refetch: () => {
      insightsQuery.refetch()
      retentionQuery.refetch()
      heatmapQuery.refetch()
      recommendationsQuery.refetch()
    },
  }
}

/**
 * Hook for learning analytics dashboard
 */
export function useAnalyticsDashboard(userId: string | null) {
  const analyticsQuery = useAnalyticsWithUtils(userId)
  const peerComparisonQuery = usePeerComparison(userId, 'velocity')

  const {
    insights,
    retention: _retention,
    heatmap,
    recommendations,
    efficiencyScore,
    learningPatterns,
    retentionAnalysis,
    learningROI,
  } = analyticsQuery

  const peerComparison = peerComparisonQuery.data

  const dashboard = {
    // Overview metrics
    overview: insights ? {
      velocityScore: insights.velocity?.velocity_score ?? 0,
      engagementScore: insights.engagement_score ?? 0,
      streakHealth: insights.streak_health ?? 'broken',
      skillProgressions: insights.skill_progressions?.length ?? 0,
      strugglingAreas: insights.struggle_patterns?.length ?? 0,
    } : null,

    // Performance analysis
    performance: {
      efficiency: efficiencyScore,
      learningROI,
      peerComparison,
      trends: insights ? {
        velocity: insights.velocity?.trend ?? 'stable',
        engagement: (insights.engagement_score ?? 0) >= 80 ? 'high' : 
                   (insights.engagement_score ?? 0) >= 60 ? 'medium' : 'low',
        consistency: learningPatterns?.consistencyScore || 0,
      } : null,
    },

    // Learning patterns
    patterns: {
      learningPatterns,
      optimalStudyTimes: insights?.optimal_study_times || [],
      mostActiveDay: learningPatterns?.mostActiveDay,
      averageDaily: learningPatterns?.averageDaily || 0,
    },

    // Recommendations and insights
    recommendations: {
      aiRecommendations: recommendations?.recommendations || [],
      focusAreas: insights?.recommended_focus_areas || [],
      retentionReviews: retentionAnalysis?.needsReview || [],
      nextMilestone: recommendations?.next_milestone,
    },

    // Skill development
    skills: {
      progressions: insights?.skill_progressions || [],
      strugglingAreas: insights?.struggle_patterns || [],
      predictedMastery: insights?.predicted_completion_date,
    },

    // Activity analysis
    activity: {
      heatmapData: heatmap?.data || [],
      totalActivities: heatmap?.total_activities || 0,
      patterns: learningPatterns?.patterns || [],
      consistencyScore: learningPatterns?.consistencyScore || 0,
    },
  }

  return {
    dashboard,
    isLoading: analyticsQuery.isLoading || peerComparisonQuery.isLoading,
    error: analyticsQuery.error || 
           (peerComparisonQuery.error ? handleQueryError(peerComparisonQuery.error) : null),
    refetch: () => {
      analyticsQuery.refetch()
      peerComparisonQuery.refetch()
    },
  }
}

/**
 * Hook for retention management
 */
export function useRetentionManagement(userId: string | null) {
  const retentionQuery = useRetentionAnalysis(userId)
  const retention = Array.isArray(retentionQuery.data) ? retentionQuery.data : []

  const retentionManagement = {
    // Categorized by urgency
    critical: retention.filter(r => r.review_urgency === 'critical'),
    high: retention.filter(r => r.review_urgency === 'high'),
    medium: retention.filter(r => r.review_urgency === 'medium'),
    low: retention.filter(r => r.review_urgency === 'low'),
    upToDate: retention.filter(r => r.review_urgency === 'none'),

    // Summary stats
    totalTopics: retention.length,
    needsReview: retention.filter(r => r.review_urgency !== 'none').length,
    criticalCount: retention.filter(r => r.review_urgency === 'critical').length,
    
    // Average retention score
    averageRetention: retention.length > 0 
      ? retention.reduce((sum, r) => sum + r.retention_score, 0) / retention.length
      : 0,

    // Topics due for review today
    dueToday: retention.filter(r => {
      const reviewDate = new Date(r.recommended_review_date)
      const today = new Date()
      return reviewDate <= today
    }),

    // Upcoming reviews (next 7 days)
    upcomingWeek: retention.filter(r => {
      const reviewDate = new Date(r.recommended_review_date)
      const today = new Date()
      const weekFromNow = new Date()
      weekFromNow.setDate(today.getDate() + 7)
      return reviewDate > today && reviewDate <= weekFromNow
    }),

    // Generate review schedule
    reviewSchedule: AnalyticsService.generateStudySchedule(
      { recommended_focus_areas: [], optimal_study_times: ['09:00-11:00'] } as any,
      retention
    ).filter(item => item.type === 'review'),
  }

  return {
    retentionManagement,
    isLoading: retentionQuery.isLoading,
    error: retentionQuery.error ? handleQueryError(retentionQuery.error) : null,
    refetch: retentionQuery.refetch,
  }
}

/**
 * Hook for difficulty optimization
 */
export function useDifficultyOptimization(userId: string | null, currentTopic: string | null) {
  const difficultyQuery = useDifficultyPrediction(userId, currentTopic)
  const insightsQuery = useLearningInsights(userId)

  const difficulty = difficultyQuery.data
  const insights = insightsQuery.data

  const optimization = {
    // Current recommendation
    recommendedDifficulty: difficulty?.recommended_difficulty,
    confidence: difficulty?.confidence,
    reasoning: difficulty?.reasoning,
    alternatives: difficulty?.alternative_difficulties || [],

    // Historical performance context
    strugglingTopics: insights?.struggle_patterns.map(p => p.topic) || [],
    strongTopics: insights?.skill_progressions
      .filter(s => s.progression_rate > 0.5)
      .map(s => s.skill) || [],

    // Adaptive suggestions
    suggestions: (() => {
      if (!difficulty || !insights) return []
      
      const suggestions: string[] = []
      
      if (difficulty.confidence < 0.7) {
        suggestions.push('More data needed for accurate difficulty prediction')
      }
      
      if (currentTopic && insights.struggle_patterns.some(p => p.topic === currentTopic)) {
        suggestions.push('Consider starting with easier exercises for this topic')
      }
      
      if (difficulty.recommended_difficulty > 7) {
        suggestions.push('High difficulty recommended - ensure you\'re ready for the challenge')
      }
      
      return suggestions
    })(),

    // Performance indicators
    shouldIncreaseDifficulty: insights?.velocity?.trend === 'increasing' && 
                             (insights?.struggle_patterns?.length ?? 0) < 2,
    shouldDecreaseDifficulty: (insights?.struggle_patterns?.length ?? 0) > 2 ||
                             insights?.velocity?.trend === 'decreasing',
  }

  return {
    optimization,
    isLoading: difficultyQuery.isLoading || insightsQuery.isLoading,
    error: difficultyQuery.error ? handleQueryError(difficultyQuery.error) :
           insightsQuery.error ? handleQueryError(insightsQuery.error) : null,
    refetch: () => {
      difficultyQuery.refetch()
      insightsQuery.refetch()
    },
  }
}