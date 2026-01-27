import React from 'react';
import { render, screen, waitFor } from '@/test/utils';
import { TaskManagement } from '../TaskManagement';
import { mockTasks, mockTask } from '@/test/factories';
import { userInteractions } from '@/test/utils/user-interactions';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('TaskManagement', () => {
  const mockTasksData = mockTasks(5);

  beforeEach(() => {
    // Reset any custom handlers
    server.resetHandlers();
  });

  describe('Rendering', () => {
    it('renders task list when data is loaded', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Task Management')).toBeInTheDocument();
      });
      
      // Should show tasks from mock data
      expect(screen.getAllByTestId('task-item')).toHaveLength(5);
    });

    it('shows loading state initially', () => {
      render(<TaskManagement />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });

    it('shows empty state when no tasks', async () => {
      server.use(
        http.get('/api/tasks', () => {
          return HttpResponse.json([]);
        })
      );

      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('No tasks found')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Create your first task to get started')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    });

    it('shows error state when API fails', async () => {
      server.use(
        http.get('/api/tasks', () => {
          return HttpResponse.json(
            { error: 'Failed to fetch tasks' },
            { status: 500 }
          );
        })
      );

      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Task Filtering', () => {
    it('filters tasks by status', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      // Filter by completed tasks
      const statusFilter = screen.getByLabelText('Filter by status');
      await userInteractions.selectOption(statusFilter, 'Completed');
      
      await waitFor(() => {
        const visibleTasks = screen.getAllByTestId('task-item');
        visibleTasks.forEach(task => {
          expect(task).toHaveAttribute('data-status', 'completed');
        });
      });
    });

    it('filters tasks by difficulty', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      const difficultyFilter = screen.getByLabelText('Filter by difficulty');
      await userInteractions.selectOption(difficultyFilter, 'Beginner');
      
      await waitFor(() => {
        const visibleTasks = screen.getAllByTestId('task-item');
        visibleTasks.forEach(task => {
          expect(task).toHaveAttribute('data-difficulty', 'beginner');
        });
      });
    });

    it('searches tasks by title', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      const searchInput = screen.getByPlaceholderText('Search tasks...');
      await userInteractions.typeWithDelay(searchInput, 'JavaScript', 300);
      
      await waitFor(() => {
        const visibleTasks = screen.getAllByTestId('task-item');
        visibleTasks.forEach(task => {
          expect(task).toHaveTextContent(/javascript/i);
        });
      });
    });

    it('clears filters when clear button is clicked', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      // Apply filters
      const statusFilter = screen.getByLabelText('Filter by status');
      await userInteractions.selectOption(statusFilter, 'Completed');
      
      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await userInteractions.setup().click(clearButton);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
    });
  });

  describe('Task Sorting', () => {
    it('sorts tasks by due date', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      const sortSelect = screen.getByLabelText('Sort by');
      await userInteractions.selectOption(sortSelect, 'Due Date');
      
      await waitFor(() => {
        const taskItems = screen.getAllByTestId('task-item');
        // Verify tasks are sorted by due date (implementation specific)
        expect(taskItems[0]).toHaveAttribute('data-sort-order', '0');
      });
    });

    it('sorts tasks by priority', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      const sortSelect = screen.getByLabelText('Sort by');
      await userInteractions.selectOption(sortSelect, 'Priority');
      
      await waitFor(() => {
        const taskItems = screen.getAllByTestId('task-item');
        // High priority tasks should appear first
        expect(taskItems[0]).toHaveAttribute('data-priority', 'high');
      });
    });
  });

  describe('Task Actions', () => {
    it('opens task details modal when task is clicked', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      const firstTask = screen.getAllByTestId('task-item')[0];
      await userInteractions.setup().click(firstTask);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Task Details')).toBeInTheDocument();
      });
    });

    it('marks task as completed', async () => {
      const mockUpdateTask = jest.fn();
      server.use(
        http.put('/api/tasks/:id', async ({ request, params }) => {
          const updates = await request.json();
          mockUpdateTask(params.id, updates);
          return HttpResponse.json({ ...mockTask(), id: params.id, ...updates });
        })
      );

      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      const completeButton = screen.getAllByRole('button', { name: /mark complete/i })[0];
      await userInteractions.setup().click(completeButton);
      
      await waitFor(() => {
        expect(mockUpdateTask).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ status: 'completed' })
        );
      });
    });

    it('deletes task with confirmation', async () => {
      const mockDeleteTask = jest.fn();
      server.use(
        http.delete('/api/tasks/:id', ({ params }) => {
          mockDeleteTask(params.id);
          return HttpResponse.json({ success: true });
        })
      );

      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await userInteractions.setup().click(deleteButton);
      
      // Confirm deletion
      const confirmButton = await screen.findByRole('button', { name: /confirm delete/i });
      await userInteractions.setup().click(confirmButton);
      
      await waitFor(() => {
        expect(mockDeleteTask).toHaveBeenCalledWith(expect.any(String));
      });
    });
  });

  describe('Task Creation', () => {
    it('opens create task modal', async () => {
      render(<TaskManagement />);
      
      const createButton = screen.getByRole('button', { name: /create task/i });
      await userInteractions.setup().click(createButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Create New Task')).toBeInTheDocument();
      });
    });

    it('creates new task with form submission', async () => {
      const mockCreateTask = jest.fn();
      server.use(
        http.post('/api/tasks', async ({ request }) => {
          const taskData = await request.json();
          mockCreateTask(taskData);
          return HttpResponse.json({ ...mockTask(), ...taskData, id: 'new-task-id' });
        })
      );

      render(<TaskManagement />);
      
      const createButton = screen.getByRole('button', { name: /create task/i });
      await userInteractions.setup().click(createButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Fill form
      await userInteractions.fillForm({
        title: 'New Task',
        description: 'Task description',
        difficulty: 'intermediate'
      });
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i });
      await userInteractions.setup().click(submitButton);
      
      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Task',
            description: 'Task description',
            difficulty: 'intermediate'
          })
        );
      });
    });

    it('validates required fields', async () => {
      render(<TaskManagement />);
      
      const createButton = screen.getByRole('button', { name: /create task/i });
      await userInteractions.setup().click(createButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create/i });
      await userInteractions.setup().click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
        expect(screen.getByText('Description is required')).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('selects multiple tasks', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      // Select first two tasks
      const checkboxes = screen.getAllByRole('checkbox');
      await userInteractions.setup().click(checkboxes[0]);
      await userInteractions.setup().click(checkboxes[1]);
      
      expect(screen.getByText('2 tasks selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bulk actions/i })).toBeEnabled();
    });

    it('performs bulk completion', async () => {
      const mockBulkUpdate = jest.fn();
      server.use(
        http.patch('/api/tasks/bulk', async ({ request }) => {
          const bulkData = await request.json();
          mockBulkUpdate(bulkData);
          return HttpResponse.json({ updated: bulkData.taskIds.length });
        })
      );

      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      // Select tasks
      const checkboxes = screen.getAllByRole('checkbox');
      await userInteractions.setup().click(checkboxes[0]);
      await userInteractions.setup().click(checkboxes[1]);
      
      // Perform bulk action
      const bulkButton = screen.getByRole('button', { name: /bulk actions/i });
      await userInteractions.setup().click(bulkButton);
      
      const completeAllButton = screen.getByRole('menuitem', { name: /mark all complete/i });
      await userInteractions.setup().click(completeAllButton);
      
      await waitFor(() => {
        expect(mockBulkUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            taskIds: expect.arrayContaining([expect.any(String)]),
            updates: { status: 'completed' }
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('searchbox', { name: /search tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      // Tab through interactive elements
      await userInteractions.keyboard.tab(); // Search input
      await userInteractions.keyboard.tab(); // Status filter
      await userInteractions.keyboard.tab(); // Difficulty filter
      await userInteractions.keyboard.tab(); // Sort select
      await userInteractions.keyboard.tab(); // Create button
      
      expect(document.activeElement).toHaveAccessibleName(/create task/i);
    });

    it('passes axe accessibility tests', async () => {
      const { container } = render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Performance', () => {
    it('virtualizes large task lists', async () => {
      const largeMockTasks = mockTasks(1000);
      server.use(
        http.get('/api/tasks', () => {
          return HttpResponse.json(largeMockTasks);
        })
      );

      render(<TaskManagement />);
      
      await waitFor(() => {
        // Should only render visible items (virtualization)
        const visibleTasks = screen.getAllByTestId('task-item');
        expect(visibleTasks.length).toBeLessThan(100);
      });
    });

    it('debounces search input', async () => {
      const mockSearch = jest.fn();
      server.use(
        http.get('/api/tasks', ({ request }) => {
          const url = new URL(request.url);
          const search = url.searchParams.get('search');
          if (search) mockSearch(search);
          return HttpResponse.json(mockTasks(5));
        })
      );

      render(<TaskManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search tasks...');
      
      // Type quickly
      await userInteractions.clearAndType(searchInput, 'test');
      
      // Should debounce and only call once
      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1);
        expect(mockSearch).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('Real-time Updates', () => {
    it('updates task list when WebSocket message received', async () => {
      const { rerender } = render(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('task-item')).toHaveLength(5);
      });
      
      // Simulate WebSocket update
      const updatedTask = { ...mockTask(), id: 'updated-task', title: 'Updated Task' };
      
      // This would typically be handled by WebSocket context
      // For testing, we can trigger a re-render with updated data
      server.use(
        http.get('/api/tasks', () => {
          return HttpResponse.json([updatedTask, ...mockTasks(4)]);
        })
      );
      
      rerender(<TaskManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Updated Task')).toBeInTheDocument();
      });
    });
  });
});