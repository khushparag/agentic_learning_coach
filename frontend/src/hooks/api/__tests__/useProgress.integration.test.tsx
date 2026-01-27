import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProgress } from '../useProgress';
import { progressService } from '../../../services/progressService';

// Mock the progress service
jest.mock('../../../services/progressService', () => ({
  progressService: {
    getProgress: jest.fn(),
    updateProgress: jest.fn(),
    getAnalytics: jest.fn(),
  },
}));

const mockProgressService = progressService as jest.Mocked<typeof progressService>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockProgressData = {
  userId: 'user-123',
  totalTasks: 20,
  completedTasks: 12,
  currentStreak: 7,
  totalXP: 2400,
  level: 5,
  achievements: ['first-submission', 'week-streak', 'fast-learner'],
  weeklyProgress: [
    { day: 'Mon', completed: 3 },
    { day: 'Tue', completed: 2 },
    { day: 'Wed', completed: 4 },
    { day: 'Thu', completed: 1 },
    { day: 'Fri', completed: 2 },
    { day: 'Sat', completed: 0 },
    { day: 'Sun', completed: 0 },
  ],
};

describe('useProgress Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useProgress hook', () => {
    it('fetches progress data successfully', async () => {
      mockProgressService.getProgress.mockResolvedValue(mockProgressData);

      const { result } = renderHook(() => useProgress('user-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProgressData);
      expect(mockProgressService.getProgress).toHaveBeenCalledWith('user-123');
    });

    it('handles loading state', () => {
      mockProgressService.getProgress.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useProgress('user-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('handles error state', async () => {
      const error = new Error('Failed to fetch progress');
      mockProgressService.getProgress.mockRejectedValue(error);

      const { result } = renderHook(() => useProgress('user-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('refetches data when user ID changes', async () => {
      mockProgressService.getProgress.mockResolvedValue(mockProgressData);

      const { result, rerender } = renderHook(
        ({ userId }) => useProgress(userId),
        {
          wrapper: createWrapper(),
          initialProps: { userId: 'user-123' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockProgressService.getProgress).toHaveBeenCalledWith('user-123');

      // Change user ID
      rerender({ userId: 'user-456' });

      await waitFor(() => {
        expect(mockProgressService.getProgress).toHaveBeenCalledWith('user-456');
      });

      expect(mockProgressService.getProgress).toHaveBeenCalledTimes(2);
    });
  });

  describe('useUpdateProgress hook', () => {
    it('updates progress successfully', async () => {
      const updatedProgress = { ...mockProgressData, completedTasks: 13 };
      mockProgressService.updateProgress.mockResolvedValue(updatedProgress);

      const { result } = renderHook(() => useProgress('user-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.updateProgress).toBeDefined();
      });

      const updateData = { taskId: 'task-456', completed: true };
      
      // Trigger the mutation
      result.current.updateProgress.mutate(updateData);

      await waitFor(() => {
        expect(result.current.updateProgress.isSuccess).toBe(true);
      });

      expect(mockProgressService.updateProgress).toHaveBeenCalledWith(
        'user-123',
        updateData
      );
    });

    it('handles update errors', async () => {
      const error = new Error('Failed to update progress');
      mockProgressService.updateProgress.mockRejectedValue(error);

      const { result } = renderHook(() => useProgress('user-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.updateProgress).toBeDefined();
      });

      const updateData = { taskId: 'task-456', completed: true };
      
      result.current.updateProgress.mutate(updateData);

      await waitFor(() => {
        expect(result.current.updateProgress.isError).toBe(true);
      });

      expect(result.current.updateProgress.error).toEqual(error);
    });
  });

  describe('useProgressAnalytics hook', () => {
    const mockAnalytics = {
      learningVelocity: [
        { date: '2024-01-01', tasksCompleted: 3 },
        { date: '2024-01-02', tasksCompleted: 2 },
        { date: '2024-01-03', tasksCompleted: 4 },
      ],
      performanceMetrics: {
        averageScore: 85,
        completionRate: 0.8,
        timeSpent: 1200,
      },
      streakData: {
        current: 7,
        longest: 12,
        history: [1, 2, 3, 4, 5, 6, 7],
      },
    };

    it('fetches analytics data successfully', async () => {
      mockProgressService.getAnalytics.mockResolvedValue(mockAnalytics);

      const { result } = renderHook(() => useProgress('user-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.analytics?.isSuccess).toBe(true);
      });

      expect(result.current.analytics?.data).toEqual(mockAnalytics);
      expect(mockProgressService.getAnalytics).toHaveBeenCalledWith('user-123');
    });

    it('handles analytics loading state', () => {
      mockProgressService.getAnalytics.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useProgress('user-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.analytics?.isLoading).toBe(true);
    });

    it('handles analytics error state', async () => {
      const error = new Error('Failed to fetch analytics');
      mockProgressService.getAnalytics.mockRejectedValue(error);

      const { result } = renderHook(() => useProgress('user-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.analytics?.isError).toBe(true);
      });

      expect(result.current.analytics?.error).toEqual(error);
    });
  });

  describe('Real-time updates', () => {
    it('invalidates cache when progress is updated', async () => {
      mockProgressService.getProgress.mockResolvedValue(mockProgressData);
      mockProgressService.updateProgress.mockResolvedValue({
        ...mockProgressData,
        completedTasks: 13,
      });

      const { result } = renderHook(() => useProgress('user-123'), {
        wrapper: createWrapper(),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.completedTasks).toBe(12);

      // Update progress
      result.current.updateProgress.mutate({ taskId: 'task-456', completed: true });

      await waitFor(() => {
        expect(result.current.updateProgress.isSuccess).toBe(true);
      });

      // Should refetch and update the data
      await waitFor(() => {
        expect(result.current.data?.completedTasks).toBe(13);
      });
    });
  });

  describe('Optimistic updates', () => {
    it('optimistically updates progress before server response', async () => {
      mockProgressService.getProgress.mockResolvedValue(mockProgressData);
      
      // Simulate slow server response
      mockProgressService.updateProgress.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ ...mockProgressData, completedTasks: 13 }), 1000)
        )
      );

      const { result } = renderHook(() => useProgress('user-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.completedTasks).toBe(12);

      // Trigger optimistic update
      result.current.updateProgress.mutate({ taskId: 'task-456', completed: true });

      // Should immediately show optimistic update
      expect(result.current.data?.completedTasks).toBe(13);
    });
  });
});
