/**
 * Activity Heatmap - Visual representation of learning patterns over time
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  CalendarIcon, 
  FireIcon,
  InformationCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Card } from '../ui/Card'

interface ActivityData {
  date: string
  count: number
  level: number
  details?: {
    tasksCompleted: number
    xpEarned: number
    timeSpent: number
    topics: string[]
  }
}

interface ActivityHeatmapProps {
  data: ActivityData[]
  weeks?: number
  isLoading?: boolean
}

interface HeatmapStats {
  totalActivities: number
  averageDaily: number
  mostActiveDay: string
  longestStreak: number
  currentStreak: number
  consistencyScore: number
  weekdayVsWeekend: {
    weekday: number
    weekend: number
  }
}

const ActivityTooltip = ({ 
  activity, 
  isVisible, 
  position 
}: { 
  activity: ActivityData | null
  isVisible: boolean
  position: { x: number; y: number }
}) => {
  if (!isVisible || !activity) return null

  const date = new Date(activity.date)
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      }}
    >
      <div className="font-medium mb-1">{formattedDate}</div>
      <div className="space-y-1">
        <div>{activity.count} activities</div>
        {activity.details && (
          <>
            <div>{activity.details.tasksCompleted} tasks completed</div>
            <div>{activity.details.xpEarned} XP earned</div>
            <div>{activity.details.timeSpent} minutes studied</div>
            {activity.details.topics.length > 0 && (
              <div className="text-xs text-gray-300 mt-2">
                Topics: {activity.details.topics.join(', ')}
              </div>
            )}
          </>
        )}
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
    </motion.div>
  )
}

const getActivityColor = (level: number): string => {
  const colors = [
    'bg-gray-100 hover:bg-gray-200', // 0 activities
    'bg-green-100 hover:bg-green-200', // 1-2 activities
    'bg-green-200 hover:bg-green-300', // 3-4 activities
    'bg-green-300 hover:bg-green-400', // 5-6 activities
    'bg-green-400 hover:bg-green-500', // 7-8 activities
    'bg-green-500 hover:bg-green-600', // 9+ activities
  ]
  return colors[Math.min(level, colors.length - 1)]
}

const getActivityIntensity = (count: number): number => {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 6) return 3
  if (count <= 8) return 4
  return 5
}

export default function ActivityHeatmap({ 
  data, 
  weeks = 12, 
  isLoading = false 
}: ActivityHeatmapProps) {
  const [hoveredActivity, setHoveredActivity] = useState<ActivityData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '1y'>('3m')

  // Calculate statistics
  const stats: HeatmapStats = useMemo(() => {
    if (data.length === 0) {
      return {
        totalActivities: 0,
        averageDaily: 0,
        mostActiveDay: 'N/A',
        longestStreak: 0,
        currentStreak: 0,
        consistencyScore: 0,
        weekdayVsWeekend: { weekday: 0, weekend: 0 }
      }
    }

    const totalActivities = data.reduce((sum, d) => sum + d.count, 0)
    const averageDaily = totalActivities / data.length

    // Find most active day of week
    const dayOfWeekCounts: Record<string, number> = {}
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    let weekdayTotal = 0
    let weekendTotal = 0
    
    data.forEach(activity => {
      const date = new Date(activity.date)
      const dayOfWeek = dayNames[date.getDay()]
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + activity.count
      
      if (date.getDay() === 0 || date.getDay() === 6) {
        weekendTotal += activity.count
      } else {
        weekdayTotal += activity.count
      }
    })

    const mostActiveDay = Object.entries(dayOfWeekCounts).reduce(
      (max, [day, count]) => count > max.count ? { day, count } : max,
      { day: 'Monday', count: 0 }
    ).day

    // Calculate streaks
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    for (let i = 0; i < sortedData.length; i++) {
      if (sortedData[i].count > 0) {
        tempStreak++
        if (i === sortedData.length - 1) {
          currentStreak = tempStreak
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 0
        if (i === sortedData.length - 1) {
          currentStreak = 0
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    // Calculate consistency score
    const activeDays = data.filter(d => d.count > 0).length
    const consistencyScore = (activeDays / data.length) * 100

    return {
      totalActivities,
      averageDaily: Math.round(averageDaily * 10) / 10,
      mostActiveDay,
      longestStreak,
      currentStreak,
      consistencyScore: Math.round(consistencyScore),
      weekdayVsWeekend: {
        weekday: weekdayTotal,
        weekend: weekendTotal
      }
    }
  }, [data])

  // Organize data into weeks
  const weekData = useMemo(() => {
    const weeks: ActivityData[][] = []
    const daysPerWeek = 7
    
    // Pad data to start on Sunday
    const paddedData: ActivityData[] = [...data]
    if (paddedData.length > 0) {
      const firstDate = new Date(paddedData[0].date)
      const dayOfWeek = firstDate.getDay()
      
      for (let i = 0; i < dayOfWeek; i++) {
        const padDate = new Date(firstDate)
        padDate.setDate(padDate.getDate() - (dayOfWeek - i))
        paddedData.unshift({
          date: padDate.toISOString().split('T')[0],
          count: 0,
          level: 0
        })
      }
    }
    
    for (let i = 0; i < paddedData.length; i += daysPerWeek) {
      weeks.push(paddedData.slice(i, i + daysPerWeek))
    }
    
    return weeks
  }, [data])

  const handleMouseEnter = (activity: ActivityData, event: React.MouseEvent) => {
    setHoveredActivity(activity)
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY
    })
  }

  const handleMouseLeave = () => {
    setHoveredActivity(null)
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Heatmap</h3>
          <div className="group relative">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Visualize your learning patterns and consistency
            </div>
          </div>
        </div>

        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: '3m' as const, label: '3 Months' },
            { key: '6m' as const, label: '6 Months' },
            { key: '1y' as const, label: '1 Year' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedPeriod(key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-4 h-4 text-purple-600" />
            <div className="text-sm text-purple-600 font-medium">Total Activities</div>
          </div>
          <div className="text-2xl font-bold text-purple-900">{stats.totalActivities}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <FireIcon className="w-4 h-4 text-green-600" />
            <div className="text-sm text-green-600 font-medium">Current Streak</div>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.currentStreak} days</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-blue-600 font-medium">Consistency</div>
          <div className="text-2xl font-bold text-blue-900">{stats.consistencyScore}%</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-sm text-orange-600 font-medium">Most Active</div>
          <div className="text-lg font-bold text-orange-900">{stats.mostActiveDay}</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="space-y-4">
        {/* Day labels */}
        <div className="flex items-center space-x-1">
          <div className="w-12"></div> {/* Spacer for month labels */}
          <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 font-medium">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center w-4">{day}</div>
            ))}
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="space-y-1">
          {weekData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex items-center space-x-1">
              {/* Month label */}
              <div className="w-12 text-xs text-gray-500 text-right">
                {weekIndex % 4 === 0 && week[0] ? 
                  new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' }) : 
                  ''
                }
              </div>
              
              {/* Week days */}
              <div className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-4 h-4 rounded-sm cursor-pointer transition-all duration-200 ${
                      getActivityColor(getActivityIntensity(day.count))
                    } ${day.count === 0 ? 'border border-gray-200' : ''}`}
                    whileHover={{ scale: 1.2 }}
                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
          <span>Less</span>
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getActivityColor(level).split(' ')[0]}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Learning Patterns</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Average daily activities</div>
            <div className="font-semibold text-gray-900">{stats.averageDaily}</div>
          </div>
          <div>
            <div className="text-gray-600">Longest streak</div>
            <div className="font-semibold text-gray-900">{stats.longestStreak} days</div>
          </div>
          <div>
            <div className="text-gray-600">Weekday vs Weekend</div>
            <div className="font-semibold text-gray-900">
              {Math.round((stats.weekdayVsWeekend.weekday / (stats.weekdayVsWeekend.weekday + stats.weekdayVsWeekend.weekend)) * 100)}% weekdays
            </div>
          </div>
          <div>
            <div className="text-gray-600">Most productive day</div>
            <div className="font-semibold text-gray-900">{stats.mostActiveDay}</div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <ActivityTooltip
        activity={hoveredActivity}
        isVisible={!!hoveredActivity}
        position={tooltipPosition}
      />
    </Card>
  )
}
