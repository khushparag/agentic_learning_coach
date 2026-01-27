import api from './api'
import { OnboardingData, SkillAssessmentQuestion, SkillAssessmentResult, TechStackOption, GoalOption } from '../types/onboarding'

export interface SetGoalsRequest {
  goals: string[]
  time_constraints: {
    hours_per_week: number
    preferred_times: string[]
    available_days: string[]
    session_length_minutes: number
  }
  skill_level?: string
  preferences: Record<string, any>
}

export interface SetGoalsResponse {
  success: boolean
  user_id: string
  goals: string[]
  goal_categories: Record<string, string[]>
  time_constraints: {
    hours_per_week: number
    preferred_times: string[]
    available_days: string[]
    session_length_minutes: number
  }
  estimated_timeline: {
    total_estimated_hours: number
    hours_per_goal: number
    estimated_weeks: number
    estimated_days: number
  }
  next_steps: string[]
  created_at: string
}

export interface CreateCurriculumRequest {
  goals: string[]
  time_constraints?: Record<string, any>
  preferences: Record<string, any>
  skill_level?: string
}

export interface CurriculumResponse {
  id: string
  user_id: string
  title: string
  goal_description: string
  status: string
  total_days: number
  estimated_hours?: number
  modules: any[]
  modules_completed: number
  total_modules: number
  overall_progress: number
  current_module_index: number
  created_at: string
  updated_at?: string
}

// Helper to generate mock curriculum based on goals
function generateMockCurriculum(data: CreateCurriculumRequest): CurriculumResponse {
  const userId = sessionStorage.getItem('demo_user_id') || 'demo-user-' + Math.random().toString(36).substring(2, 11)
  const curriculumId = 'curriculum-' + Math.random().toString(36).substring(2, 11)
  
  // Generate modules based on selected goals
  const modules = data.goals.map((goal, index) => ({
    id: `module-${index + 1}`,
    title: `Module ${index + 1}: ${goal}`,
    description: `Learn the fundamentals and advanced concepts of ${goal}`,
    order: index + 1,
    status: index === 0 ? 'in_progress' : 'locked',
    progress: 0,
    estimated_hours: 8,
    tasks: [
      {
        id: `task-${index}-1`,
        title: `Introduction to ${goal}`,
        type: 'lesson',
        status: 'pending',
        estimated_minutes: 30
      },
      {
        id: `task-${index}-2`,
        title: `${goal} Fundamentals`,
        type: 'exercise',
        status: 'pending',
        estimated_minutes: 45
      },
      {
        id: `task-${index}-3`,
        title: `Practice: ${goal} Basics`,
        type: 'coding',
        status: 'pending',
        estimated_minutes: 60
      }
    ]
  }))

  const hoursPerWeek = (data.time_constraints as any)?.hours_per_week || 5
  const totalHours = modules.length * 8
  const totalDays = Math.ceil((totalHours / hoursPerWeek) * 7)

  return {
    id: curriculumId,
    user_id: userId,
    title: `Personalized Learning Path: ${data.goals.slice(0, 2).join(' & ')}${data.goals.length > 2 ? ' and more' : ''}`,
    goal_description: `Master ${data.goals.join(', ')} through hands-on practice and guided exercises`,
    status: 'active',
    total_days: totalDays,
    estimated_hours: totalHours,
    modules: modules,
    modules_completed: 0,
    total_modules: modules.length,
    overall_progress: 0,
    current_module_index: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Helper to generate mock goals response
function generateMockGoalsResponse(data: SetGoalsRequest): SetGoalsResponse {
  const userId = sessionStorage.getItem('demo_user_id') || 'demo-user-' + Math.random().toString(36).substring(2, 11)
  
  // Group goals by category
  const goalCategories: Record<string, string[]> = {}
  data.goals.forEach(goal => {
    const category = goal.toLowerCase().includes('react') || goal.toLowerCase().includes('vue') || goal.toLowerCase().includes('angular') 
      ? 'frontend'
      : goal.toLowerCase().includes('node') || goal.toLowerCase().includes('python') || goal.toLowerCase().includes('java')
        ? 'backend'
        : goal.toLowerCase().includes('docker') || goal.toLowerCase().includes('kubernetes')
          ? 'devops'
          : 'general'
    
    if (!goalCategories[category]) {
      goalCategories[category] = []
    }
    goalCategories[category].push(goal)
  })

  const hoursPerGoal = 8
  const totalHours = data.goals.length * hoursPerGoal
  const estimatedWeeks = Math.ceil(totalHours / data.time_constraints.hours_per_week)

  return {
    success: true,
    user_id: userId,
    goals: data.goals,
    goal_categories: goalCategories,
    time_constraints: data.time_constraints,
    estimated_timeline: {
      total_estimated_hours: totalHours,
      hours_per_goal: hoursPerGoal,
      estimated_weeks: estimatedWeeks,
      estimated_days: estimatedWeeks * 7
    },
    next_steps: [
      'Review your personalized curriculum',
      'Start with the first module',
      'Complete daily exercises to build momentum',
      'Track your progress on the dashboard'
    ],
    created_at: new Date().toISOString()
  }
}

class OnboardingService {
  // Set learning goals and time constraints
  async setGoals(data: SetGoalsRequest): Promise<SetGoalsResponse> {
    try {
      const response = await api.post<SetGoalsResponse>('/api/v1/goals', data)
      return response.data
    } catch (error) {
      console.warn('Backend unavailable, using mock goals response')
      // Return mock response when backend is unavailable
      return generateMockGoalsResponse(data)
    }
  }

  // Get current goals
  async getGoals(): Promise<SetGoalsResponse> {
    try {
      const response = await api.get<SetGoalsResponse>('/api/v1/goals')
      return response.data
    } catch (error) {
      console.warn('Backend unavailable, returning empty goals')
      // Return empty goals when backend is unavailable
      return {
        success: true,
        user_id: sessionStorage.getItem('demo_user_id') || 'demo-user',
        goals: [],
        goal_categories: {},
        time_constraints: {
          hours_per_week: 5,
          preferred_times: [],
          available_days: [],
          session_length_minutes: 60
        },
        estimated_timeline: {
          total_estimated_hours: 0,
          hours_per_goal: 0,
          estimated_weeks: 0,
          estimated_days: 0
        },
        next_steps: [],
        created_at: new Date().toISOString()
      }
    }
  }

  // Create curriculum based on goals
  async createCurriculum(data: CreateCurriculumRequest): Promise<CurriculumResponse> {
    try {
      const response = await api.post<CurriculumResponse>('/api/v1/curriculum', data)
      return response.data
    } catch (error) {
      console.warn('Backend unavailable, generating mock curriculum')
      // Return mock curriculum when backend is unavailable
      return generateMockCurriculum(data)
    }
  }

  // Get curriculum status
  async getCurriculumStatus(): Promise<Record<string, unknown>> {
    try {
      const response = await api.get<Record<string, unknown>>('/api/v1/curriculum/status')
      return response.data
    } catch (error) {
      console.warn('Backend unavailable, returning mock status')
      return {
        status: 'active',
        progress: 0,
        current_module: 0
      }
    }
  }

  // Activate curriculum
  async activateCurriculum(planId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string }>('/api/v1/curriculum/activate', { plan_id: planId })
      return response.data
    } catch (error) {
      console.warn('Backend unavailable, mock activating curriculum')
      // Store the curriculum ID locally for demo purposes
      localStorage.setItem('active_curriculum_id', planId)
      return {
        success: true,
        message: 'Curriculum activated successfully (offline mode)'
      }
    }
  }

  // Get predefined goal options
  async getGoalOptions(): Promise<GoalOption[]> {
    // Mock data - in a real app, this would come from the backend
    return [
      {
        id: 'react-frontend',
        title: 'Learn React & Frontend Development',
        description: 'Master React, JavaScript, and modern frontend development',
        category: 'frontend',
        estimatedHours: 40,
        difficulty: 'intermediate',
        prerequisites: ['JavaScript basics']
      },
      {
        id: 'backend-dev',
        title: 'Master Backend Development',
        description: 'Learn server-side programming, APIs, and databases',
        category: 'backend',
        estimatedHours: 50,
        difficulty: 'intermediate'
      },
      {
        id: 'devops-cloud',
        title: 'Understand DevOps & Cloud',
        description: 'Learn Docker, Kubernetes, CI/CD, and cloud platforms',
        category: 'devops',
        estimatedHours: 60,
        difficulty: 'advanced',
        prerequisites: ['Backend development', 'Linux basics']
      },
      {
        id: 'mobile-dev',
        title: 'Mobile App Development',
        description: 'Build mobile apps with React Native or Flutter',
        category: 'mobile',
        estimatedHours: 45,
        difficulty: 'intermediate',
        prerequisites: ['JavaScript or Dart']
      },
      {
        id: 'data-science',
        title: 'Data Science & AI',
        description: 'Learn Python, machine learning, and data analysis',
        category: 'data',
        estimatedHours: 70,
        difficulty: 'advanced',
        prerequisites: ['Python basics', 'Statistics']
      },
      {
        id: 'system-design',
        title: 'System Design & Architecture',
        description: 'Design scalable systems and understand architecture patterns',
        category: 'architecture',
        estimatedHours: 80,
        difficulty: 'advanced',
        prerequisites: ['Backend development', 'Database knowledge']
      }
    ]
  }

  // Get tech stack options
  async getTechStackOptions(): Promise<TechStackOption[]> {
    // Mock data - in a real app, this would come from the backend
    return [
      // Frontend
      { id: 'javascript', name: 'JavaScript', category: 'frontend', description: 'Core web programming language', popularity: 95, difficulty: 'beginner' },
      { id: 'typescript', name: 'TypeScript', category: 'frontend', description: 'Typed superset of JavaScript', popularity: 85, difficulty: 'intermediate', prerequisites: ['JavaScript'] },
      { id: 'react', name: 'React', category: 'frontend', description: 'Popular UI library', popularity: 90, difficulty: 'intermediate', prerequisites: ['JavaScript'] },
      { id: 'vue', name: 'Vue.js', category: 'frontend', description: 'Progressive JavaScript framework', popularity: 75, difficulty: 'intermediate', prerequisites: ['JavaScript'] },
      { id: 'angular', name: 'Angular', category: 'frontend', description: 'Full-featured framework', popularity: 70, difficulty: 'advanced', prerequisites: ['TypeScript'] },
      
      // Backend
      { id: 'nodejs', name: 'Node.js', category: 'backend', description: 'JavaScript runtime for servers', popularity: 85, difficulty: 'intermediate', prerequisites: ['JavaScript'] },
      { id: 'python', name: 'Python', category: 'backend', description: 'Versatile programming language', popularity: 90, difficulty: 'beginner' },
      { id: 'java', name: 'Java', category: 'backend', description: 'Enterprise programming language', popularity: 80, difficulty: 'intermediate' },
      { id: 'go', name: 'Go', category: 'backend', description: 'Fast, compiled language', popularity: 65, difficulty: 'intermediate' },
      { id: 'rust', name: 'Rust', category: 'backend', description: 'Systems programming language', popularity: 55, difficulty: 'advanced' },
      
      // DevOps & Cloud
      { id: 'docker', name: 'Docker', category: 'devops', description: 'Containerization platform', popularity: 85, difficulty: 'intermediate' },
      { id: 'kubernetes', name: 'Kubernetes', category: 'devops', description: 'Container orchestration', popularity: 75, difficulty: 'advanced', prerequisites: ['Docker'] },
      { id: 'aws', name: 'AWS', category: 'cloud', description: 'Amazon cloud platform', popularity: 90, difficulty: 'intermediate' },
      { id: 'azure', name: 'Azure', category: 'cloud', description: 'Microsoft cloud platform', popularity: 75, difficulty: 'intermediate' },
      { id: 'gcp', name: 'GCP', category: 'cloud', description: 'Google cloud platform', popularity: 65, difficulty: 'intermediate' },
      
      // Databases
      { id: 'postgresql', name: 'PostgreSQL', category: 'database', description: 'Advanced relational database', popularity: 80, difficulty: 'intermediate' },
      { id: 'mongodb', name: 'MongoDB', category: 'database', description: 'NoSQL document database', popularity: 75, difficulty: 'beginner' },
      { id: 'redis', name: 'Redis', category: 'database', description: 'In-memory data store', popularity: 70, difficulty: 'intermediate' }
    ]
  }

  // Get skill assessment questions
  async getSkillAssessmentQuestions(): Promise<SkillAssessmentQuestion[]> {
    // Mock data - in a real app, this would come from the backend
    return [
      {
        id: 'js-1',
        question: 'What is the output of: console.log(typeof null)?',
        options: ['null', 'undefined', 'object', 'boolean'],
        correctAnswer: 2,
        category: 'javascript',
        difficulty: 'beginner'
      },
      {
        id: 'js-2',
        question: 'Which method is used to add an element to the end of an array?',
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correctAnswer: 0,
        category: 'javascript',
        difficulty: 'beginner'
      },
      {
        id: 'js-3',
        question: 'What is a closure in JavaScript?',
        options: [
          'A function that returns another function',
          'A function that has access to variables in its outer scope',
          'A function that is immediately invoked',
          'A function that takes no parameters'
        ],
        correctAnswer: 1,
        category: 'javascript',
        difficulty: 'intermediate'
      },
      {
        id: 'react-1',
        question: 'What is JSX?',
        options: [
          'A JavaScript library',
          'A syntax extension for JavaScript',
          'A CSS framework',
          'A build tool'
        ],
        correctAnswer: 1,
        category: 'react',
        difficulty: 'beginner'
      },
      {
        id: 'react-2',
        question: 'Which hook is used for side effects in React?',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correctAnswer: 1,
        category: 'react',
        difficulty: 'intermediate'
      },
      {
        id: 'general-1',
        question: 'What does API stand for?',
        options: [
          'Application Programming Interface',
          'Advanced Programming Interface',
          'Application Process Interface',
          'Automated Programming Interface'
        ],
        correctAnswer: 0,
        category: 'general',
        difficulty: 'beginner'
      }
    ]
  }

  // Evaluate skill assessment
  async evaluateSkillAssessment(answers: Record<string, number>): Promise<SkillAssessmentResult[]> {
    const questions = await this.getSkillAssessmentQuestions()
    const results: Record<string, { correct: number; total: number }> = {}

    // Calculate scores by category
    questions.forEach(question => {
      if (!results[question.category]) {
        results[question.category] = { correct: 0, total: 0 }
      }
      results[question.category].total++
      
      if (answers[question.id] === question.correctAnswer) {
        results[question.category].correct++
      }
    })

    // Convert to assessment results
    return Object.entries(results).map(([category, { correct, total }]) => {
      const score = Math.round((correct / total) * 100)
      let level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
      let recommendations: string[]

      if (score >= 90) {
        level = 'expert'
        recommendations = [`You have expert knowledge in ${category}`, 'Consider advanced topics and teaching others']
      } else if (score >= 70) {
        level = 'advanced'
        recommendations = [`Strong ${category} skills`, 'Focus on advanced concepts and best practices']
      } else if (score >= 50) {
        level = 'intermediate'
        recommendations = [`Good foundation in ${category}`, 'Work on intermediate concepts and practical projects']
      } else {
        level = 'beginner'
        recommendations = [`Start with ${category} fundamentals`, 'Focus on basic concepts and simple exercises']
      }

      return {
        category,
        score,
        level,
        recommendations
      }
    })
  }

  // Validate onboarding data
  validateOnboardingData(data: Partial<OnboardingData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.goals || data.goals.length === 0) {
      errors.push('Please select at least one learning goal')
    }

    if (!data.skillLevel) {
      errors.push('Please select your skill level')
    }

    if (!data.timeConstraints?.hoursPerWeek || data.timeConstraints.hoursPerWeek < 1) {
      errors.push('Please specify how many hours per week you can dedicate')
    }

    if (!data.preferences?.learningStyle) {
      errors.push('Please select your preferred learning style')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export const onboardingService = new OnboardingService()
