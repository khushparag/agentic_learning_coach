import { useState, useEffect, useCallback } from 'react'
import { LearningPath, LearningModule, ProgressStats, LearningPathVisualization } from '../types/learning-path'
import { learningPathService } from '../services/learningPathService'
import { useProgressWebSocket, ProgressWebSocketMessage } from './useProgressWebSocket'

interface UseLearningPathReturn {
  learningPath: LearningPath | null
  modules: LearningModule[]
  progressStats: ProgressStats | null
  visualization: LearningPathVisualization | null
  selectedModule: LearningModule | null
  expandedModules: Set<string>
  loading: boolean
  error: string | null
  isConnected: boolean
  lastUpdated: Date | null
  
  // Actions
  selectModule: (module: LearningModule | null) => void
  toggleModuleExpansion: (moduleId: string) => void
  startTask: (taskId: string) => Promise<void>
  completeTask: (taskId: string) => Promise<void>
  submitTask: (taskId: string, submission: { code?: string; answers?: Record<string, any> }) => Promise<void>
  refreshData: () => Promise<void>
  syncProgress: () => Promise<void>
}

export const useLearningPath = (userId?: string): UseLearningPathReturn => {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [modules, setModules] = useState<LearningModule[]>([])
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null)
  const [visualization, setVisualization] = useState<LearningPathVisualization | null>(null)
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // WebSocket integration for real-time updates
  const { isConnected, sendMessage } = useProgressWebSocket({
    userId,
    enabled: !!userId,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('Learning path WebSocket connected')
    },
    onDisconnect: () => {
      console.log('Learning path WebSocket disconnected')
    }
  })

  // Handle WebSocket messages
  function handleWebSocketMessage(message: ProgressWebSocketMessage) {
    console.log('Received learning path update:', message)

    switch (message.type) {
      case 'progress_update':
        // Update local progress without full reload
        if (message.data.moduleId) {
          setModules(prevModules => 
            prevModules.map(module => 
              module.id === message.data.moduleId 
                ? { ...module, progress: message.data.progress || module.progress }
                : module
            )
          )
        }
        setLastUpdated(new Date())
        break

      case 'task_completed':
        // Update task status
        setModules(prevModules => 
          prevModules.map(module => ({
            ...module,
            tasks: module.tasks.map(task => 
              task.id === message.data.taskId 
                ? { ...task, status: 'completed' as const }
                : task
            )
          }))
        )
        // Refresh progress stats
        loadLearningPath(false)
        break

      case 'module_completed':
        // Update module status
        setModules(prevModules => 
          prevModules.map(module => 
            module.id === message.data.moduleId 
              ? { ...module, status: 'completed' as const, progress: 100 }
              : module
          )
        )
        break

      case 'achievement_unlocked':
        // Show achievement notification (handled by parent component)
        setLastUpdated(new Date())
        break

      case 'streak_updated':
        // Update streak information
        if (progressStats && message.data.streak !== undefined) {
          setProgressStats(prev => prev ? {
            ...prev,
            currentStreak: message.data.streak as number
          } : null)
        }
        break

      default:
        console.warn('Unknown WebSocket message type:', message.type)
    }
  }

  const loadLearningPath = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      setError(null)

      // Load learning path with enhanced error handling
      const pathData = await learningPathService.getLearningPath(userId)
      setLearningPath(pathData)

      // Load modules if we have a curriculum
      if (pathData?.id) {
        const [modulesData, statsData, vizData] = await Promise.allSettled([
          learningPathService.getModules(pathData.id),
          learningPathService.getProgressStats(userId),
          learningPathService.getLearningPathVisualization(pathData.id)
        ])

        // Handle modules data
        if (modulesData.status === 'fulfilled') {
          setModules(modulesData.value)
          
          // Auto-select current module
          const currentModule = modulesData.value.find(m => m.status === 'current')
          if (currentModule && !selectedModule) {
            setSelectedModule(currentModule)
            setExpandedModules(prev => new Set([...prev, currentModule.id]))
          }
        } else {
          console.error('Failed to load modules:', modulesData.reason)
        }

        // Handle progress stats
        if (statsData.status === 'fulfilled') {
          setProgressStats(statsData.value)
        } else {
          console.error('Failed to load progress stats:', statsData.reason)
        }

        // Handle visualization data (optional)
        if (vizData.status === 'fulfilled') {
          setVisualization(vizData.value)
        } else {
          console.warn('Visualization data not available:', vizData.reason)
        }
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load learning path:', err)
      setError(err instanceof Error ? err.message : 'Failed to load learning path')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [userId, selectedModule])

  const selectModule = useCallback((module: LearningModule | null) => {
    setSelectedModule(module)
  }, [])

  const toggleModuleExpansion = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }, [])

  const startTask = useCallback(async (taskId: string) => {
    try {
      await learningPathService.startTask(taskId)
      
      // Update local state optimistically
      setModules(prevModules => 
        prevModules.map(module => ({
          ...module,
          tasks: module.tasks.map(task => 
            task.id === taskId 
              ? { ...task, status: 'in_progress' as const }
              : task
          )
        }))
      )
      
      // Send WebSocket update
      sendMessage({
        type: 'task_started',
        data: { taskId }
      })
    } catch (err) {
      console.error('Failed to start task:', err)
      throw err
    }
  }, [sendMessage])

  const completeTask = useCallback(async (taskId: string) => {
    try {
      await learningPathService.completeTask(taskId)
      
      // Update local state
      setModules(prevModules => 
        prevModules.map(module => ({
          ...module,
          tasks: module.tasks.map(task => 
            task.id === taskId 
              ? { ...task, status: 'completed' as const }
              : task
          )
        }))
      )
      
      // Refresh progress stats
      const updatedStats = await learningPathService.getProgressStats(userId)
      setProgressStats(updatedStats)
      
      // Recalculate module progress
      setModules(prevModules => 
        prevModules.map(module => {
          const completedTasks = module.tasks.filter(t => 
            t.id === taskId ? true : t.status === 'completed'
          ).length
          const progress = module.tasks.length > 0 
            ? Math.round((completedTasks / module.tasks.length) * 100)
            : 0
          
          return { ...module, progress }
        })
      )
    } catch (err) {
      console.error('Failed to complete task:', err)
      throw err
    }
  }, [userId])

  const submitTask = useCallback(async (
    taskId: string, 
    submission: { code?: string; answers?: Record<string, any> }
  ) => {
    try {
      await learningPathService.submitTask(taskId, submission)
      
      // Refresh data to get updated submission status
      await loadLearningPath(false)
    } catch (err) {
      console.error('Failed to submit task:', err)
      throw err
    }
  }, [loadLearningPath])

  const refreshData = useCallback(async () => {
    await loadLearningPath(true)
  }, [loadLearningPath])

  const syncProgress = useCallback(async () => {
    try {
      await learningPathService.syncProgress(userId)
      await loadLearningPath(false)
    } catch (err) {
      console.error('Failed to sync progress:', err)
      throw err
    }
  }, [userId, loadLearningPath])

  // Load data on mount
  useEffect(() => {
    loadLearningPath()
  }, [loadLearningPath])

  return {
    learningPath,
    modules,
    progressStats,
    visualization,
    selectedModule,
    expandedModules,
    loading,
    error,
    isConnected,
    lastUpdated,
    
    selectModule,
    toggleModuleExpansion,
    startTask,
    completeTask,
    submitTask,
    refreshData,
    syncProgress
  }
}