/**
 * Learning Session Hook - Manages active learning sessions with real-time tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTasksWithUtils, useTaskManagement } from './useTasks'
import { useSubmissionsWithUtils, useSubmissionWorkflow } from './useSubmissions'
import { useProgressTracker } from './useProgress'
import { useAutoXPAward } from './useGamification'

interface LearningSessionState {
  isActive: boolean
  currentTaskId: string | null
  startTime: Date | null
  timeSpent: number // in seconds
  tasksCompleted: number
  submissionsCount: number
  lastActivity: Date | null
}

interface SessionStats {
  duration: number // in minutes
  tasksCompleted: number
  submissionsCount: number
  averageTimePerTask: number
  xpEarned: number
  efficiency: number // tasks per hour
}

/**
 * Hook for managing learning sessions with automatic tracking
 */
export function useLearningSession(userId: string | null) {
  const [sessionState, setSessionState] = useState<LearningSessionState>({
    isActive: false,
    currentTaskId: null,
    startTime: null,
    timeSpent: 0,
    tasksCompleted: 0,
    submissionsCount: 0,
    lastActivity: null,
  })

  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Hooks for session management
  const tasks = useTasksWithUtils()
  const taskManagement = useTaskManagement()
  const submissions = useSubmissionsWithUtils()
  const submissionWorkflow = useSubmissionWorkflow()
  const progressTracker = useProgressTracker()
  const autoXPAward = useAutoXPAward(userId)

  // Start a learning session
  const startSession = useCallback((taskId?: string) => {
    const now = new Date()
    
    setSessionState({
      isActive: true,
      currentTaskId: taskId || null,
      startTime: now,
      timeSpent: 0,
      tasksCompleted: 0,
      submissionsCount: 0,
      lastActivity: now,
    })

    // Start time tracking
    intervalRef.current = setInterval(() => {
      setSessionState(prev => ({
        ...prev,
        timeSpent: prev.startTime ? Math.floor((Date.now() - prev.startTime.getTime()) / 1000) : 0,
      }))
    }, 1000)

    console.log('Learning session started', { taskId, startTime: now })
  }, [])

  // End the learning session
  const endSession = useCallback(() => {
    if (!sessionState.isActive || !sessionState.startTime) return

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - sessionState.startTime.getTime()) / 1000 / 60) // minutes

    // Calculate session statistics
    const stats: SessionStats = {
      duration,
      tasksCompleted: sessionState.tasksCompleted,
      submissionsCount: sessionState.submissionsCount,
      averageTimePerTask: sessionState.tasksCompleted > 0 ? duration / sessionState.tasksCompleted : 0,
      xpEarned: sessionState.tasksCompleted * 50 + sessionState.submissionsCount * 25, // Estimated
      efficiency: duration > 0 ? (sessionState.tasksCompleted / duration) * 60 : 0, // tasks per hour
    }

    setSessionStats(stats)
    
    // Clear intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current)
      activityTimeoutRef.current = null
    }

    // Reset session state
    setSessionState({
      isActive: false,
      currentTaskId: null,
      startTime: null,
      timeSpent: 0,
      tasksCompleted: 0,
      submissionsCount: 0,
      lastActivity: null,
    })

    console.log('Learning session ended', { duration, stats })
  }, [sessionState])

  // Switch to a different task
  const switchTask = useCallback((taskId: string) => {
    if (!sessionState.isActive) {
      startSession(taskId)
      return
    }

    setSessionState(prev => ({
      ...prev,
      currentTaskId: taskId,
      lastActivity: new Date(),
    }))

    console.log('Switched to task', { taskId })
  }, [sessionState.isActive, startSession])

  // Track task completion
  const completeTask = useCallback((taskId: string, score?: number) => {
    if (!sessionState.isActive) return

    // Update session state
    setSessionState(prev => ({
      ...prev,
      tasksCompleted: prev.tasksCompleted + 1,
      lastActivity: new Date(),
    }))

    // Track progress
    const timeSpentMinutes = Math.floor(sessionState.timeSpent / 60)
    progressTracker.trackTaskCompletion(taskId, timeSpentMinutes)

    // Mark task as completed
    taskManagement.markTaskCompleted(taskId)

    // Award XP
    autoXPAward.awardForTaskCompletion(score)

    console.log('Task completed in session', { taskId, score, timeSpentMinutes })
  }, [sessionState, progressTracker, taskManagement, autoXPAward])

  // Track code submission
  const trackSubmission = useCallback((taskId: string, code: string, language: string) => {
    if (!sessionState.isActive) return

    // Update session state
    setSessionState(prev => ({
      ...prev,
      submissionsCount: prev.submissionsCount + 1,
      lastActivity: new Date(),
    }))

    // Submit code with session context
    return submissionWorkflow.submitWithWorkflow(
      { task_id: taskId, code, language },
      {
        onSubmissionSuccess: (result) => {
          if (result.passed) {
            completeTask(taskId, result.score)
          }
        },
      }
    )
  }, [sessionState.isActive, submissionWorkflow, completeTask])

  // Track user activity
  const trackActivity = useCallback(() => {
    if (!sessionState.isActive) return

    setSessionState(prev => ({
      ...prev,
      lastActivity: new Date(),
    }))

    // Reset inactivity timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current)
    }

    // Auto-pause after 30 minutes of inactivity
    activityTimeoutRef.current = setTimeout(() => {
      console.log('Session paused due to inactivity')
      // Could implement pause functionality here
    }, 30 * 60 * 1000) // 30 minutes
  }, [sessionState.isActive])

  // Pause/resume session
  const pauseSession = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setSessionState(prev => ({ ...prev, isActive: false }))
  }, [])

  const resumeSession = useCallback(() => {
    if (!sessionState.startTime) return

    setSessionState(prev => ({ ...prev, isActive: true }))
    
    intervalRef.current = setInterval(() => {
      setSessionState(prev => ({
        ...prev,
        timeSpent: prev.startTime ? Math.floor((Date.now() - prev.startTime.getTime()) / 1000) : 0,
      }))
    }, 1000)
  }, [sessionState.startTime])

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Get session insights
  const getSessionInsights = useCallback(() => {
    if (!sessionState.isActive || !sessionState.startTime) return null

    const currentDuration = sessionState.timeSpent / 60 // minutes
    const tasksPerHour = currentDuration > 0 ? (sessionState.tasksCompleted / currentDuration) * 60 : 0
    const submissionsPerTask = sessionState.tasksCompleted > 0 ? sessionState.submissionsCount / sessionState.tasksCompleted : 0

    return {
      duration: currentDuration,
      tasksPerHour,
      submissionsPerTask,
      efficiency: tasksPerHour > 2 ? 'high' : tasksPerHour > 1 ? 'medium' : 'low',
      focus: submissionsPerTask < 2 ? 'high' : submissionsPerTask < 4 ? 'medium' : 'low',
      recommendations: (() => {
        const recommendations: string[] = []
        
        if (currentDuration > 90) {
          recommendations.push('Consider taking a break - you\'ve been learning for over 90 minutes')
        }
        
        if (submissionsPerTask > 5) {
          recommendations.push('Try reading the instructions more carefully before coding')
        }
        
        if (tasksPerHour < 0.5 && currentDuration > 30) {
          recommendations.push('Consider asking for hints or reviewing the concepts')
        }
        
        return recommendations
      })(),
    }
  }, [sessionState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
    }
  }, [])

  return {
    // Session state
    sessionState,
    sessionStats,
    
    // Session controls
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    switchTask,
    
    // Activity tracking
    completeTask,
    trackSubmission,
    trackActivity,
    
    // Utilities
    formatTime: (seconds?: number) => formatTime(seconds ?? sessionState.timeSpent),
    getSessionInsights,
    
    // Computed properties
    isActive: sessionState.isActive,
    currentTaskId: sessionState.currentTaskId,
    timeSpent: sessionState.timeSpent,
    formattedTime: formatTime(sessionState.timeSpent),
    tasksCompleted: sessionState.tasksCompleted,
    submissionsCount: sessionState.submissionsCount,
    
    // Session insights
    insights: getSessionInsights(),
    
    // Integration with other hooks
    isSubmitting: submissions.isSubmitting || submissionWorkflow.isSubmitting,
    isTrackingProgress: progressTracker.isTracking,
    isAwardingXP: autoXPAward.isAwarding,
  }
}
