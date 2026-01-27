import api from './api'
import { DashboardStats, TodayTask, ProgressMetrics, TaskFilter, TaskSort } from '../types/dashboard'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

export class DashboardService {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly CACHE_TTL = 60000 // 1 minute
  private readonly MAX_RETRIES = 3
  private readonly INITIAL_RETRY_DELAY = 1000 // 1 second

  /**
   * Fetch with exponential backoff retry logic
   */
  private async fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(
            this.INITIAL_RETRY_DELAY * Math.pow(2, attempt),
            10000 // Max 10 seconds
          )
          
          console.log(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError!
  }

  /**
   * Get data from cache if available and not expired
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    
    if (!cached) {
      return null
    }
    
    const now = Date.now()
    if (now - cached.timestamp > this.CACHE_TTL) {
      // Cache expired
      this.cache.delete(key)
      return null
    }
    
    console.log(`Cache hit for ${key}`)
    return cached.data as T
  }

  /**
   * Set data in cache
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Clear all cache entries
   */
  public clearCache(): void {
    this.cache.clear()
    console.log('Dashboard cache cleared')
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const cacheKey = 'dashboard-stats'
    
    // Check cache first
    const cached = this.getFromCache<DashboardStats>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const data = await this.fetchWithRetry(async () => {
        const response = await api.get('/api/progress/dashboard-stats')
        return response.data as DashboardStats
      })
      
      // Cache successful response
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Failed to fetch dashboard stats after retries:', error)
      // Gracefully fall back to mock data
      return this.getMockDashboardStats()
    }
  }

  async getTodayTasks(): Promise<TodayTask[]> {
    const cacheKey = 'today-tasks'
    
    // Check cache first
    const cached = this.getFromCache<TodayTask[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const data = await this.fetchWithRetry(async () => {
        const response = await api.get('/api/tasks/today')
        return response.data as TodayTask[]
      })
      
      // Cache successful response
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Failed to fetch today tasks after retries:', error)
      return this.getMockTodayTasks()
    }
  }

  async getProgressMetrics(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<ProgressMetrics> {
    const cacheKey = `progress-metrics-${timeRange}`
    
    // Check cache first
    const cached = this.getFromCache<ProgressMetrics>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const data = await this.fetchWithRetry(async () => {
        const response = await api.get(`/api/analytics/progress-metrics?range=${timeRange}`)
        return response.data as ProgressMetrics
      })
      
      // Cache successful response
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Failed to fetch progress metrics after retries:', error)
      return this.getMockProgressMetrics()
    }
  }

  async updateTaskStatus(taskId: string, status: 'not_started' | 'in_progress' | 'completed'): Promise<void> {
    try {
      await this.fetchWithRetry(async () => {
        await api.patch(`/api/tasks/${taskId}/status`, { status })
      })
      
      // Invalidate related caches
      this.cache.delete('today-tasks')
      this.cache.delete('dashboard-stats')
    } catch (error) {
      console.error('Failed to update task status after retries:', error)
      throw error
    }
  }

  async getFilteredTasks(filter: TaskFilter, sort: TaskSort): Promise<TodayTask[]> {
    try {
      const data = await this.fetchWithRetry(async () => {
        const params = new URLSearchParams()
        if (filter.status && filter.status !== 'all') params.append('status', filter.status)
        if (filter.priority && filter.priority !== 'all') params.append('priority', filter.priority)
        if (filter.type && filter.type !== 'all') params.append('type', filter.type)
        if (filter.module) params.append('module', filter.module)
        params.append('sort_field', sort.field)
        params.append('sort_direction', sort.direction)

        const response = await api.get(`/api/tasks/filtered?${params.toString()}`)
        return response.data as TodayTask[]
      })
      
      return data
    } catch (error) {
      console.error('Failed to fetch filtered tasks after retries:', error)
      return this.getMockTodayTasks()
    }
  }

  // Mock data for development
  private getMockDashboardStats(): DashboardStats {
    // Check if user just completed onboarding (new user)
    const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true'
    const hasExistingProgress = localStorage.getItem('user_progress_started') === 'true'
    
    // For brand new users who just completed onboarding, show zeros
    if (onboardingCompleted && !hasExistingProgress) {
      return {
        currentStreak: 0,
        weeklyXP: 0,
        totalXP: 0,
        completedTasks: 0,
        totalTasks: 0,
        level: 1,
        nextLevelXP: 100,
        achievements: [],
        learningTimeHours: 0,
        successRate: 0,
        skillsLearned: 0
      }
    }
    
    // For returning users with progress, show mock data
    return {
      currentStreak: 7,
      weeklyXP: 1250,
      totalXP: 8750,
      completedTasks: 12,
      totalTasks: 20,
      level: 5,
      nextLevelXP: 1250,
      achievements: [
        {
          id: '1',
          title: 'First Steps',
          description: 'Complete your first exercise',
          icon: '🎯',
          unlockedAt: new Date('2024-01-15')
        },
        {
          id: '2',
          title: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: '🔥',
          unlockedAt: new Date('2024-01-20')
        },
        {
          id: '3',
          title: 'Code Master',
          description: 'Complete 50 exercises',
          icon: '👑',
          progress: 12,
          maxProgress: 50
        }
      ],
      learningTimeHours: 5.2,
      successRate: 92,
      skillsLearned: 8
    }
  }

  private getMockTodayTasks(): TodayTask[] {
    return [
      {
        id: '1',
        title: 'Complete React Hooks Exercise',
        description: 'Practice useState and useEffect hooks with interactive examples',
        type: 'exercise',
        priority: 'high',
        estimatedMinutes: 45,
        status: 'not_started',
        moduleId: 'react-fundamentals',
        moduleName: 'React Fundamentals'
      },
      {
        id: '2',
        title: 'Review TypeScript Basics',
        description: 'Strengthen understanding of type definitions and interfaces',
        type: 'reading',
        priority: 'medium',
        estimatedMinutes: 30,
        status: 'in_progress',
        moduleId: 'typescript-basics',
        moduleName: 'TypeScript Basics'
      },
      {
        id: '3',
        title: 'Build Todo App Component',
        description: 'Create a reusable todo list component with proper state management',
        type: 'project',
        priority: 'high',
        estimatedMinutes: 90,
        status: 'not_started',
        moduleId: 'react-projects',
        moduleName: 'React Projects',
        dueDate: new Date('2024-01-25')
      },
      {
        id: '4',
        title: 'JavaScript Array Methods Quiz',
        description: 'Test your knowledge of map, filter, reduce, and other array methods',
        type: 'quiz',
        priority: 'low',
        estimatedMinutes: 15,
        status: 'not_started',
        moduleId: 'javascript-advanced',
        moduleName: 'Advanced JavaScript'
      }
    ]
  }

  private getMockProgressMetrics(): ProgressMetrics {
    const today = new Date()
    const learningVelocity: ProgressMetrics['learningVelocity'] = []
    const activityHeatmap: ProgressMetrics['activityHeatmap'] = []
    
    // Generate mock data for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      learningVelocity.push({
        date: date.toISOString().split('T')[0],
        tasksCompleted: Math.floor(Math.random() * 5) + 1,
        xpEarned: Math.floor(Math.random() * 200) + 50
      })
      
      activityHeatmap.push({
        date: date.toISOString().split('T')[0],
        activity: Math.floor(Math.random() * 10)
      })
    }

    return {
      learningVelocity,
      activityHeatmap,
      performanceMetrics: {
        accuracy: 87,
        speed: 92,
        consistency: 78,
        retention: 85
      },
      knowledgeRetention: [
        { topic: 'React Hooks', retentionRate: 92, lastReviewed: new Date('2024-01-20') },
        { topic: 'TypeScript', retentionRate: 85, lastReviewed: new Date('2024-01-18') },
        { topic: 'JavaScript ES6', retentionRate: 78, lastReviewed: new Date('2024-01-15') },
        { topic: 'CSS Grid', retentionRate: 71, lastReviewed: new Date('2024-01-12') }
      ],
      weeklyProgress: [
        { week: 'Week 1', completed: 8, target: 10 },
        { week: 'Week 2', completed: 12, target: 10 },
        { week: 'Week 3', completed: 9, target: 10 },
        { week: 'Week 4', completed: 15, target: 12 }
      ]
    }
  }
}

export const dashboardService = new DashboardService()
