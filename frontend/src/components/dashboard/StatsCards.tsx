import { motion } from 'framer-motion'
import { 
  FireIcon, 
  StarIcon, 
  BookOpenIcon, 
  TrophyIcon,
  ChartBarIcon,
  ClockIcon,
  BoltIcon,
  AcademicCapIcon
} from '@heroicons/react/24/solid'
import { DashboardStats } from '../../types/dashboard'

interface StatsCardsProps {
  stats: DashboardStats
  isLoading?: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
}

function StatCard({ title, value, subtitle, icon: Icon, color, trend, onClick }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Icon and trend row */}
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('-500', '-100')} border ${color.replace('text-', 'border-').replace('-500', '-200')}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          {trend && (
            <div className={`text-xs font-medium flex items-center ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <svg 
                className={`w-3 h-3 ml-0.5 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Title */}
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
        
        {/* Value */}
        <p className="text-xl font-bold text-gray-900 mb-1">{value}</p>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-gray-500 truncate" title={subtitle}>{subtitle}</p>
        )}
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded w-10"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-12 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  // Safe calculations with fallback to 0 when dividing by zero
  const progressPercentage = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0
  const levelProgress = stats.nextLevelXP > 0 
    ? Math.round((stats.weeklyXP / stats.nextLevelXP) * 100) 
    : 0
  const achievementProgress = stats.achievements && stats.achievements.length > 0 
    ? Math.round((stats.achievements.filter(a => a.unlockedAt).length / stats.achievements.length) * 100) 
    : 0

  const handleStatClick = (statType: string) => {
    // Navigate to relevant page or show detailed view
    switch (statType) {
      case 'streak':
        console.log('Navigate to streak details')
        break
      case 'xp':
        console.log('Navigate to XP breakdown')
        break
      case 'progress':
        console.log('Navigate to progress details')
        break
      case 'achievements':
        window.location.href = '/achievements'
        break
      default:
        break
    }
  }

  // Safe value accessors
  const safeCurrentStreak = stats.currentStreak ?? 0
  const safeWeeklyXP = stats.weeklyXP ?? 0
  const safeTotalXP = stats.totalXP ?? 0
  const safeLevel = stats.level ?? 1
  const safeCompletedTasks = stats.completedTasks ?? 0
  const safeTotalTasks = stats.totalTasks ?? 0
  const safeAchievements = stats.achievements ?? []
  const unlockedAchievements = safeAchievements.filter(a => a.unlockedAt).length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      <StatCard
        title="Current Streak"
        value={safeCurrentStreak}
        subtitle={`${safeCurrentStreak === 1 ? 'day' : 'days'}`}
        icon={FireIcon}
        color="text-orange-500"
        trend={safeCurrentStreak > 0 ? { value: 12, isPositive: true } : undefined}
        onClick={() => handleStatClick('streak')}
      />
      
      <StatCard
        title="Weekly XP"
        value={safeWeeklyXP.toLocaleString()}
        subtitle={`Level ${safeLevel}`}
        icon={StarIcon}
        color="text-yellow-500"
        trend={safeWeeklyXP > 0 ? { value: 8, isPositive: true } : undefined}
        onClick={() => handleStatClick('xp')}
      />
      
      <StatCard
        title="Progress"
        value={`${progressPercentage}%`}
        subtitle={`${safeCompletedTasks}/${safeTotalTasks} tasks`}
        icon={BookOpenIcon}
        color="text-blue-500"
        onClick={() => handleStatClick('progress')}
      />
      
      <StatCard
        title="Achievements"
        value={unlockedAchievements}
        subtitle={`${achievementProgress}% unlocked`}
        icon={TrophyIcon}
        color="text-purple-500"
        onClick={() => handleStatClick('achievements')}
      />
      
      <StatCard
        title="Total XP"
        value={safeTotalXP.toLocaleString()}
        subtitle={`${levelProgress}% to next level`}
        icon={ChartBarIcon}
        color="text-green-500"
        onClick={() => handleStatClick('xp')}
      />
      
      <StatCard
        title="This Week"
        value={stats.learningTimeHours ? `${stats.learningTimeHours}h` : '0h'}
        subtitle="Learning time"
        icon={ClockIcon}
        color="text-indigo-500"
        trend={stats.learningTimeHours && stats.learningTimeHours > 0 ? { value: 15, isPositive: true } : undefined}
      />

      <StatCard
        title="Efficiency"
        value={stats.successRate ? `${stats.successRate}%` : '0%'}
        subtitle="Success rate"
        icon={BoltIcon}
        color="text-emerald-500"
        trend={stats.successRate && stats.successRate > 0 ? { value: 5, isPositive: true } : undefined}
      />

      <StatCard
        title="Skills"
        value={stats.skillsLearned ?? 0}
        subtitle="Areas learned"
        icon={AcademicCapIcon}
        color="text-rose-500"
        trend={stats.skillsLearned && stats.skillsLearned > 0 ? { value: 2, isPositive: true } : undefined}
      />
    </div>
  )
}