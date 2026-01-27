/**
 * Analytics Dashboard - Comprehensive learning analytics with AI-powered insights
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import LearningVelocityChart from './LearningVelocityChart'
import ActivityHeatmap from './ActivityHeatmap'
import PerformanceMetricsWidget from './PerformanceMetricsWidget'
import KnowledgeRetentionAnalysis from './KnowledgeRetentionAnalysis'
import AIInsightsWidget from './AIInsightsWidget'
import { useAnalyticsDashboard } from '../../hooks/api/useAnalytics'

interface AnalyticsDashboardProps {
  userId: string
}

interface DashboardLayout {
  id: string
  component: React.ComponentType<any>
  title: string
  size: 'small' | 'medium' | 'large' | 'full'
  enabled: boolean
}

const defaultLayouts: DashboardLayout[] = [
  {
    id: 'velocity',
    component: LearningVelocityChart,
    title: 'Learning Velocity',
    size: 'large',
    enabled: true
  },
  {
    id: 'heatmap',
    component: ActivityHeatmap,
    title: 'Activity Heatmap',
    size: 'medium',
    enabled: true
  },
  {
    id: 'performance',
    component: PerformanceMetricsWidget,
    title: 'Performance Metrics',
    size: 'large',
    enabled: true
  },
  {
    id: 'retention',
    component: KnowledgeRetentionAnalysis,
    title: 'Knowledge Retention',
    size: 'full',
    enabled: true
  },
  {
    id: 'insights',
    component: AIInsightsWidget,
    title: 'AI Insights',
    size: 'full',
    enabled: true
  }
]

const getSizeClasses = (size: string) => {
  switch (size) {
    case 'small': return 'col-span-1'
    case 'medium': return 'col-span-1 lg:col-span-2'
    case 'large': return 'col-span-1 lg:col-span-3'
    case 'full': return 'col-span-1 lg:col-span-4'
    default: return 'col-span-1'
  }
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [layouts, setLayouts] = useState<DashboardLayout[]>(defaultLayouts)
  const [showSettings, setShowSettings] = useState(false)

  const { dashboard, isLoading, error, refetch } = useAnalyticsDashboard(userId)

  // Mock data transformation - in real app, this would come from the API
  const velocityData = useMemo(() => {
    if (!dashboard?.activity?.heatmapData) return []
    
    return dashboard.activity.heatmapData.slice(-30).map((item, index) => ({
      date: item.date,
      tasksCompleted: Math.floor(Math.random() * 8) + 1,
      xpEarned: Math.floor(Math.random() * 200) + 50,
      timeSpent: Math.floor(Math.random() * 120) + 30,
      efficiency: Math.floor(Math.random() * 40) + 60,
      trend: Math.random() * 0.2 - 0.1
    }))
  }, [dashboard?.activity?.heatmapData])

  const activityData = useMemo(() => {
    if (!dashboard?.activity?.heatmapData) return []
    
    return dashboard.activity.heatmapData.map(item => ({
      date: item.date,
      count: item.count,
      level: Math.min(Math.floor(item.count / 2), 5),
      details: {
        tasksCompleted: Math.floor(Math.random() * 5),
        xpEarned: Math.floor(Math.random() * 100),
        timeSpent: Math.floor(Math.random() * 60),
        topics: ['JavaScript', 'React', 'TypeScript'].slice(0, Math.floor(Math.random() * 3) + 1)
      }
    }))
  }, [dashboard?.activity?.heatmapData])

  const performanceMetrics = useMemo(() => ({
    accuracy: dashboard?.performance?.efficiency || 75,
    speed: 82,
    consistency: dashboard?.activity?.consistencyScore || 68,
    retention: 79,
    problemSolving: 85,
    codeQuality: 77
  }), [dashboard])

  const performanceTrends = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return {
        date: date.toISOString().split('T')[0],
        accuracy: Math.floor(Math.random() * 20) + 70,
        speed: Math.floor(Math.random() * 20) + 75,
        consistency: Math.floor(Math.random() * 20) + 65,
        retention: Math.floor(Math.random() * 20) + 70
      }
    })
  }, [])

  const skillBreakdown = useMemo(() => [
    { skill: 'JavaScript', current: 85, target: 90, improvement: 5, trend: 'up' as const },
    { skill: 'React', current: 78, target: 85, improvement: 7, trend: 'up' as const },
    { skill: 'TypeScript', current: 65, target: 80, improvement: 15, trend: 'stable' as const },
    { skill: 'Node.js', current: 72, target: 85, improvement: 13, trend: 'up' as const },
    { skill: 'CSS', current: 88, target: 90, improvement: 2, trend: 'stable' as const }
  ], [])

  const retentionData = useMemo(() => [
    {
      topic: 'JavaScript Fundamentals',
      retentionScore: 85,
      lastPracticed: '2024-01-15',
      reviewUrgency: 'low' as const,
      recommendedReviewDate: '2024-01-25',
      practiceCount: 12,
      masteryLevel: 88,
      forgettingCurve: Array.from({ length: 30 }, (_, i) => ({
        days: i,
        retention: Math.max(20, 100 - (i * 2.5) - Math.random() * 10)
      }))
    },
    {
      topic: 'React Hooks',
      retentionScore: 65,
      lastPracticed: '2024-01-10',
      reviewUrgency: 'medium' as const,
      recommendedReviewDate: '2024-01-20',
      practiceCount: 8,
      masteryLevel: 72,
      forgettingCurve: Array.from({ length: 30 }, (_, i) => ({
        days: i,
        retention: Math.max(15, 90 - (i * 3) - Math.random() * 15)
      }))
    },
    {
      topic: 'TypeScript Generics',
      retentionScore: 45,
      lastPracticed: '2024-01-05',
      reviewUrgency: 'critical' as const,
      recommendedReviewDate: '2024-01-18',
      practiceCount: 5,
      masteryLevel: 58,
      forgettingCurve: Array.from({ length: 30 }, (_, i) => ({
        days: i,
        retention: Math.max(10, 80 - (i * 4) - Math.random() * 20)
      }))
    }
  ], [])

  const reviewSchedule = useMemo(() => [
    {
      date: new Date().toISOString().split('T')[0],
      topics: [
        { topic: 'TypeScript Generics', urgency: 'critical', estimatedMinutes: 25 },
        { topic: 'React Hooks', urgency: 'medium', estimatedMinutes: 15 }
      ],
      totalMinutes: 40,
      priority: 'high' as const
    },
    {
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      topics: [
        { topic: 'JavaScript Fundamentals', urgency: 'low', estimatedMinutes: 20 }
      ],
      totalMinutes: 20,
      priority: 'medium' as const
    }
  ], [])

  const aiInsights = useMemo(() => [
    {
      id: '1',
      type: 'recommendation' as const,
      priority: 'high' as const,
      title: 'Optimize Study Schedule',
      description: 'Your learning velocity is highest between 9-11 AM. Consider scheduling complex topics during this time.',
      action: 'Adjust Schedule',
      confidence: 87,
      impact: 'high' as const,
      category: 'learning_pace' as const,
      data: {
        optimal_time: '9:00-11:00 AM',
        current_efficiency: '73%',
        predicted_improvement: '15%'
      },
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      type: 'warning' as const,
      priority: 'medium' as const,
      title: 'Retention Risk Detected',
      description: 'TypeScript concepts show declining retention. Review recommended within 2 days.',
      confidence: 92,
      impact: 'medium' as const,
      category: 'retention' as const,
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      type: 'achievement' as const,
      priority: 'low' as const,
      title: 'Consistency Milestone',
      description: 'You\'ve maintained a 7-day learning streak! Your consistency score improved by 23%.',
      confidence: 100,
      impact: 'low' as const,
      category: 'motivation' as const,
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ], [])

  const predictions = useMemo(() => [
    {
      type: 'completion_time' as const,
      prediction: 'Based on current pace, you\'ll complete the React module in 8-10 days',
      confidence: 78,
      timeframe: '8-10 days',
      factors: ['Current velocity', 'Topic complexity', 'Historical performance']
    },
    {
      type: 'skill_mastery' as const,
      prediction: 'JavaScript mastery level will reach 90% within 2 weeks with consistent practice',
      confidence: 85,
      timeframe: '2 weeks',
      factors: ['Practice frequency', 'Retention scores', 'Learning curve']
    }
  ], [])

  const recommendations = useMemo(() => [
    {
      id: 'rec1',
      type: 'schedule' as const,
      title: 'Morning Learning Sessions',
      description: 'Schedule complex topics between 9-11 AM when your focus is highest',
      expectedBenefit: '15% improvement in learning efficiency',
      effort: 'low' as const,
      priority: 9
    },
    {
      id: 'rec2',
      type: 'content' as const,
      title: 'Spaced Repetition for TypeScript',
      description: 'Add TypeScript review sessions every 3 days to improve retention',
      expectedBenefit: '25% better long-term retention',
      effort: 'medium' as const,
      priority: 8
    }
  ], [])

  const handleApplyRecommendation = (id: string) => {
    console.log('Applying recommendation:', id)
    // Implementation would integrate with backend
  }

  const handleDismissInsight = (id: string) => {
    console.log('Dismissing insight:', id)
    // Implementation would update insights state
  }

  const handleScheduleReview = (topic: string) => {
    console.log('Scheduling review for:', topic)
    // Implementation would integrate with scheduling system
  }

  const handleStartReview = (topics: string[]) => {
    console.log('Starting review for topics:', topics)
    // Implementation would navigate to review session
  }

  const handleExportData = () => {
    console.log('Exporting analytics data')
    // Implementation would generate and download report
  }

  const handleShareDashboard = () => {
    console.log('Sharing dashboard')
    // Implementation would generate shareable link
  }

  const toggleWidget = (id: string) => {
    setLayouts(prev => 
      prev.map(layout => 
        layout.id === id 
          ? { ...layout, enabled: !layout.enabled }
          : layout
      )
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load analytics</h3>
          <p className="text-gray-600 mb-4">There was an error loading your learning analytics.</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your learning journey</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportData}
            className="flex items-center space-x-1"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShareDashboard}
            className="flex items-center space-x-1"
          >
            <ShareIcon className="w-4 h-4" />
            <span>Share</span>
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-1"
          >
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Settings</span>
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Settings</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {layouts.map((layout) => (
                <label key={layout.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={layout.enabled}
                    onChange={() => toggleWidget(layout.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{layout.title}</span>
                </label>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Analytics Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {layouts.map((layout) => {
          if (!layout.enabled) return null
          
          const Component = layout.component
          const props = {
            isLoading,
            timeRange,
            onTimeRangeChange: setTimeRange
          }

          // Add specific props for each component
          if (layout.id === 'velocity') {
            Object.assign(props, { data: velocityData })
          } else if (layout.id === 'heatmap') {
            Object.assign(props, { data: activityData })
          } else if (layout.id === 'performance') {
            Object.assign(props, {
              metrics: performanceMetrics,
              trends: performanceTrends,
              skillBreakdown
            })
          } else if (layout.id === 'retention') {
            Object.assign(props, {
              retentionData,
              reviewSchedule,
              onScheduleReview: handleScheduleReview,
              onStartReview: handleStartReview
            })
          } else if (layout.id === 'insights') {
            Object.assign(props, {
              insights: aiInsights,
              predictions,
              recommendations,
              onApplyRecommendation: handleApplyRecommendation,
              onDismissInsight: handleDismissInsight
            })
          }

          return (
            <motion.div
              key={layout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={getSizeClasses(layout.size)}
            >
              <Component {...props} />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
