/**
 * Performance Metrics Widget - Comprehensive performance visualization
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from 'recharts'
import { 
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  BoltIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Card } from '../ui/Card'

interface PerformanceMetrics {
  accuracy: number
  speed: number
  consistency: number
  retention: number
  problemSolving: number
  codeQuality: number
}

interface PerformanceTrend {
  date: string
  accuracy: number
  speed: number
  consistency: number
  retention: number
}

interface SkillBreakdown {
  skill: string
  current: number
  target: number
  improvement: number
  trend: 'up' | 'down' | 'stable'
}

interface PerformanceMetricsWidgetProps {
  metrics: PerformanceMetrics
  trends: PerformanceTrend[]
  skillBreakdown: SkillBreakdown[]
  timeRange: '7d' | '30d' | '90d'
  onTimeRangeChange: (range: '7d' | '30d' | '90d') => void
  isLoading?: boolean
}

interface MetricCard {
  key: keyof PerformanceMetrics
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

const metricCards: MetricCard[] = [
  {
    key: 'accuracy',
    label: 'Accuracy',
    icon: CheckCircleIcon,
    color: 'blue',
    description: 'Percentage of correct solutions on first attempt'
  },
  {
    key: 'speed',
    label: 'Speed',
    icon: BoltIcon,
    color: 'yellow',
    description: 'How quickly you complete exercises'
  },
  {
    key: 'consistency',
    label: 'Consistency',
    icon: ClockIcon,
    color: 'green',
    description: 'Regularity of your learning sessions'
  },
  {
    key: 'retention',
    label: 'Retention',
    icon: AcademicCapIcon,
    color: 'purple',
    description: 'How well you remember previously learned concepts'
  },
  {
    key: 'problemSolving',
    label: 'Problem Solving',
    icon: TrophyIcon,
    color: 'orange',
    description: 'Ability to break down complex problems'
  },
  {
    key: 'codeQuality',
    label: 'Code Quality',
    icon: ArrowTrendingUpIcon,
    color: 'indigo',
    description: 'Readability, structure, and best practices'
  }
]

const getColorClasses = (color: string) => ({
  bg: `bg-${color}-50`,
  text: `text-${color}-600`,
  textDark: `text-${color}-900`,
  border: `border-${color}-200`,
  ring: `ring-${color}-500`
})

const CustomRadarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.value}%</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const PerformanceRadar = ({ metrics }: { metrics: PerformanceMetrics }) => {
  const radarData = [
    { subject: 'Accuracy', value: metrics.accuracy, fullMark: 100 },
    { subject: 'Speed', value: metrics.speed, fullMark: 100 },
    { subject: 'Consistency', value: metrics.consistency, fullMark: 100 },
    { subject: 'Retention', value: metrics.retention, fullMark: 100 },
    { subject: 'Problem Solving', value: metrics.problemSolving, fullMark: 100 },
    { subject: 'Code Quality', value: metrics.codeQuality, fullMark: 100 }
  ]

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <Radar
            name="Performance"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          />
          <Tooltip content={<CustomRadarTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

const SkillBreakdownChart = ({ skills }: { skills: SkillBreakdown[] }) => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={skills} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={12} />
          <YAxis 
            type="category" 
            dataKey="skill" 
            stroke="#6b7280" 
            fontSize={12}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey="target" fill="#e5e7eb" name="Target" radius={[0, 4, 4, 0]} />
          <Bar dataKey="current" fill="#3b82f6" name="Current" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const TrendChart = ({ trends }: { trends: PerformanceTrend[] }) => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trends}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          />
          <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
            name="Accuracy"
          />
          <Line
            type="monotone"
            dataKey="speed"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
            name="Speed"
          />
          <Line
            type="monotone"
            dataKey="consistency"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            name="Consistency"
          />
          <Line
            type="monotone"
            dataKey="retention"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
            name="Retention"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const MetricCard = ({ 
  metric, 
  value, 
  trend 
}: { 
  metric: MetricCard
  value: number
  trend?: number 
}) => {
  const Icon = metric.icon
  const colors = getColorClasses(metric.color)
  
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend > 0) return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
    if (trend < 0) return <ArrowTrendingUpIcon className="w-4 h-4 text-red-500 rotate-180" />
    return null
  }

  const getPerformanceLevel = (value: number) => {
    if (value >= 90) return { label: 'Excellent', color: 'text-green-600' }
    if (value >= 80) return { label: 'Good', color: 'text-blue-600' }
    if (value >= 70) return { label: 'Fair', color: 'text-yellow-600' }
    if (value >= 60) return { label: 'Needs Work', color: 'text-orange-600' }
    return { label: 'Poor', color: 'text-red-600' }
  }

  const performance = getPerformanceLevel(value)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${colors.text}`} />
          <span className={`font-medium ${colors.textDark}`}>{metric.label}</span>
        </div>
        {getTrendIcon()}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold ${colors.textDark}`}>{value}%</span>
          <span className={`text-sm font-medium ${performance.color}`}>
            {performance.label}
          </span>
        </div>
        
        <div className="w-full bg-white rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-2 rounded-full bg-gradient-to-r from-${metric.color}-400 to-${metric.color}-600`}
          />
        </div>
        
        <p className="text-xs text-gray-600">{metric.description}</p>
      </div>
    </motion.div>
  )
}

export default function PerformanceMetricsWidget({
  metrics,
  trends,
  skillBreakdown,
  timeRange,
  onTimeRangeChange,
  isLoading = false
}: PerformanceMetricsWidgetProps) {
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'skills'>('overview')

  const overallScore = useMemo(() => {
    const values = Object.values(metrics)
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
  }, [metrics])

  const getOverallRating = (score: number) => {
    if (score >= 90) return { label: 'Outstanding', color: 'text-green-600', bg: 'bg-green-50' }
    if (score >= 80) return { label: 'Excellent', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (score >= 70) return { label: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    if (score >= 60) return { label: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50' }
    return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const rating = getOverallRating(overallScore)

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <AcademicCapIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
          <div className="group relative">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Comprehensive analysis of your learning performance
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'overview' as const, label: 'Overview' },
              { key: 'trends' as const, label: 'Trends' },
              { key: 'skills' as const, label: 'Skills' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeView === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: '7d' as const, label: '7D' },
              { key: '30d' as const, label: '30D' },
              { key: '90d' as const, label: '90D' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onTimeRangeChange(key)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className={`${rating.bg} rounded-lg p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 font-medium">Overall Performance Score</div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">{overallScore}%</span>
              <span className={`text-lg font-semibold ${rating.color}`}>{rating.label}</span>
            </div>
          </div>
          <TrophyIcon className={`w-12 h-12 ${rating.color.replace('text-', 'text-').replace('-600', '-400')}`} />
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {metricCards.map((metric) => (
              <MetricCard
                key={metric.key}
                metric={metric}
                value={metrics[metric.key]}
                trend={trends.length > 1 ? 
                  trends[trends.length - 1][metric.key] - trends[trends.length - 2][metric.key] : 
                  undefined
                }
              />
            ))}
          </div>

          {/* Performance Radar */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Performance Overview</h4>
            <PerformanceRadar metrics={metrics} />
          </div>
        </div>
      )}

      {activeView === 'trends' && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Performance Trends</h4>
          <TrendChart trends={trends} />
        </div>
      )}

      {activeView === 'skills' && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Skill Breakdown</h4>
          <SkillBreakdownChart skills={skillBreakdown} />
        </div>
      )}
    </Card>
  )
}
