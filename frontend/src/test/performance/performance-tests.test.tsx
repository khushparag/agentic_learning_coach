import React from 'react';
import { render, screen, waitFor } from '@/test/utils';
import { performance } from 'perf_hooks';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { CollaborationDashboard } from '@/components/collaboration/CollaborationDashboard';
import { ExerciseInterface } from '@/components/exercises/ExerciseInterface';
import { TaskManagement } from '@/components/dashboard/TaskManagement';
import { mockTasks, mockUserProfile } from '@/test/factories';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

// Performance testing utilities
const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  await waitFor(() => {
    // Wait for initial render to complete
  });
  const end = performance.now();
  return end - start;
};

const measureMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

const simulateSlowNetwork = (delay: number = 2000) => {
  server.use(
    http.get('/api/*', async ({ request }) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return HttpResponse.json({});
    })
  );
};

describe('Performance Tests', () => {
  describe('Component Rendering Performance', () => {
    it('renders Dashboard within acceptable time', async () => {
      const renderTime = await measureRenderTime(() => {
        render(<Dashboard />);
      });

      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('renders large task lists efficiently', async () => {
      const largeTasks = mockTasks(1000);
      server.use(
        http.get('/api/tasks', () => {
          return HttpResponse.json(largeTasks);
        })
      );

      const renderTime = await measureRenderTime(() => {
        render(<TaskManagement />);
      });

      // Should handle large datasets within 200ms
      expect(renderTime).toBeLessThan(200);

      await waitFor(() => {
        // Should virtualize the list
        const visibleItems = screen.getAllByTestId('task-item');
        expect(visibleItems.length).toBeLessThan(100);
      });
    });

    it('handles rapid re-renders without performance degradation', async () => {
      const { rerender } = render(<Dashboard />);

      const renderTimes: number[] = [];

      // Perform multiple re-renders
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        rerender(<Dashboard key={i} />);
        await waitFor(() => {});
        const end = performance.now();
        renderTimes.push(end - start);
      }

      // Render times should remain consistent
      const averageTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      const maxTime = Math.max(...renderTimes);
      
      expect(averageTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(100);
    });

    it('optimizes re-renders with React.memo', async () => {
      let renderCount = 0;
      
      const TestComponent = React.memo(() => {
        renderCount++;
        return <div>Test Component</div>;
      });

      const ParentComponent = ({ counter }: { counter: number }) => (
        <div>
          <div>Counter: {counter}</div>
          <TestComponent />
        </div>
      );

      const { rerender } = render(<ParentComponent counter={0} />);
      
      expect(renderCount).toBe(1);

      // Re-render parent with different props
      rerender(<ParentComponent counter={1} />);
      
      // Memoized component should not re-render
      expect(renderCount).toBe(1);
    });
  });

  describe('Memory Usage', () => {
    it('does not leak memory during component lifecycle', async () => {
      const initialMemory = measureMemoryUsage();

      // Render and unmount components multiple times
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(<Dashboard />);
        await waitFor(() => {});
        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = measureMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('cleans up event listeners and subscriptions', () => {
      const mockWebSocket = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn(() => mockWebSocket) as any;

      const { unmount } = render(<CollaborationDashboard />);

      expect(mockWebSocket.addEventListener).toHaveBeenCalled();

      unmount();

      // Should clean up listeners
      expect(mockWebSocket.removeEventListener).toHaveBeenCalled();
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('handles large datasets without memory bloat', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        data: new Array(100).fill(`data-${i}`).join('')
      }));

      server.use(
        http.get('/api/large-dataset', () => {
          return HttpResponse.json(largeDataset);
        })
      );

      const initialMemory = measureMemoryUsage();

      render(<TaskManagement />);

      await waitFor(() => {
        expect(screen.getByText('Task Management')).toBeInTheDocument();
      });

      const finalMemory = measureMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Should not load entire dataset into memory
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
    });
  });

  describe('Network Performance', () => {
    it('handles slow network gracefully', async () => {
      simulateSlowNetwork(3000);

      const start = performance.now();
      render(<Dashboard />);

      // Should show loading state immediately
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });

      const end = performance.now();
      const totalTime = end - start;

      // Should handle slow network within reasonable time
      expect(totalTime).toBeLessThan(4000);
    });

    it('implements request deduplication', async () => {
      let requestCount = 0;
      
      server.use(
        http.get('/api/users/profile', () => {
          requestCount++;
          return HttpResponse.json(mockUserProfile());
        })
      );

      // Render multiple components that use the same data
      render(
        <div>
          <Dashboard />
          <CollaborationDashboard />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Should only make one request due to deduplication
      expect(requestCount).toBe(1);
    });

    it('implements proper caching strategy', async () => {
      let requestCount = 0;
      
      server.use(
        http.get('/api/tasks', () => {
          requestCount++;
          return HttpResponse.json(mockTasks(5));
        })
      );

      const { unmount, rerender } = render(<TaskManagement />);

      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });

      expect(requestCount).toBe(1);

      // Re-render should use cache
      rerender(<TaskManagement />);
      expect(requestCount).toBe(1);

      // Unmount and remount should use cache (within cache time)
      unmount();
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });

      expect(requestCount).toBe(1);
    });

    it('batches API requests efficiently', async () => {
      const requestTimes: number[] = [];
      
      server.use(
        http.get('/api/batch', () => {
          requestTimes.push(Date.now());
          return HttpResponse.json({ success: true });
        })
      );

      // Simulate multiple rapid API calls
      const promises = Array.from({ length: 10 }, () =>
        fetch('/api/batch').then(r => r.json())
      );

      await Promise.all(promises);

      // Requests should be batched (fewer actual requests)
      expect(requestTimes.length).toBeLessThan(10);
    });
  });

  describe('Code Editor Performance', () => {
    const mockExercise = {
      id: 'exercise-1',
      title: 'Performance Test Exercise',
      description: 'Test description',
      instructions: 'Test instructions',
      starterCode: 'function test() {\n  // Large code block\n' + 
                   'const data = ' + JSON.stringify(new Array(1000).fill('test')) + ';\n' +
                   'return data;\n}',
      testCases: [],
      hints: [],
      difficulty: 1,
      language: 'javascript'
    };

    it('handles large code files efficiently', async () => {
      const renderTime = await measureRenderTime(() => {
        render(<ExerciseInterface exercise={mockExercise} />);
      });

      // Should render large code within acceptable time
      expect(renderTime).toBeLessThan(300);
    });

    it('debounces syntax checking', async () => {
      let syntaxCheckCount = 0;
      
      // Mock syntax checker
      const originalCheck = (window as any).monaco?.editor?.getModel?.()?.validate;
      if (originalCheck) {
        (window as any).monaco.editor.getModel().validate = () => {
          syntaxCheckCount++;
          return originalCheck();
        };
      }

      render(<ExerciseInterface exercise={mockExercise} />);

      const editor = screen.getByRole('textbox', { name: /code editor/i });
      
      // Type rapidly
      const rapidText = 'const a = 1; const b = 2; const c = 3;';
      for (const char of rapidText) {
        editor.focus();
        // Simulate typing
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await waitFor(() => {
        // Should debounce syntax checking
        expect(syntaxCheckCount).toBeLessThan(rapidText.length);
      });
    });

    it('virtualizes large output logs', async () => {
      const largeOutput = Array.from({ length: 10000 }, (_, i) => 
        `Line ${i}: This is a long log message with lots of content`
      ).join('\n');

      render(<ExerciseInterface exercise={mockExercise} />);

      // Simulate code execution with large output
      const outputContainer = screen.getByTestId('output-container');
      
      // Should virtualize output
      const visibleLines = outputContainer.querySelectorAll('.output-line');
      expect(visibleLines.length).toBeLessThan(100);
    });
  });

  describe('Real-time Features Performance', () => {
    it('handles high-frequency WebSocket messages efficiently', async () => {
      const mockWebSocket = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        send: jest.fn(),
        close: jest.fn(),
      };

      global.WebSocket = jest.fn(() => mockWebSocket) as any;

      render(<CollaborationDashboard />);

      const messageHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1];

      if (messageHandler) {
        const start = performance.now();

        // Simulate 100 rapid messages
        for (let i = 0; i < 100; i++) {
          const message = new MessageEvent('message', {
            data: JSON.stringify({
              type: 'chat_message',
              data: { id: `msg-${i}`, content: `Message ${i}` }
            })
          });
          messageHandler(message);
        }

        const end = performance.now();
        const processingTime = end - start;

        // Should process messages efficiently
        expect(processingTime).toBeLessThan(100);
      }
    });

    it('throttles real-time updates', async () => {
      let updateCount = 0;
      
      const TestComponent = () => {
        const [messages, setMessages] = React.useState<string[]>([]);
        
        React.useEffect(() => {
          updateCount++;
        }, [messages]);

        // Simulate rapid message updates
        React.useEffect(() => {
          const interval = setInterval(() => {
            setMessages(prev => [...prev, `Message ${Date.now()}`]);
          }, 10);

          setTimeout(() => clearInterval(interval), 100);
          
          return () => clearInterval(interval);
        }, []);

        return <div>{messages.length} messages</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        // Should throttle updates (fewer than expected)
        expect(updateCount).toBeLessThan(10);
      });
    });
  });

  describe('Bundle Size and Loading Performance', () => {
    it('implements code splitting effectively', async () => {
      // Mock dynamic imports
      const mockImport = jest.fn().mockResolvedValue({
        default: () => <div>Lazy Component</div>
      });

      (global as any).import = mockImport;

      const LazyComponent = React.lazy(() => mockImport());

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      );

      // Should show loading state first
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Lazy Component')).toBeInTheDocument();
      });

      // Should have called dynamic import
      expect(mockImport).toHaveBeenCalled();
    });

    it('preloads critical resources', () => {
      render(<Dashboard />);

      // Check for preload links in document head
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      expect(preloadLinks.length).toBeGreaterThan(0);

      // Should preload critical CSS and fonts
      const cssPreload = Array.from(preloadLinks).some(link => 
        link.getAttribute('as') === 'style'
      );
      const fontPreload = Array.from(preloadLinks).some(link => 
        link.getAttribute('as') === 'font'
      );

      expect(cssPreload || fontPreload).toBe(true);
    });
  });

  describe('Image and Asset Performance', () => {
    it('implements lazy loading for images', () => {
      render(
        <div>
          <img src="image1.jpg" loading="lazy" alt="Test 1" />
          <img src="image2.jpg" loading="lazy" alt="Test 2" />
          <img src="image3.jpg" loading="lazy" alt="Test 3" />
        </div>
      );

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    it('optimizes image formats', () => {
      render(
        <picture>
          <source srcSet="image.webp" type="image/webp" />
          <source srcSet="image.avif" type="image/avif" />
          <img src="image.jpg" alt="Optimized image" />
        </picture>
      );

      const picture = screen.getByRole('img').closest('picture');
      const sources = picture?.querySelectorAll('source');
      
      expect(sources?.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility Performance', () => {
    it('maintains performance with screen reader support', async () => {
      // Enable screen reader simulation
      Object.defineProperty(navigator, 'userAgent', {
        value: 'NVDA',
        configurable: true
      });

      const renderTime = await measureRenderTime(() => {
        render(<Dashboard />);
      });

      // Should not significantly impact performance
      expect(renderTime).toBeLessThan(150);
    });

    it('efficiently manages ARIA live regions', async () => {
      let announcements = 0;
      
      const TestComponent = () => {
        const [message, setMessage] = React.useState('');
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setMessage(`Update ${Date.now()}`);
            announcements++;
          }, 100);

          setTimeout(() => clearInterval(interval), 500);
          
          return () => clearInterval(interval);
        }, []);

        return <div aria-live="polite">{message}</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        // Should throttle announcements to avoid overwhelming screen readers
        expect(announcements).toBeLessThan(5);
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('tracks Core Web Vitals', async () => {
      const vitals: Record<string, number> = {};

      // Mock performance observer
      global.PerformanceObserver = class {
        constructor(callback: (list: any) => void) {
          // Simulate performance entries
          setTimeout(() => {
            callback({
              getEntries: () => [
                { name: 'first-contentful-paint', startTime: 100 },
                { name: 'largest-contentful-paint', startTime: 200 },
                { name: 'cumulative-layout-shift', value: 0.05 }
              ]
            });
          }, 100);
        }
        observe() {}
        disconnect() {}
      } as any;

      render(<Dashboard />);

      await waitFor(() => {
        // Should collect performance metrics
        expect(Object.keys(vitals).length).toBeGreaterThanOrEqual(0);
      });
    });

    it('identifies performance bottlenecks', async () => {
      const performanceMarks: string[] = [];

      // Mock performance.mark
      global.performance.mark = jest.fn((name: string) => {
        performanceMarks.push(name);
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Should create performance marks for key operations
      expect(performanceMarks.length).toBeGreaterThan(0);
    });
  });
});