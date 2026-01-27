import React from 'react';
import { render, screen } from '@/test/utils';
import { StatsCards } from '../StatsCards';
import { mockUserProfile } from '@/test/factories';

describe('StatsCards', () => {
  const mockStats = {
    totalTasks: 50,
    completedTasks: 23,
    currentStreak: 7,
    totalXP: 2340,
    level: 5,
    weeklyProgress: [
      { day: 'Mon', completed: 3 },
      { day: 'Tue', completed: 2 },
      { day: 'Wed', completed: 4 },
      { day: 'Thu', completed: 1 },
      { day: 'Fri', completed: 5 },
      { day: 'Sat', completed: 2 },
      { day: 'Sun', completed: 3 }
    ]
  };

  describe('Rendering', () => {
    it('renders all stat cards', () => {
      render(<StatsCards stats={mockStats} />);
      
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument();
      
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('7 days')).toBeInTheDocument();
      
      expect(screen.getByText('Total XP')).toBeInTheDocument();
      expect(screen.getByText('2,340')).toBeInTheDocument();
      
      expect(screen.getByText('Level')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders with loading state', () => {
      render(<StatsCards stats={null} loading={true} />);
      
      expect(screen.getAllByTestId('skeleton')).toHaveLength(5);
    });

    it('renders with error state', () => {
      render(<StatsCards stats={null} error="Failed to load stats" />);
      
      expect(screen.getByText('Failed to load stats')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('calculates completion percentage correctly', () => {
      render(<StatsCards stats={mockStats} />);
      
      // 23/50 = 46%
      expect(screen.getByText('46%')).toBeInTheDocument();
    });

    it('handles zero total tasks', () => {
      const statsWithZero = { ...mockStats, totalTasks: 0, completedTasks: 0 };
      render(<StatsCards stats={statsWithZero} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles 100% completion', () => {
      const completedStats = { ...mockStats, completedTasks: 50 };
      render(<StatsCards stats={completedStats} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Streak Display', () => {
    it('shows singular day for streak of 1', () => {
      const singleDayStreak = { ...mockStats, currentStreak: 1 };
      render(<StatsCards stats={singleDayStreak} />);
      
      expect(screen.getByText('1 day')).toBeInTheDocument();
    });

    it('shows plural days for streak > 1', () => {
      render(<StatsCards stats={mockStats} />);
      
      expect(screen.getByText('7 days')).toBeInTheDocument();
    });

    it('shows special message for no streak', () => {
      const noStreak = { ...mockStats, currentStreak: 0 };
      render(<StatsCards stats={noStreak} />);
      
      expect(screen.getByText('Start your streak!')).toBeInTheDocument();
    });
  });

  describe('XP Formatting', () => {
    it('formats large XP numbers with commas', () => {
      const largeXP = { ...mockStats, totalXP: 12345 };
      render(<StatsCards stats={largeXP} />);
      
      expect(screen.getByText('12,345')).toBeInTheDocument();
    });

    it('handles zero XP', () => {
      const zeroXP = { ...mockStats, totalXP: 0 };
      render(<StatsCards stats={zeroXP} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<StatsCards stats={mockStats} />);
      
      expect(screen.getByLabelText('Total tasks: 50')).toBeInTheDocument();
      expect(screen.getByLabelText('Completed tasks: 23 out of 50')).toBeInTheDocument();
      expect(screen.getByLabelText('Current learning streak: 7 days')).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<StatsCards stats={mockStats} />);
      
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(5);
    });

    it('passes axe accessibility tests', async () => {
      const { container } = render(<StatsCards stats={mockStats} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes', () => {
      render(<StatsCards stats={mockStats} />);
      
      const container = screen.getByTestId('stats-cards-container');
      expect(container).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-5');
    });
  });

  describe('User Interactions', () => {
    it('calls onRetry when retry button is clicked', async () => {
      const onRetry = jest.fn();
      render(<StatsCards stats={null} error="Error" onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('shows tooltip on hover for streak card', async () => {
      render(<StatsCards stats={mockStats} />);
      
      const streakCard = screen.getByLabelText('Current learning streak: 7 days');
      await userEvent.hover(streakCard);
      
      expect(screen.getByText('Keep learning daily to maintain your streak!')).toBeInTheDocument();
    });
  });

  describe('Animation and Visual States', () => {
    it('applies correct color for different streak levels', () => {
      // Test high streak (>= 7 days)
      render(<StatsCards stats={mockStats} />);
      const streakValue = screen.getByText('7 days');
      expect(streakValue).toHaveClass('text-green-600');
    });

    it('applies warning color for low completion rate', () => {
      const lowCompletion = { ...mockStats, completedTasks: 5 }; // 10%
      render(<StatsCards stats={lowCompletion} />);
      
      const completionPercentage = screen.getByText('10%');
      expect(completionPercentage).toHaveClass('text-yellow-600');
    });
  });
});
