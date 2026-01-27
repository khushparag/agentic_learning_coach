// TypeScript types for learning path components

export interface LearningModule {
  id: string
  title: string
  description: string
  status: 'completed' | 'current' | 'upcoming' | 'locked'
  progress: number
  estimatedTimeMinutes: number
  difficultyLevel: number // 1-10
  prerequisites: string[]
  learningObjectives: string[]
  tasks: LearningTask[]
  resources: LearningResource[]
  order: number
  createdAt: string
  updatedAt: string
}

export interface LearningTask {
  id: string
  moduleId: string
  title: string
  description: string
  type: 'exercise' | 'reading' | 'project' | 'quiz' | 'video'
  status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTimeMinutes: number
  points: number
  order: number
  requirements: string[]
  resources: LearningResource[]
  submissions?: TaskSubmission[]
  createdAt: string
  updatedAt: string
}

export interface LearningResource {
  id: string
  title: string
  description: string
  type: 'documentation' | 'tutorial' | 'video' | 'article' | 'example' | 'reference'
  url: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTimeMinutes: number
  tags: string[]
  verified: boolean
  rating?: number
  createdAt: string
}

export interface TaskSubmission {
  id: string
  taskId: string
  userId: string
  code?: string
  answers?: Record<string, any>
  status: 'pending' | 'passed' | 'failed' | 'needs_review'
  score?: number
  feedback?: SubmissionFeedback
  submittedAt: string
  evaluatedAt?: string
}

export interface SubmissionFeedback {
  passed: boolean
  score: number
  issues: FeedbackIssue[]
  suggestions: string[]
  nextSteps: string[]
  executionTime?: number
  memoryUsed?: number
}

export interface FeedbackIssue {
  line?: number
  column?: number
  type: 'error' | 'warning' | 'suggestion'
  message: string
  code?: string
  fix?: string
}

export interface LearningPath {
  id: string
  userId: string
  title: string
  description: string
  status: 'draft' | 'active' | 'completed' | 'paused'
  totalModules: number
  completedModules: number
  estimatedHours: number
  modules: LearningModule[]
  createdAt: string
  updatedAt: string
}

export interface ProgressStats {
  totalTasks: number
  completedTasks: number
  totalPoints: number
  earnedPoints: number
  currentStreak: number
  longestStreak: number
  averageScore: number
  timeSpentMinutes: number
  lastActivityAt: string
}

export interface ModuleDependency {
  moduleId: string
  dependsOn: string[]
  unlocks: string[]
}

export interface LearningPathVisualization {
  modules: LearningModule[]
  dependencies: ModuleDependency[]
  currentModule?: string
  completionRate: number
  estimatedCompletion: string
}
