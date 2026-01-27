// TypeScript types for onboarding components

export interface TimeConstraints {
  hoursPerWeek: number
  preferredTimes: string[]
  availableDays: string[]
  sessionLengthMinutes: number
}

export interface OnboardingData {
  goals: string[]
  techStack: string[]
  skillLevel: string
  timeConstraints: TimeConstraints
  preferences: {
    learningStyle: string
    difficulty: string
  }
}

export interface SkillAssessmentQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface SkillAssessmentResult {
  category: string
  score: number
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  recommendations: string[]
}

export interface TechStackOption {
  id: string
  name: string
  category: string
  description: string
  popularity: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites?: string[]
}

export interface GoalOption {
  id: string
  title: string
  description: string
  category: string
  estimatedHours: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites?: string[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface OnboardingStep {
  id: number
  title: string
  description: string
  component: string
  isValid: boolean
  isCompleted: boolean
}
