/**
 * Knowledge Retention Analysis - AI-powered retention tracking and review recommendations
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  AcademicCapIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  BookOpenIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface RetentionData {
  topic: string
  retentionScore: number
  lastPracticed: string
  reviewUrgency: 'none' | 'low' | 'medium' | 'high' | 'critical'
  recommendedReviewDate: string
  practiceCount: number
  masteryLevel: number
  forgettingCurve: Array<{
    days: number
    retention: number
  }>
}

interface ReviewSchedule {
  date: string
  topics: Array<{
    topic: string
    urgency: string
    estimatedMinutes: number
  }>
  totalMinutes: number
  priority: 'high' | 'medium' | 'low'
}

interface KnowledgeRetentionAnalysisProps {
  retentionData: RetentionData[]
  reviewSchedule: ReviewSchedule[]
  onScheduleReview: (topic: string) => void
  onStartReview: (topics: string[]) => void
  isLoading?: boolean
}

const urgencyColors = {
  none: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', dot: 'bg-green-500' },
  low: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  high: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-500' },
  critical: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' }
}

const urgencyLabels = {
  none: 'Up to Date',
  low: 'Review Soon',
  medium: 'Review Needed',
  high: 'Review Urgent',
  critical: 'Critical Review'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">{entry.value}%</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const RetentionChart = ({ data }: { data: RetentionData[] }) => {
  const chartData = data
    .sort((a, b) => a.retentionScore - b.retentionScore)
    .map(item => ({
      topic: item.topic.length > 15 ? `${item.topic.substring(0, 15)}...` : item.topic,
      fullTopic: item.topic,
      retentionScore: item.retentionScore,
      masteryLevel: item.masteryLevel,
      urgency: item.reviewUrgency
    }))

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={12} />
          <YAxis 
            type="category" 
            dataKey="topic" 
            stroke="#6b7280" 
            fontSize={12}
            width={120}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900 mb-2">{data.fullTopic}</p>
                    <div className="space-y-1 text-sm">
                      <div>Retention: {data.retentionScore}%</div>
                      <div>Mastery: {data.masteryLevel}%</div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${urgencyColors[data.urgency].dot}`} />
                        <span>{urgencyLabels[data.urgency]}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar 
            dataKey="retentionScore" 
            radius={[0, 4, 4, 0]}
            name="Retention Score"
          >
            {chartData.map((entry, index) => {
              const urgency = entry.urgency
              let color = '#10b981'
              if (urgency === 'critical') color = '#ef4444'
              else if (urgency === 'high') color = '#f97316'
              else if (urgency === 'medium') color = '#eab308'
              else if (urgency === 'low') color = '#3b82f6'
              return <Cell key={`cell-${index}`} fill={color} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const ForgettingCurveChart = ({ data }: { data: RetentionData }) => {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.forgettingCurve}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="days" 
            stroke="#6b7280" 
            fontSize={12}
            label={{ value: 'Days since last practice', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12}
            domain={[0, 100]}
            label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="retention"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.1}
            strokeWidth={2}
            name="Predicted Retention"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const RetentionDistribution = ({ data }: { data: RetentionData[] }) => {
  const distribution = useMemo(() => {
    const counts = { none: 0, low: 0, medium: 0, high: 0, critical: 0 }
    data.forEach(item => {
      counts[item.reviewUrgency]++
    })
    
    return Object.entries(counts).map(([urgency, count]) => ({
      name: urgencyLabels[urgency as keyof typeof urgencyLabels],
      value: count,
      color: urgencyColors[urgency as keyof typeof urgencyColors].dot.replace('bg-', '#').replace('-500', '')
    }))
  }, [data])

  const COLORS = distribution.map(d => d.color)

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={distribution}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {distribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

const ReviewScheduleCard = ({ 
  schedule, 
  onStartReview 
}: { 
  schedule: ReviewSchedule
  onStartReview: (topics: string[]) => void 
}) => {
  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50'
  }

  const date = new Date(schedule.date)
  const isToday = date.toDateString() === new Date().toDateString()
  const isPast = date < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 ${priorityColors[schedule.priority]} ${
        isToday ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900">
            {isToday ? 'Today' : date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
          {isPast && !isToday && (
            <span className="text-xs text-red-600 font-medium">Overdue</span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ClockIcon className="w-4 h-4" />
          <span>{schedule.totalMinutes} min</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {schedule.topics.map((topic, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${urgencyColors[topic.urgency as keyof typeof urgencyColors].dot}`} />
              <span className="text-gray-900">{topic.topic}</span>
            </div>
            <span className="text-gray-500">{topic.estimatedMinutes}m</span>
          </div>
        ))}
      </div>

      <Button
        onClick={() => onStartReview(schedule.topics.map(t => t.topic))}
        size="sm"
        variant={isToday || isPast ? 'primary' : 'secondary'}
        className="w-full"
      >
        {isToday || isPast ? 'Start Review Session' : 'Schedule Review'}
      </Button>
    </motion.div>
  )
}

const TopicDetailModal = ({ 
  topic, 
  isOpen, 
  onClose, 
  onScheduleReview 
}: {
  topic: RetentionData | null
  isOpen: boolean
  onClose: () => void
  onScheduleReview: (topic: string) => void
}) => {
  if (!isOpen || !topic) return null

  const urgencyStyle = urgencyColors[topic.reviewUrgency]
  const daysSinceLastPractice = Math.floor(
    (new Date().getTime() - new Date(topic.lastPracticed).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">{topic.topic}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`${urgencyStyle.bg} rounded-lg p-4 border ${urgencyStyle.border}`}>
              <div className="text-sm text-gray-600 font-medium">Retention Score</div>
              <div className="text-2xl font-bold text-gray-900">{topic.retentionScore}%</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 font-medium">Mastery Level</div>
              <div className="text-2xl font-bold text-gray-900">{topic.masteryLevel}%</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 font-medium">Practice Sessions</div>
              <div className="text-2xl font-bold text-gray-900">{topic.practiceCount}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 font-medium">Days Since Practice</div>
              <div className="text-2xl font-bold text-gray-900">{daysSinceLastPractice}</div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Forgetting Curve Prediction</h4>
            <ForgettingCurveChart data={topic} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${urgencyStyle.dot}`} />
              <span className={`font-medium ${urgencyStyle.text}`}>
                {urgencyLabels[topic.reviewUrgency]}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => {
                onScheduleReview(topic.topic)
                onClose()
              }}>
                Schedule Review
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function KnowledgeRetentionAnalysis({
  retentionData,
  reviewSchedule,
  onScheduleReview,
  onStartReview,
  isLoading = false
}: KnowledgeRetentionAnalysisProps) {
  const [selectedTopic, setSelectedTopic] = useState<RetentionData | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'schedule' | 'distribution'>('overview')

  const stats = useMemo(() => {
    const total = retentionData.length
    const needsReview = retentionData.filter(d => d.reviewUrgency !== 'none').length
    const critical = retentionData.filter(d => d.reviewUrgency === 'critical').length
    const avgRetention = total > 0 ? 
      retentionData.reduce((sum, d) => sum + d.retentionScore, 0) / total : 0

    return { total, needsReview, critical, avgRetention: Math.round(avgRetention) }
  }, [retentionData])

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <AcademicCapIcon className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Knowledge Retention Analysis</h3>
            <div className="group relative">
              <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                AI-powered analysis of knowledge retention and review recommendations
              </div>
            </div>
          </div>

          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'overview' as const, label: 'Overview' },
              { key: 'schedule' as const, label: 'Schedule' },
              { key: 'distribution' as const, label: 'Distribution' }
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
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpenIcon className="w-4 h-4 text-blue-600" />
              <div className="text-sm text-blue-600 font-medium">Total Topics</div>
            </div>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />
              <div className="text-sm text-orange-600 font-medium">Needs Review</div>
            </div>
            <div className="text-2xl font-bold text-orange-900">{stats.needsReview}</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowPathIcon className="w-4 h-4 text-red-600" />
              <div className="text-sm text-red-600 font-medium">Critical</div>
            </div>
            <div className="text-2xl font-bold text-red-900">{stats.critical}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <div className="text-sm text-green-600 font-medium">Avg Retention</div>
            </div>
            <div className="text-2xl font-bold text-green-900">{stats.avgRetention}%</div>
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'overview' && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Retention by Topic</h4>
            <RetentionChart data={retentionData} />
          </div>
        )}

        {activeView === 'schedule' && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Review Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviewSchedule.map((schedule, index) => (
                <ReviewScheduleCard
                  key={index}
                  schedule={schedule}
                  onStartReview={onStartReview}
                />
              ))}
            </div>
          </div>
        )}

        {activeView === 'distribution' && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Review Urgency Distribution</h4>
            <RetentionDistribution data={retentionData} />
          </div>
        )}
      </Card>

      <TopicDetailModal
        topic={selectedTopic}
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        onScheduleReview={onScheduleReview}
      />
    </>
  )
}