export interface DashboardStats {
  currentStreak: number
  weeklyXP: number
  totalXP: number
  completedTasks: number
  totalTasks: number
  level: number
  nextLevelXP: number
  achievements: Achievement[]
  // Additional stats for new users
  learningTimeHours?: number
  successRate?: number
  skillsLearned?: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
}

export interface TodayTask {
  id: string
  title: string
  description: string
  type: 'exercise' | 'reading' | 'project' | 'quiz'
  priority: 'low' | 'medium' | 'high'
  estimatedMinutes: number
  status: 'not_started' | 'in_progress' | 'completed'
  moduleId: string
  moduleName: string
  dueDate?: Date
}

export interface ProgressMetrics {
  learningVelocity: {
    date: string
    tasksCompleted: number
    xpEarned: number
  }[]
  activityHeatmap: {
    date: string
    activity: number
  }[]
  performanceMetrics: {
    accuracy: number
    speed: number
    consistency: number
    retention: number
  }
  knowledgeRetention: {
    topic: string
    retentionRate: number
    lastReviewed: Date
  }[]
  weeklyProgress: {
    week: string
    completed: number
    target: number
  }[]
}

export interface TaskFilter {
  status?: 'all' | 'not_started' | 'in_progress' | 'completed'
  priority?: 'all' | 'low' | 'medium' | 'high'
  type?: 'all' | 'exercise' | 'reading' | 'project' | 'quiz'
  module?: string
}

export interface TaskSort {
  field: 'priority' | 'dueDate' | 'estimatedMinutes' | 'title' | 'status' | 'type'
  direction: 'asc' | 'desc'
}

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  action: () => void
  color: string
}