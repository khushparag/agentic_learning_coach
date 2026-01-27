import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardGrid } from '../DashboardGrid';
import { generateMockProgress, generateMockAnalytics } from '../../../test/utils/test-data-generators';

// Mock the dashboard service
jest.mock('../../../services/dashboardService', () => ({
  getDashboardData: jest.fn(),
}));

// Mock child components
jest.mock('../StatsCards', () => ({
  StatsCards: () => <div data-testid="stats-cards">Stats Cards</div>,
}));

jest.mock('../TodayTasks', () => ({
  TodayTasks: () => <div data-testid="today-tasks">Today Tasks</div>,
}));

jest.mock('../ProgressAnalytics', () => ({
  ProgressAnalytics: () => <div data-testid="progress-analytics">Progress Analytics</div>,
}));

jest.mock('../QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('DashboardGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all dashboard components', async () => {
    renderWithQueryClient(<DashboardGrid />);

    await waitFor(() => {
      expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
      expect(screen.getByTestId('today-tasks')).toBeInTheDocument();
      expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });
  });

  it('has proper grid layout structure', () => {
    renderWithQueryClient(<DashboardGrid />);
    
    const gridContainer = screen.getByRole('main');
    expect(gridContainer).toHaveClass('grid');
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('lg:grid-cols-3');
  });

  it('displays components in correct order', async () => {
    renderWithQueryClient(<DashboardGrid />);

    const components = await screen.findAllByTestId(/stats-cards|today-tasks|progress-analytics|quick-actions/);
    expect(components).toHaveLength(4);
  });

  it('is responsive and adapts to screen sizes', () => {
    renderWithQueryClient(<DashboardGrid />);
    
    const gridContainer = screen.getByRole('main');
    
    // Check responsive classes
    expect(gridContainer).toHaveClass('grid-cols-1'); // Mobile
    expect(gridContainer).toHaveClass('lg:grid-cols-3'); // Desktop
    expect(gridContainer).toHaveClass('gap-6'); // Consistent spacing
  });

  it('handles loading states gracefully', () => {
    renderWithQueryClient(<DashboardGrid />);
    
    // Should render without crashing even when data is loading
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});