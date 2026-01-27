import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserProfile } from '../useUserProfile';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockUserProfile } from '@/test/factories';

// Test wrapper with QueryClient
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

describe('useUserProfile Integration Tests', () => {
  const mockProfile = mockUserProfile({
    id: 'user-123',
    email: 'test@example.com',
    skillLevel: 'intermediate',
    learningGoals: ['React', 'TypeScript']
  });

  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Profile Fetching', () => {
    it('fetches user profile successfully', async () => {
      server.use(
        http.get('/api/users/profile', () => {
          return HttpResponse.json(mockProfile);
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockProfile);
      expect(result.current.error).toBeNull();
    });

    it('handles profile fetch error', async () => {
      server.use(
        http.get('/api/users/profile', () => {
          return HttpResponse.json(
            { error: 'Profile not found' },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain('404');
    });

    it('handles network error', async () => {
      server.use(
        http.get('/api/users/profile', () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Profile Updates', () => {
    it('updates profile successfully', async () => {
      const updatedProfile = { ...mockProfile, skillLevel: 'advanced' as const };
      
      server.use(
        http.get('/api/users/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
        http.put('/api/users/profile', async ({ request }) => {
          const updates = await request.json();
          return HttpResponse.json({ ...mockProfile, ...updates });
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.data).toEqual(mockProfile);
      });

      // Update profile
      result.current.updateProfile.mutate({ skillLevel: 'advanced' });

      await waitFor(() => {
        expect(result.current.updateProfile.isSuccess).toBe(true);
      });

      // Should update cached data
      expect(result.current.data?.skillLevel).toBe('advanced');
    });

    it('handles profile update error', async () => {
      server.use(
        http.get('/api/users/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
        http.put('/api/users/profile', () => {
          return HttpResponse.json(
            { error: 'Validation failed' },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProfile);
      });

      result.current.updateProfile.mutate({ skillLevel: 'advanced' });

      await waitFor(() => {
        expect(result.current.updateProfile.isError).toBe(true);
      });

      expect(result.current.updateProfile.error).toBeTruthy();
      // Original data should remain unchanged
      expect(result.current.data?.skillLevel).toBe('intermediate');
    });

    it('optimistically updates profile', async () => {
      server.use(
        http.get('/api/users/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
        http.put('/api/users/profile', async ({ request }) => {
          // Simulate slow network
          await new Promise(resolve => setTimeout(resolve, 1000));
          const updates = await request.json();
          return HttpResponse.json({ ...mockProfile, ...updates });
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProfile);
      });

      result.current.updateProfile.mutate({ skillLevel: 'advanced' });

      // Should immediately show optimistic update
      expect(result.current.data?.skillLevel).toBe('advanced');
      expect(result.current.updateProfile.isPending).toBe(true);

      await waitFor(() => {
        expect(result.current.updateProfile.isSuccess).toBe(true);
      });

      expect(result.current.data?.skillLevel).toBe('advanced');
    });
  });

  describe('Learning Goals Management', () => {
    it('adds learning goal', async () => {
      server.use(
        http.get('/api/users/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
        http.post('/api/users/profile/goals', async ({ request }) => {
          const { goal } = await request.json();
          const updatedGoals = [...mockProfile.learningGoals, goal];
          return HttpResponse.json({ 
            ...mockProfile, 
            learningGoals: updatedGoals 
          });
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProfile);
      });

      result.current.addLearningGoal.mutate('Node.js');

      await waitFor(() => {
        expect(result.current.addLearningGoal.isSuccess).toBe(true);
      });

      expect(result.current.data?.learningGoals).toContain('Node.js');
    });

    it('removes learning goal', async () => {
      server.use(
        http.get('/api/users/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
        http.delete('/api/users/profile/goals/:goal', ({ params }) => {
          const updatedGoals = mockProfile.learningGoals.filter(
            goal => goal !== params.goal
          );
          return HttpResponse.json({ 
            ...mockProfile, 
            learningGoals: updatedGoals 
          });
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProfile);
      });

      result.current.removeLearningGoal.mutate('React');

      await waitFor(() => {
        expect(result.current.removeLearningGoal.isSuccess).toBe(true);
      });

      expect(result.current.data?.learningGoals).not.toContain('React');
    });
  });

  describe('Caching and Invalidation', () => {
    it('caches profile data correctly', async () => {
      let fetchCount = 0;
      
      server.use(
        http.get('/api/users/profile', () => {
          fetchCount++;
          return HttpResponse.json(mockProfile);
        })
      );

      const wrapper = createWrapper();

      // First render
      const { result: result1 } = renderHook(() => useUserProfile(), { wrapper });
      
      await waitFor(() => {
        expect(result1.current.data).toEqual(mockProfile);
      });

      // Second render should use cache
      const { result: result2 } = renderHook(() => useUserProfile(), { wrapper });
      
      await waitFor(() => {
        expect(result2.current.data).toEqual(mockProfile);
      });

      // Should only fetch once due to caching
      expect(fetchCount).toBe(1);
    });

    it('invalidates cache after update', async () => {
      let fetchCount = 0;
      
      server.use(
        http.get('/api/users/profile', () => {
          fetchCount++;
          return HttpResponse.json(mockProfile);
        }),
        http.put('/api/users/profile', async ({ request }) => {
          const updates = await request.json();
          return HttpResponse.json({ ...mockProfile, ...updates });
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProfile);
      });

      expect(fetchCount).toBe(1);

      // Update profile
      result.current.updateProfile.mutate({ skillLevel: 'advanced' });

      await waitFor(() => {
        expect(result.current.updateProfile.isSuccess).toBe(true);
      });

      // Should refetch after update
      expect(fetchCount).toBe(2);
    });
  });

  describe('Error Recovery', () => {
    it('retries failed requests', async () => {
      let attemptCount = 0;
      
      server.use(
        http.get('/api/users/profile', () => {
          attemptCount++;
          if (attemptCount < 3) {
            return HttpResponse.error();
          }
          return HttpResponse.json(mockProfile);
        })
      );

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { 
            retry: 2,
            retryDelay: 100,
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProfile);
      }, { timeout: 5000 });

      expect(attemptCount).toBe(3);
    });

    it('provides manual refetch capability', async () => {
      let fetchCount = 0;
      
      server.use(
        http.get('/api/users/profile', () => {
          fetchCount++;
          if (fetchCount === 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json(mockProfile);
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(fetchCount).toBe(1);

      // Manual refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProfile);
      });

      expect(fetchCount).toBe(2);
    });
  });

  describe('Real-time Updates', () => {
    it('handles WebSocket profile updates', async () => {
      server.use(
        http.get('/api/users/profile', () => {
          return HttpResponse.json(mockProfile);
        })
      );

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProfile);
      });

      // Simulate WebSocket update
      const updatedProfile = { ...mockProfile, skillLevel: 'expert' as const };
      
      // This would typically be handled by WebSocket context
      // For testing, we can trigger a cache update
      result.current.updateProfileFromWebSocket(updatedProfile);

      expect(result.current.data?.skillLevel).toBe('expert');
    });
  });
});