/**
 * Competitive Analytics Component
 * Shows performance comparison, ranking trends, and competitive insights
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { Card, Button, Badge, Select, LoadingSpinner } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { GamificationService } from '../../services/gamificationService'
import { SocialService } from '../../services/socialService'

interface PerformanceMetric {
  label: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  percentile: number
  comparison: string
}

interface RankingHistory {
  date: string
  rank: number
  xp: number
  participants: number
}

interface CompetitiveInsight {
  type: 'strength' | 'improvement' | 'opportunity'
  title: string
  description: string
  action?: string
}

interface CompetitiveAnalyticsProps {
  className?: string
  timeframe?: 'week' | 'month' | 'quarter' | 'year'
}

export const CompetitiveAnalytics: React.FC<CompetitiveAnalyticsProps> = ({
  className = '',
  timeframe = 'month',
}) => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([])
  const [insights, setInsights] = useState<CompetitiveInsight[]>([])
  const [peerComparison, setPeerComparison] = useState<any>(null)

  // Mock data - in real app, this would come from analytics API
  const mockPerformanceMetrics: PerformanceMetric[] = [
    {
      label: 'Global Rank',
      value: 127,
      change: -15,
      trend: 'up',
      percentile: 85,
      comparison: 'Top 15% of learners'
    },
    {
      label: 'XP This Month',
      value: 2450,
      change: 320,
      trend: 'up',
      percentile: 78,
      comparison: '22% above average'
    },
    {
      label: 'Challenge Wins',
      value: 8,
      change: 3,
      trend: 'up',
      percentile: 92,
      comparison: 'Top 8% in challenges'
    },
    {
      label: 'Streak Days',
      value: 23,
      change: -2,
      trend: 'down',
      percentile: 65,
      comparison: 'Above average consistency'
    },
    {
      label: 'Problem Solving Speed',
      value: 18.5,
      change: -3.2,
      trend: 'up',
      percentile: 71,
      comparison: '18.5 min average'
    },
    {
      label: 'Code Quality Score',
      value: 87,
      change: 5,
      trend: 'up',
      percentile: 89,
      comparison: 'Excellent quality'
    }
  ]

  const mockRankingHistory: RankingHistory[] = [
    { date: '2024-01-01', rank: 180, xp: 1200, participants: 500 },
    { date: '2024-01-08', rank: 165, xp: 1450, participants: 520 },
    { date: '2024-01-15', rank: 142, xp: 1780, participants: 540 },
    { date: '2024-01-22', rank: 135, xp: 2100, participants: 560 },
    { date: '2024-01-29', rank: 127, xp: 2450, participants: 580 },
  ]

  const mockInsights: CompetitiveInsight[] = [
    {
      type: 'strength',
      title: 'Challenge Champion',
      description: 'You\'re in the top 8% for challenge wins. Your competitive spirit is paying off!',
    },
    {
      type: 'improvement',
      title: 'Streak Recovery',
      description: 'Your streak dropped slightly. Consistent daily practice could boost your ranking.',
      action: 'Set a daily learning reminder'
    },
    {
      type: 'opportunity',
      title: 'Speed Optimization',
      description: 'Improving your problem-solving speed by 20% could move you into the top 50.',
      action: 'Practice timed challenges'
    }
  ]

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true)
      try {
        // In real app: fetch actual analytics data
        await new Promise(resolve => setTimeout(resolve, 1000))
        setPerformanceMetrics(mockPerformanceMetrics)
        setRankingHistory(mockRankingHistory)
        setInsights(mockInsights)
        setPeerComparison({
          userValue: 2450,
          peerAverage: 2010,
          peerMedian: 1850,
          percentile: 78
        })
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [selectedTimeframe])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <StarIcon className="w-5 h-5 text-yellow-500" />
      case 'improvement':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
      case 'opportunity':
        return <AdjustmentsHorizontalIcon className="w-5 h-5 text-purple-500" />
      default:
        return <ChartBarIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'bg-yellow-50 border-yellow-200'
      case 'improvement':
        return 'bg-blue-50 border-blue-200'
      case 'opportunity':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-2">Loading competitive analytics...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">Competitive Analytics</h2>
          </div>
          
          <Select
            value={selectedTimeframe}
            onChange={(value) => setSelectedTimeframe(value as any)}
            options={[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'quarter', label: 'This Quarter' },
              { value: 'year', label: 'This Year' },
            ]}
            className="w-32"
          />
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">{metric.label}</h4>
                {getTrendIcon(metric.trend)}
              </div>
              
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                <span className={`text-sm font-medium ${
                  metric.change > 0 ? 'text-green-600' : 
                  metric.change < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}
                </span>
              </div>
              
              <p className="text-xs text-gray-600">{metric.comparison}</p>
              
              {/* Percentile Bar */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Percentile</span>
                  <span>{metric.percentile}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${metric.percentile}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Ranking Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking Trend</h3>
        
        <div className="relative h-64 bg-gray-50 rounded-lg p-4">
          {/* Simple line chart representation */}
          <div className="flex items-end justify-between h-full">
            {rankingHistory.map((point, index) => {
              const height = ((580 - point.rank) / 580) * 100 // Normalize to percentage
              return (
                <div key={point.date} className="flex flex-col items-center">
                  <div 
                    className="w-3 bg-blue-500 rounded-t transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    <div>#{point.rank}</div>
                    <div>{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Trend indicator */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-600">+53 positions</span>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Best Rank</p>
            <p className="text-lg font-semibold text-gray-900">#127</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">XP Growth</p>
            <p className="text-lg font-semibold text-green-600">+1,250</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Positions Gained</p>
            <p className="text-lg font-semibold text-blue-600">+53</p>
          </div>
        </div>
      </Card>

      {/* Competitive Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Insights</h3>
        
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                  {insight.action && (
                    <Button variant="outline" size="sm">
                      {insight.action}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Peer Comparison */}
      {peerComparison && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peer Comparison</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* XP Comparison */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">XP Performance</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your XP</span>
                  <span className="font-semibold text-blue-600">{peerComparison.userValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Peer Average</span>
                  <span className="font-medium text-gray-900">{peerComparison.peerAverage.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Peer Median</span>
                  <span className="font-medium text-gray-900">{peerComparison.peerMedian.toLocaleString()}</span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Your Percentile</span>
                    <Badge variant="success">{peerComparison.percentile}th percentile</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Radar */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Skill Breakdown</h4>
              <div className="space-y-2">
                {[
                  { skill: 'Problem Solving', score: 85, peer: 72 },
                  { skill: 'Code Quality', score: 87, peer: 75 },
                  { skill: 'Speed', score: 71, peer: 78 },
                  { skill: 'Consistency', score: 65, peer: 68 },
                ].map((item) => (
                  <div key={item.skill} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.skill}</span>
                      <span className="font-medium">{item.score}%</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <div 
                        className="absolute top-0 w-1 h-2 bg-gray-400 rounded"
                        style={{ left: `${item.peer}%` }}
                        title={`Peer average: ${item.peer}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default CompetitiveAnalytics