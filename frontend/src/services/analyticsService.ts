/**
 * Analytics Service - API client for learning analytics and insights
 */

import api from './api'
import type {
  LearningInsights,
  DifficultyPrediction,
  RetentionAnalysis,
  ActivityHeatmapData,
  PeerComparison,
  PersonalizedRecommendations,
} from '../types/api'

export class AnalyticsService {
  private static readonly BASE_PATH = '/analytics'

  /**
   * Get comprehensive learning insights and analytics
   */
  static async getLearningInsights(
    userId: string,
    timeRangeDays: number = 30
  ): Promise<LearningInsights> {
    const params = { user_id: userId, time_range_days: timeRangeDays }
    const response = await api.get<LearningInsights>(`${this.BASE_PATH}/insights`, { params })
    return response.data
  }

  /**
   * Predict optimal difficulty for the next exercise
   */
  static async predictOptimalDifficulty(
    userId: string,
    topic: string
  ): Promise<DifficultyPrediction> {
    const params = { user_id: userId, topic }
    const response = await api.get<DifficultyPrediction>(
      `${this.BASE_PATH}/difficulty-prediction`,
      { params }
    )
    return response.data
  }

  /**
   * Analyze knowledge retention and recommend reviews
   */
  static async analyzeRetention(
    userId: string,
    limit: number = 10
  ): Promise<RetentionAnalysis[]> {
    const params = { user_id: userId, limit }
    const response = await api.get<RetentionAnalysis[]>(`${this.BASE_PATH}/retention`, { params })
    return response.data
  }

  /**
   * Get activity heatmap data for visualization
   */
  static async getActivityHeatmap(
    userId: string,
    weeks: number = 12
  ): Promise<ActivityHeatmapData> {
    const params = { user_id: userId, weeks }
    const response = await api.get<ActivityHeatmapData>(`${this.BASE_PATH}/heatmap`, { params })
    return response.data
  }

  /**
   * Get anonymized peer comparison metrics
   */
  static async getPeerComparison(
    userId: string,
    metric: string = 'velocity'
  ): Promise<PeerComparison> {
    const params = { user_id: userId, metric }
    const response = await api.get<PeerComparison>(`${this.BASE_PATH}/comparison`, { params })
    return response.data
  }

  /**
   * Get AI-powered personalized recommendations
   */
  static async getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendations> {
    const params = { user_id: userId }
    const response = await api.get<PersonalizedRecommendations>(
      `${this.BASE_PATH}/recommendations`,
      { params }
    )
    return response.data
  }

  /**
   * Calculate learning efficiency score
   */
  static calculateEfficiencyScore(insights: LearningInsights): {
    score: number
    rating: string
    factors: string[]
  } {
    const { velocity, engagement_score, streak_health } = insights

    let score = 0
    const factors: string[] = []

    // Velocity component (40%)
    const velocityScore = Math.min(100, velocity?.velocity_score ?? 0)
    score += velocityScore * 0.4

    if (velocityScore >= 80) {
      factors.push('Excellent learning velocity')
    } else if (velocityScore >= 60) {
      factors.push('Good learning pace')
    } else {
      factors.push('Could improve learning consistency')
    }

    // Engagement component (35%)
    score += engagement_score * 0.35

    if (engagement_score >= 80) {
      factors.push('High engagement level')
    } else if (engagement_score >= 60) {
      factors.push('Moderate engagement')
    } else {
      factors.push('Low engagement - consider varying activities')
    }

    // Streak health component (25%)
    const streakScore = streak_health === 'healthy' ? 100 : 
                       streak_health === 'at_risk' ? 60 : 20
    score += streakScore * 0.25

    if (streak_health === 'healthy') {
      factors.push('Consistent learning habit')
    } else if (streak_health === 'at_risk') {
      factors.push('Streak needs attention')
    } else {
      factors.push('Focus on building consistency')
    }

    // Determine rating
    let rating: string
    if (score >= 85) {
      rating = 'Excellent'
    } else if (score >= 70) {
      rating = 'Good'
    } else if (score >= 55) {
      rating = 'Fair'
    } else {
      rating = 'Needs Improvement'
    }

    return {
      score: Math.round(score),
      rating,
      factors,
    }
  }

  /**
   * Analyze learning patterns from heatmap data
   */
  static analyzeLearningPatterns(heatmapData: ActivityHeatmapData): {
    mostActiveDay: string
    mostActiveDayCount: number
    averageDaily: number
    consistencyScore: number
    patterns: string[]
  } {
    const data = heatmapData?.data || []
    
    // Group by day of week
    const dayOfWeekCounts: Record<string, number> = {}
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    let totalActivity = 0
    let activeDays = 0

    data.forEach(entry => {
      const date = new Date(entry.date)
      const dayOfWeek = dayNames[date.getDay()]
      
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + entry.count
      totalActivity += entry.count
      
      if (entry.count > 0) {
        activeDays++
      }
    })

    // Find most active day
    const mostActiveDay = Object.entries(dayOfWeekCounts).reduce(
      (max, [day, count]) => count > max.count ? { day, count } : max,
      { day: 'Monday', count: 0 }
    )

    // Calculate averages and consistency
    const averageDaily = data.length > 0 ? totalActivity / data.length : 0
    const consistencyScore = data.length > 0 ? (activeDays / data.length) * 100 : 0

    // Generate pattern insights
    const patterns: string[] = []
    
    if (consistencyScore >= 80) {
      patterns.push('Very consistent learning schedule')
    } else if (consistencyScore >= 60) {
      patterns.push('Moderately consistent learning')
    } else {
      patterns.push('Inconsistent learning pattern')
    }

    // Weekend vs weekday analysis
    const weekendActivity = (dayOfWeekCounts['Saturday'] || 0) + (dayOfWeekCounts['Sunday'] || 0)
    const weekdayActivity = totalActivity - weekendActivity
    
    if (weekendActivity > weekdayActivity * 0.4) {
      patterns.push('Active on weekends')
    } else {
      patterns.push('Primarily weekday learner')
    }

    return {
      mostActiveDay: mostActiveDay.day,
      mostActiveDayCount: mostActiveDay.count,
      averageDaily: Math.round(averageDaily * 10) / 10,
      consistencyScore: Math.round(consistencyScore),
      patterns,
    }
  }

  /**
   * Get retention urgency color
   */
  static getRetentionUrgencyColor(urgency: string): string {
    const colors = {
      none: 'green',
      low: 'blue',
      medium: 'yellow',
      high: 'orange',
      critical: 'red',
    }
    return colors[urgency as keyof typeof colors] || 'gray'
  }

  /**
   * Format retention analysis for display
   */
  static formatRetentionAnalysis(analyses: RetentionAnalysis[]): {
    needsReview: RetentionAnalysis[]
    upToDate: RetentionAnalysis[]
    criticalCount: number
  } {
    const safeAnalyses = Array.isArray(analyses) ? analyses : []
    const needsReview = safeAnalyses.filter(
      analysis => analysis.review_urgency !== 'none'
    )
    const upToDate = safeAnalyses.filter(
      analysis => analysis.review_urgency === 'none'
    )
    const criticalCount = safeAnalyses.filter(
      analysis => analysis.review_urgency === 'critical'
    ).length

    return {
      needsReview: needsReview.sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 }
        return urgencyOrder[a.review_urgency as keyof typeof urgencyOrder] - 
               urgencyOrder[b.review_urgency as keyof typeof urgencyOrder]
      }),
      upToDate,
      criticalCount,
    }
  }

  /**
   * Generate study schedule based on analytics
   */
  static generateStudySchedule(
    insights: LearningInsights,
    retentionAnalysis: RetentionAnalysis[]
  ): Array<{
    date: string
    type: 'new_content' | 'review' | 'practice'
    topic: string
    estimatedMinutes: number
    priority: 'high' | 'medium' | 'low'
  }> {
    const schedule: Array<{
      date: string
      type: 'new_content' | 'review' | 'practice'
      topic: string
      estimatedMinutes: number
      priority: 'high' | 'medium' | 'low'
    }> = []

    const today = new Date()
    const safeRetentionAnalysis = Array.isArray(retentionAnalysis) ? retentionAnalysis : []
    
    // Add critical reviews first
    safeRetentionAnalysis
      .filter(analysis => analysis.review_urgency === 'critical')
      .forEach(analysis => {
        schedule.push({
          date: today.toISOString().split('T')[0],
          type: 'review',
          topic: analysis.topic,
          estimatedMinutes: 20,
          priority: 'high',
        });
      });

    // Add high priority reviews
    safeRetentionAnalysis
      .filter(analysis => analysis.review_urgency === 'high')
      .forEach(analysis => {
        const reviewDate = new Date(analysis.recommended_review_date);
        schedule.push({
          date: reviewDate.toISOString().split('T')[0],
          type: 'review',
          topic: analysis.topic,
          estimatedMinutes: 15,
          priority: 'high',
        });
      });

    // Add new content based on optimal study times
    (insights.optimal_study_times || []).forEach((_timeSlot, index) => {
      const studyDate = new Date(today);
      studyDate.setDate(studyDate.getDate() + index);
      
      schedule.push({
        date: studyDate.toISOString().split('T')[0],
        type: 'new_content',
        topic: insights.recommended_focus_areas[0] || 'Continue current module',
        estimatedMinutes: 45,
        priority: 'medium',
      });
    });

    return schedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  /**
   * Calculate learning ROI (Return on Investment)
   */
  static calculateLearningROI(insights: LearningInsights): {
    roi: number
    timeInvested: number
    skillsGained: number
    efficiency: string
  } {
    const { velocity, skill_progressions } = insights

    const timeInvested = (velocity?.hours_per_week ?? 0) * 4 // Monthly hours
    const skillsGained = (skill_progressions || []).reduce(
      (total, skill) => total + (skill.current_level - skill.initial_level),
      0
    )

    const roi = skillsGained / Math.max(1, timeInvested) * 100

    let efficiency: string
    if (roi >= 15) {
      efficiency = 'Excellent'
    } else if (roi >= 10) {
      efficiency = 'Good'
    } else if (roi >= 5) {
      efficiency = 'Fair'
    } else {
      efficiency = 'Poor'
    }

    return {
      roi: Math.round(roi * 10) / 10,
      timeInvested: Math.round(timeInvested),
      skillsGained: Math.round(skillsGained * 10) / 10,
      efficiency,
    }
  }
}