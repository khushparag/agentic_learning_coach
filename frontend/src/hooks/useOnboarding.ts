import { useState, useCallback } from 'react'
import { OnboardingData, ValidationError } from '../types/onboarding'
import { onboardingService } from '../services/onboardingService'

export function useOnboarding() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  const clearErrors = useCallback(() => {
    setError(null)
    setValidationErrors([])
  }, [])

  const validateStep = useCallback((stepNumber: number, data: Partial<OnboardingData>) => {
    const errors: ValidationError[] = []

    switch (stepNumber) {
      case 1: // Goals
        if (!data.goals || data.goals.length === 0) {
          errors.push({ field: 'goals', message: 'Please select at least one learning goal' })
        }
        break
      
      case 2: // Tech Stack
        if (!data.techStack || data.techStack.length === 0) {
          errors.push({ field: 'techStack', message: 'Please select at least one technology' })
        }
        break
      
      case 3: // Skill Level
        if (!data.skillLevel) {
          errors.push({ field: 'skillLevel', message: 'Please select your skill level' })
        }
        break
      
      case 4: // Time Constraints
        if (!data.timeConstraints?.hoursPerWeek || data.timeConstraints.hoursPerWeek < 1) {
          errors.push({ field: 'hoursPerWeek', message: 'Please specify hours per week' })
        }
        if (!data.timeConstraints?.availableDays || data.timeConstraints.availableDays.length === 0) {
          errors.push({ field: 'availableDays', message: 'Please select at least one available day' })
        }
        break
      
      case 5: // Preferences
        if (!data.preferences?.learningStyle) {
          errors.push({ field: 'learningStyle', message: 'Please select your learning style' })
        }
        break
    }

    setValidationErrors(errors)
    return errors.length === 0
  }, [])

  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    setLoading(true)
    clearErrors()

    try {
      // Final validation
      const validation = onboardingService.validateOnboardingData(data)
      if (!validation.isValid) {
        setValidationErrors(validation.errors.map(error => ({ field: 'general', message: error })))
        return { success: false, error: 'Please complete all required fields' }
      }

      // Step 1: Set goals and constraints
      const goalsResponse = await onboardingService.setGoals({
        goals: data.goals,
        time_constraints: {
          hours_per_week: data.timeConstraints.hoursPerWeek,
          preferred_times: data.timeConstraints.preferredTimes,
          available_days: data.timeConstraints.availableDays,
          session_length_minutes: data.timeConstraints.sessionLengthMinutes,
        },
        skill_level: data.skillLevel,
        preferences: {
          learning_style: data.preferences.learningStyle,
          difficulty: data.preferences.difficulty,
          tech_stack: data.techStack,
        }
      })

      // Step 2: Create curriculum
      const curriculumResponse = await onboardingService.createCurriculum({
        goals: data.goals,
        time_constraints: {
          hours_per_week: data.timeConstraints.hoursPerWeek,
          preferred_times: data.timeConstraints.preferredTimes,
          available_days: data.timeConstraints.availableDays,
          session_length_minutes: data.timeConstraints.sessionLengthMinutes,
        },
        preferences: {
          learning_style: data.preferences.learningStyle,
          difficulty: data.preferences.difficulty,
          tech_stack: data.techStack,
        },
        skill_level: data.skillLevel
      })

      // Step 3: Activate curriculum
      await onboardingService.activateCurriculum(curriculumResponse.id)

      // Store completion data
      localStorage.setItem('onboarding_completed', 'true')
      localStorage.setItem('user_goals', JSON.stringify(data.goals))
      localStorage.setItem('user_skill_level', data.skillLevel)

      return { 
        success: true, 
        curriculum: curriculumResponse,
        goals: goalsResponse 
      }

    } catch (error: any) {
      console.error('Onboarding completion failed:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to complete onboarding. Please try again.'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [clearErrors])

  return {
    loading,
    error,
    validationErrors,
    clearErrors,
    validateStep,
    completeOnboarding
  }
}
