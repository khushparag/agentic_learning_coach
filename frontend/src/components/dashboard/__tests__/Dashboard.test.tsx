import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../../../pages/dashboard/Dashboard'
import { dashboardService } from '../../../services/dashboardService'

// Mock the dashboard service
jest.mock('../../../services/dashboardService')
const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>

// Mock Recharts to avoid canvas issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />
}))

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0
    }
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    
    // Setup default mock responses
    mockDashboardService.getDashboardStats.mockResolvedValue({
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
        }
      ]
    })

    mockDashboardService.getTodayTasks.mockResolvedValue([
      {
        id: '1',
        title: 'Complete React Hooks Exercise',
        description: 'Practice useState and useEffect hooks',
        type: 'exercise',
        priority: 'high',
        estimatedMinutes: 45,
        status: 'not_started',
        moduleId: 'react-fundamentals',
        moduleName: 'React Fundamentals'
      }
    ])

    mockDashboardService.getProgressMetrics.mockResolvedValue({
      learningVelocity: [
        { date: '2024-01-20', tasksCompleted: 3, xpEarned: 150 }
      ],
      activityHeatmap: [
        { date: '2024-01-20', activity: 5 }
      ],
      performanceMetrics: {
        accuracy: 87,
        speed: 92,
        consistency: 78,
        retention: 85
      },
      knowledgeRetention: [
        { topic: 'React Hooks', retentionRate: 92, lastReviewed: new Date('2024-01-20') }
      ],
      weeklyProgress: [
        { week: 'Week 1', completed: 8, target: 10 }
      ]
    })
  })

  it('renders dashboard with stats cards', async () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText('Learning Dashboard')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('7 days')).toBeInTheDocument()
      expect(screen.getByText('1,250')).toBeInTheDocument()
      expect(screen.getByText('12/20')).toBeInTheDocument()
    })
  })

  it('displays today\'s tasks', async () => {
    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Complete React Hooks Exercise')).toBeInTheDocument()
      expect(screen.getByText('Practice useState and useEffect hooks')).toBeInTheDocument()
      expect(screen.getByText('Start')).toBeInTheDocument()
    })
  })

  it('handles task status updates', async () => {
    mockDashboardService.updateTaskStatus.mockResolvedValue()
    
    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Start'))
    
    expect(mockDashboardService.updateTaskStatus).toHaveBeenCalledWith('1', 'in_progress')
  })

  it('switches between dashboard views', async () => {
    renderWithProviders(<Dashboard />)
    
    // Should start with Overview view
    await waitFor(() => {
      expect(screen.getByText('Today\'s Tasks')).toBeInTheDocument()
    })
    
    // Switch to Analytics view
    fireEvent.click(screen.getByText('Analytics'))
    
    await waitFor(() => {
      expect(screen.getByText('Progress Analytics')).toBeInTheDocument()
    })
    
    // Switch to Tasks view
    fireEvent.click(screen.getByText('Tasks'))
    
    await waitFor(() => {
      expect(screen.getByText('Task Management')).toBeInTheDocument()
    })
  })

  it('opens task detail modal when task is clicked', async () => {
    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Complete React Hooks Exercise')).toBeInTheDocument()
    })
    
    // Click on the task card (not the button)
    const taskCard = screen.getByText('Complete React Hooks Exercise').closest('div')
    if (taskCard) {
      fireEvent.click(taskCard)
    }
    
    await waitFor(() => {
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument()
    })
  })

  it('handles loading states correctly', () => {
    // Mock loading state
    mockDashboardService.getDashboardStats.mockImplementation(
      () => new Promise(() => {}) // Never resolves to simulate loading
    )
    
    renderWithProviders(<Dashboard />)
    
    // Should show loading skeletons
    expect(screen.getAllByTestId('loading-skeleton')).toBeTruthy()
  })

  it('handles error states gracefully', async () => {
    // Mock error response
    mockDashboardService.getDashboardStats.mockRejectedValue(new Error('API Error'))
    
    renderWithProviders(<Dashboard />)
    
    // Should still render the dashboard structure
    expect(screen.getByText('Learning Dashboard')).toBeInTheDocument()
  })

  it('renders quick actions', async () => {
    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Start New Topic')).toBeInTheDocument()
      expect(screen.getByText('Practice Challenge')).toBeInTheDocument()
    })
  })

  it('handles quick action clicks', async () => {
    // Mock window.location.href
    delete (window as any).location
    window.location = { href: '' } as any
    
    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Start New Topic')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Start New Topic'))
    
    expect(window.location.href).toBe('/learning-path')
  })
})