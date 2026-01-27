import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  CalendarIcon,
  AcademicCapIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { ProgressMetrics } from '../../types/dashboard'
import { Button } from '../ui/Button'

interface ProgressAnalyticsProps {
  metrics: ProgressMetrics
  isLoading?: boolean
}

interface TimeRangeSelector {
  range: '7d' | '30d' | '90d'
  onRangeChange: (range: '7d' | '30d' | '90d') => void
}

function TimeRangeSelector({ range, onRangeChange }: TimeRangeSelector) {
  const ranges = [
    { key: '7d' as const, label: '7 Days' },
    { key: '30d' as const, label: '30 Days' },
    { key: '90d' as const, label: '90 Days' }
  ]

  return (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
      {ranges.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onRangeChange(key)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            range === key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function LearningVelocityChart({ data }: { data: ProgressMetrics['learningVelocity'] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <Area
            type="monotone"
            dataKey="xpEarned"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
            strokeWidth={2}
            name="XP Earned"
          />
          <Area
            type="monotone"
            dataKey="tasksCompleted"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.1}
            strokeWidth={2}
            name="Tasks Completed"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ActivityHeatmap({ data }: { data: ProgressMetrics['activityHeatmap'] }) {
  // Group data by week for heatmap visualization
  const weeks: typeof data[] = []
  const daysPerWeek = 7
  
  for (let i = 0; i < data.length; i += daysPerWeek) {
    weeks.push(data.slice(i, i + daysPerWeek))
  }

  const getActivityColor = (activity: number) => {
    if (activity === 0) return 'bg-gray-100'
    if (activity <= 2) return 'bg-green-100'
    if (activity <= 4) return 'bg-green-200'
    if (activity <= 6) return 'bg-green-300'
    if (activity <= 8) return 'bg-green-400'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>Less</span>
        <div className="flex space-x-1">
          {[0, 2, 4, 6, 8, 10].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getActivityColor(level)}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {data.slice(-49).map((day, index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-sm ${getActivityColor(day.activity)} hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer`}
            title={`${day.date}: ${day.activity} activities`}
          />
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>7 weeks ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}

function PerformanceMetrics({ metrics }: { metrics: ProgressMetrics['performanceMetrics'] }) {
  const data = [
    { name: 'Accuracy', value: metrics.accuracy, color: '#3b82f6' },
    { name: 'Speed', value: metrics.speed, color: '#10b981' },
    { name: 'Consistency', value: metrics.consistency, color: '#f59e0b' },
    { name: 'Retention', value: metrics.retention, color: '#8b5cf6' }
  ]

  return (
    <div className="space-y-4">
      {data.map((metric) => (
        <div key={metric.name} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{metric.name}</span>
            <span className="text-gray-600">{metric.value}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metric.value}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-2 rounded-full"
              style={{ backgroundColor: metric.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function KnowledgeRetention({ data }: { data: ProgressMetrics['knowledgeRetention'] }) {
  const chartData = data.map(item => ({
    ...item,
    retentionRate: Math.round(item.retentionRate)
  }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={12} />
          <YAxis 
            type="category" 
            dataKey="topic" 
            stroke="#6b7280" 
            fontSize={12}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey="retentionRate" 
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
            name="Retention Rate (%)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function WeeklyProgress({ data }: { data: ProgressMetrics['weeklyProgress'] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey="target" fill="#e5e7eb" name="Target" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProgressAnalytics({ metrics, isLoading = false }: ProgressAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Progress Analytics</h2>
        </div>
        <div className="flex items-center space-x-4">
          <TimeRangeSelector range={timeRange} onRangeChange={setTimeRange} />
          <Link to="/analytics">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>View Full Analytics</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Velocity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Learning Velocity</h3>
          </div>
          <LearningVelocityChart data={metrics.learningVelocity} />
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <AcademicCapIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
          </div>
          <PerformanceMetrics metrics={metrics.performanceMetrics} />
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Activity Heatmap</h3>
          </div>
          <ActivityHeatmap data={metrics.activityHeatmap} />
        </motion.div>

        {/* Knowledge Retention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <ChartBarIcon className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Knowledge Retention</h3>
          </div>
          <KnowledgeRetention data={metrics.knowledgeRetention} />
        </motion.div>
      </div>

      {/* Weekly Progress - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
        <WeeklyProgress data={metrics.weeklyProgress} />
      </motion.div>
    </div>
  )
}
