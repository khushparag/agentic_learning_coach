import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Onboarding from '../../../pages/onboarding/Onboarding'
import { onboardingService } from '../../../services/onboardingService'

// Mock the onboarding service
vi.mock('../../../services/onboardingService', () => ({
  onboardingService: {
    getGoalOptions: vi.fn(),
    getTechStackOptions: vi.fn(),
    getSkillAssessmentQuestions: vi.fn(),
    evaluateSkillAssessment: vi.fn(),
    setGoals: vi.fn(),
    createCurriculum: vi.fn(),
    activateCurriculum: vi.fn(),
    validateOnboardingData: vi.fn(),
  }
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderOnboarding = () => {
  return render(
    <BrowserRouter>
      <Onboarding />
    </BrowserRouter>
  )
}

describe('Onboarding Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    vi.mocked(onboardingService.getGoalOptions).mockResolvedValue([
      {
        id: 'react-frontend',
        title: 'Learn React & Frontend Development',
        description: 'Master React and modern frontend development',
        category: 'frontend',
        estimatedHours: 40,
        difficulty: 'intermediate'
      }
    ])
    
    vi.mocked(onboardingService.getTechStackOptions).mockResolvedValue([
      {
        id: 'react',
        name: 'React',
        category: 'frontend',
        description: 'Popular UI library',
        popularity: 90,
        difficulty: 'intermediate'
      }
    ])
    
    vi.mocked(onboardingService.validateOnboardingData).mockReturnValue({
      isValid: true,
      errors: []
    })
  })

  it('renders the onboarding welcome screen', () => {
    renderOnboarding()
    
    expect(screen.getByText('Welcome to Learning Coach')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    expect(screen.getByText('Learning Goals')).toBeInTheDocument()
  })

  it('shows validation error when trying to proceed without selecting goals', async () => {
    renderOnboarding()
    
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please complete all required fields before continuing.')).toBeInTheDocument()
    })
  })

  it('progresses through all steps when valid data is provided', async () => {
    renderOnboarding()
    
    // Step 1: Goals - wait for goals to load and select one
    await waitFor(() => {
      expect(screen.getByText('Learn React & Frontend Development')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Learn React & Frontend Development'))
    fireEvent.click(screen.getByText('Next'))
    
    // Step 2: Tech Stack
    await waitFor(() => {
      expect(screen.getByText('Which technologies interest you?')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('React'))
    fireEvent.click(screen.getByText('Next'))
    
    // Step 3: Skill Assessment
    await waitFor(() => {
      expect(screen.getByText('What\'s your skill level?')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Intermediate'))
    fireEvent.click(screen.getByText('Next'))
    
    // Step 4: Time Constraints
    await waitFor(() => {
      expect(screen.getByText('How much time can you dedicate?')).toBeInTheDocument()
    })
    
    // Select a day
    fireEvent.click(screen.getByText('Monday'))
    fireEvent.click(screen.getByText('Next'))
    
    // Step 5: Preferences
    await waitFor(() => {
      expect(screen.getByText('Learning Preferences')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Hands-on Learner'))
    
    // Complete setup
    fireEvent.click(screen.getByText('Complete Setup'))
    
    await waitFor(() => {
      expect(onboardingService.setGoals).toHaveBeenCalled()
    })
  })

  it('allows going back to previous steps', () => {
    renderOnboarding()
    
    // Go to step 2 first
    fireEvent.click(screen.getByText('Learn React & Frontend Development'))
    fireEvent.click(screen.getByText('Next'))
    
    // Go back to step 1
    fireEvent.click(screen.getByText('Previous'))
    
    expect(screen.getByText('What do you want to learn?')).toBeInTheDocument()
  })

  it('completes onboarding and navigates to dashboard', async () => {
    // Mock successful API responses
    vi.mocked(onboardingService.setGoals).mockResolvedValue({
      success: true,
      user_id: 'test-user',
      goals: ['Learn React'],
      goal_categories: {},
      time_constraints: {
        hours_per_week: 5,
        preferred_times: [],
        available_days: ['monday'],
        session_length_minutes: 60
      },
      estimated_timeline: {},
      next_steps: [],
      created_at: new Date().toISOString()
    })
    
    vi.mocked(onboardingService.createCurriculum).mockResolvedValue({
      id: 'curriculum-123',
      user_id: 'test-user',
      title: 'React Learning Path',
      goal_description: 'Learn React',
      status: 'active',
      total_days: 30,
      modules: [],
      modules_completed: 0,
      total_modules: 0,
      overall_progress: 0,
      current_module_index: 0,
      created_at: new Date().toISOString()
    })
    
    vi.mocked(onboardingService.activateCurriculum).mockResolvedValue({
      success: true,
      message: 'Curriculum activated'
    })
    
    renderOnboarding()
    
    // Complete all steps quickly
    await waitFor(() => {
      fireEvent.click(screen.getByText('Learn React & Frontend Development'))
    })
    fireEvent.click(screen.getByText('Next'))
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('React'))
    })
    fireEvent.click(screen.getByText('Next'))
    
    fireEvent.click(screen.getByText('Intermediate'))
    fireEvent.click(screen.getByText('Next'))
    
    fireEvent.click(screen.getByText('Monday'))
    fireEvent.click(screen.getByText('Next'))
    
    fireEvent.click(screen.getByText('Hands-on Learner'))
    fireEvent.click(screen.getByText('Complete Setup'))
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', expect.any(Object))
    })
  })
})