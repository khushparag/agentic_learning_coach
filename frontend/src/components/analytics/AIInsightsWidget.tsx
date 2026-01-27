/**
 * AI Insights Widget - AI-powered learning insights and recommendations
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowRightIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface AIInsight {
  id: string
  type: 'recommendation' | 'warning' | 'achievement' | 'prediction' | 'optimization'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  category: 'learning_pace' | 'skill_development' | 'retention' | 'efficiency' | 'motivation'
  data?: Record<string, any>
  timestamp: string
}

interface LearningPrediction {
  type: 'completion_time' | 'difficulty_adjustment' | 'skill_mastery' | 'retention_risk'
  prediction: string
  confidence: number
  timeframe: string
  factors: string[]
}

interface PersonalizedRecommendation {
  id: string
  type: 'schedule' | 'content' | 'pace' | 'method'
  title: string
  description: string
  expectedBenefit: string
  effort: 'low' | 'medium' | 'high'
  priority: number
}

interface AIInsightsWidgetProps {
  insights: AIInsight[]
  predictions: LearningPrediction[]
  recommendations: PersonalizedRecommendation[]
  onApplyRecommendation: (id: string) => void
  onDismissInsight: (id: string) => void
  isLoading?: boolean
}

const insightIcons = {
  recommendation: LightBulbIcon,
  warning: ExclamationTriangleIcon,
  achievement: CheckCircleIcon,
  prediction: ArrowTrendingUpIcon,
  optimization: ChartBarIcon
}

const insightColors = {
  recommendation: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    textDark: 'text-blue-900',
    icon: 'text-blue-500'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-600',
    textDark: 'text-yellow-900',
    icon: 'text-yellow-500'
  },
  achievement: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-600',
    textDark: 'text-green-900',
    icon: 'text-green-500'
  },
  prediction: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-600',
    textDark: 'text-purple-900',
    icon: 'text-purple-500'
  },
  optimization: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-600',
    textDark: 'text-indigo-900',
    icon: 'text-indigo-500'
  }
}

const priorityColors = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-500'
}

const ConfidenceBar = ({ confidence }: { confidence: number }) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'bg-green-500'
    if (conf >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 80) return 'High Confidence'
    if (conf >= 60) return 'Medium Confidence'
    return 'Low Confidence'
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getConfidenceColor(confidence)}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 font-medium">
        {getConfidenceLabel(confidence)}
      </span>
    </div>
  )
}

const InsightCard = ({ 
  insight, 
  onApply, 
  onDismiss 
}: { 
  insight: AIInsight
  onApply?: () => void
  onDismiss: () => void 
}) => {
  const Icon = insightIcons[insight.type]
  const colors = insightColors[insight.type]
  const [isExpanded, setIsExpanded] = useState(false)

  const timeAgo = useMemo(() => {
    const now = new Date()
    const timestamp = new Date(insight.timestamp)
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }, [insight.timestamp])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${colors.bg} border ${colors.border} border-l-4 ${priorityColors[insight.priority]} rounded-lg p-4`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${colors.icon} mt-0.5 flex-shrink-0`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-semibold ${colors.textDark}`}>{insight.title}</h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{timeAgo}</span>
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ×
              </button>
            </div>
          </div>
          
          <p className={`text-sm ${colors.text} mb-3`}>{insight.description}</p>
          
          <div className="mb-3">
            <ConfidenceBar confidence={insight.confidence} />
          </div>
          
          {insight.data && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-xs ${colors.text} hover:${colors.textDark} font-medium mb-2`}
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </button>
          )}
          
          <AnimatePresence>
            {isExpanded && insight.data && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white bg-opacity-50 rounded p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(insight.data).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="ml-1 font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {insight.action && onApply && (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={onApply}
                className="text-xs"
              >
                {insight.action}
              </Button>
              <span className={`text-xs ${colors.text}`}>
                Impact: {insight.impact}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const PredictionCard = ({ prediction }: { prediction: LearningPrediction }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'completion_time': return ClockIcon
      case 'difficulty_adjustment': return ChartBarIcon
      case 'skill_mastery': return ArrowTrendingUpIcon
      case 'retention_risk': return ExclamationTriangleIcon
      default: return SparklesIcon
    }
  }

  const Icon = getTypeIcon(prediction.type)

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-purple-900 capitalize">
              {prediction.type.replace('_', ' ')} Prediction
            </h4>
            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              {prediction.timeframe}
            </span>
          </div>
          
          <p className="text-sm text-purple-700 mb-3">{prediction.prediction}</p>
          
          <div className="mb-3">
            <ConfidenceBar confidence={prediction.confidence} />
          </div>
          
          {prediction.factors.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-purple-800 mb-1">Key Factors:</h5>
              <div className="flex flex-wrap gap-1">
                {prediction.factors.map((factor, index) => (
                  <span
                    key={index}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const RecommendationCard = ({ 
  recommendation, 
  onApply 
}: { 
  recommendation: PersonalizedRecommendation
  onApply: () => void 
}) => {
  const effortColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${effortColors[recommendation.effort]}`}>
              {recommendation.effort} effort
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
          <p className="text-sm text-green-600 font-medium">{recommendation.expectedBenefit}</p>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">Priority</div>
            <div className="text-sm font-bold text-gray-900">{recommendation.priority}/10</div>
          </div>
          <Button
            size="sm"
            onClick={onApply}
            className="flex items-center space-x-1"
          >
            <span>Apply</span>
            <ArrowRightIcon className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AIInsightsWidget({
  insights,
  predictions,
  recommendations,
  onApplyRecommendation,
  onDismissInsight,
  isLoading = false
}: AIInsightsWidgetProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions' | 'recommendations'>('insights')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      const typeMatch = filterType === 'all' || insight.type === filterType
      const priorityMatch = filterPriority === 'all' || insight.priority === filterPriority
      return typeMatch && priorityMatch
    })
  }, [insights, filterType, filterPriority])

  const sortedRecommendations = useMemo(() => {
    return [...recommendations].sort((a, b) => b.priority - a.priority)
  }, [recommendations])

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Learning Insights</h3>
          <div className="group relative">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              AI-powered insights and personalized recommendations
            </div>
          </div>
        </div>

        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'insights' as const, label: 'Insights', count: insights.length },
            { key: 'predictions' as const, label: 'Predictions', count: predictions.length },
            { key: 'recommendations' as const, label: 'Recommendations', count: recommendations.length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                activeTab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <span className="bg-gray-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters for insights tab */}
      {activeTab === 'insights' && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Types</option>
              <option value="recommendation">Recommendations</option>
              <option value="warning">Warnings</option>
              <option value="achievement">Achievements</option>
              <option value="prediction">Predictions</option>
              <option value="optimization">Optimizations</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      <div className="space-y-4">
        {activeTab === 'insights' && (
          <AnimatePresence>
            {filteredInsights.length > 0 ? (
              filteredInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onApply={insight.action ? () => onApplyRecommendation(insight.id) : undefined}
                  onDismiss={() => onDismissInsight(insight.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No insights available with current filters</p>
              </div>
            )}
          </AnimatePresence>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-4">
            {predictions.length > 0 ? (
              predictions.map((prediction, index) => (
                <PredictionCard key={index} prediction={prediction} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ArrowTrendingUpIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No predictions available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {sortedRecommendations.length > 0 ? (
              sortedRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onApply={() => onApplyRecommendation(recommendation.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <LightBulbIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recommendations available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
