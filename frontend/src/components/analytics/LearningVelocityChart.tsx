/**
 * Learning Velocity Chart - Interactive chart showing learning speed and trends
 */

import { useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts'
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  MinusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Card } from '../ui/Card'

interface VelocityDataPoint {
  date: string
  tasksCompleted: number
  xpEarned: number
  timeSpent: number
  efficiency: number
  trend: number
}

interface LearningVelocityChartProps {
  data: VelocityDataPoint[]
  timeRange: '7d' | '30d' | '90d'
  onTimeRangeChange: (range: '7d' | '30d' | '90d') => void
  isLoading?: boolean
}

interface MetricToggle {
  key: keyof VelocityDataPoint
  label: string
  color: string
  enabled: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(label).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{date}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const TrendIndicator = ({ trend, value }: { trend: number; value: number }) => {
  const getTrendIcon = () => {
    if (trend > 0.1) return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
    if (trend < -0.1) return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
    return <MinusIcon className="w-4 h-4 text-gray-400" />
  }

  const getTrendColor = () => {
    if (trend > 0.1) return 'text-green-600'
    if (trend < -0.1) return 'text-red-600'
    return 'text-gray-500'
  }

  const getTrendText = () => {
    const percentage = Math.abs(trend * 100).toFixed(1)
    if (trend > 0.1) return `+${percentage}%`
    if (trend < -0.1) return `-${percentage}%`
    return 'Stable'
  }

  return (
    <div className="flex items-center space-x-1">
      {getTrendIcon()}
      <span className={`text-sm font-medium ${getTrendColor()}`}>
        {getTrendText()}
      </span>
    </div>
  )
}

export default function LearningVelocityChart({ 
  data, 
  timeRange, 
  onTimeRangeChange, 
  isLoading = false 
}: LearningVelocityChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<MetricToggle[]>([
    { key: 'tasksCompleted', label: 'Tasks Completed', color: '#3b82f6', enabled: true },
    { key: 'xpEarned', label: 'XP Earned', color: '#10b981', enabled: true },
    { key: 'timeSpent', label: 'Time Spent (min)', color: '#f59e0b', enabled: false },
    { key: 'efficiency', label: 'Efficiency Score', color: '#8b5cf6', enabled: false }
  ])

  const [chartType, setChartType] = useState<'line' | 'area'>('area')
  const [showTrend, setShowTrend] = useState(true)

  const toggleMetric = (key: keyof VelocityDataPoint) => {
    setActiveMetrics(prev => 
      prev.map(metric => 
        metric.key === key 
          ? { ...metric, enabled: !metric.enabled }
          : metric
      )
    )
  }

  const timeRanges = [
    { key: '7d' as const, label: '7 Days' },
    { key: '30d' as const, label: '30 Days' },
    { key: '90d' as const, label: '90 Days' }
  ]

  // Calculate summary statistics
  const summaryStats = data.length > 0 ? {
    avgTasksPerDay: (data.reduce((sum, d) => sum + d.tasksCompleted, 0) / data.length).toFixed(1),
    avgXPPerDay: (data.reduce((sum, d) => sum + d.xpEarned, 0) / data.length).toFixed(0),
    avgEfficiency: (data.reduce((sum, d) => sum + d.efficiency, 0) / data.length).toFixed(1),
    totalTasks: data.reduce((sum, d) => sum + d.tasksCompleted, 0),
    totalXP: data.reduce((sum, d) => sum + d.xpEarned, 0),
    overallTrend: data.length > 1 ? 
      (data[data.length - 1].tasksCompleted - data[0].tasksCompleted) / data[0].tasksCompleted : 0
  } : null

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Learning Velocity</h3>
          <div className="group relative">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Track your learning speed and consistency over time
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Chart Type Toggle */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'area'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {timeRanges.map(({ key, label }) => (
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

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600 font-medium">Avg Tasks/Day</div>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-blue-900">{summaryStats.avgTasksPerDay}</div>
              <TrendIndicator trend={summaryStats.overallTrend} value={parseFloat(summaryStats.avgTasksPerDay)} />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600 font-medium">Avg XP/Day</div>
            <div className="text-2xl font-bold text-green-900">{summaryStats.avgXPPerDay}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-purple-600 font-medium">Efficiency</div>
            <div className="text-2xl font-bold text-purple-900">{summaryStats.avgEfficiency}%</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-sm text-orange-600 font-medium">Total Progress</div>
            <div className="text-sm font-bold text-orange-900">
              {summaryStats.totalTasks} tasks • {summaryStats.totalXP} XP
            </div>
          </div>
        </div>
      )}

      {/* Metric Toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {activeMetrics.map((metric) => (
          <button
            key={metric.key}
            onClick={() => toggleMetric(metric.key)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              metric.enabled
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: metric.enabled ? 'white' : metric.color }}
            />
            <span>{metric.label}</span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data}>
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
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Brush 
                dataKey="date" 
                height={30} 
                stroke="#3b82f6"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              
              {activeMetrics.map((metric) => 
                metric.enabled && (
                  <Area
                    key={metric.key}
                    type="monotone"
                    dataKey={metric.key}
                    stroke={metric.color}
                    fill={metric.color}
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name={metric.label}
                  />
                )
              )}
              
              {showTrend && data.length > 1 && (
                <ReferenceLine 
                  segment={[
                    { x: data[0].date, y: data[0].tasksCompleted },
                    { x: data[data.length - 1].date, y: data[data.length - 1].tasksCompleted }
                  ]}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                />
              )}
            </AreaChart>
          ) : (
            <LineChart data={data}>
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
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Brush 
                dataKey="date" 
                height={30} 
                stroke="#3b82f6"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              
              {activeMetrics.map((metric) => 
                metric.enabled && (
                  <Line
                    key={metric.key}
                    type="monotone"
                    dataKey={metric.key}
                    stroke={metric.color}
                    strokeWidth={3}
                    dot={{ fill: metric.color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: metric.color, strokeWidth: 2 }}
                    name={metric.label}
                  />
                )
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showTrend}
              onChange={(e) => setShowTrend(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show trend line</span>
          </label>
        </div>
        
        <div className="text-xs text-gray-500">
          Drag the brush below the chart to zoom into specific time periods
        </div>
      </div>
    </Card>
  )
}