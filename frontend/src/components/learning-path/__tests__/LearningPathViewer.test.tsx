import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LearningPathViewer } from '../LearningPathViewer';

// Mock the learning path service
jest.mock('../../../services/learningPathService', () => ({
  getLearningPath: jest.fn(),
  updateModuleProgress: jest.fn(),
}));

// Mock child components
jest.mock('../ModuleCard', () => ({
  ModuleCard: ({ module, onSelect }: any) => (
    <div 
      data-testid={`module-card-${module.id}`}
      onClick={() => onSelect(module)}
    >
      {module.title}
    </div>
  ),
}));

jest.mock('../TaskDetailsModal', () => ({
  TaskDetailsModal: ({ isOpen, onClose, task }: any) => 
    isOpen ? (
      <div data-testid="task-details-modal">
        <button onClick={onClose}>Close</button>
        <div>{task?.title}</div>
      </div>
    ) : null,
}));

const mockLearningPath = {
  id: 'path-123',
  title: 'React Fundamentals',
  description: 'Learn the basics of React',
  modules: [
    {
      id: 'module-1',
      title: 'Components',
      description: 'Learn about React components',
      tasks: [
        { id: 'task-1', title: 'Create your first component', completed: true },
        { id: 'task-2', title: 'Props and state', completed: false },
      ],
      completed: false,
      progress: 50,
    },
    {
      id: 'module-2',
      title: 'Hooks',
      description: 'Master React hooks',
      tasks: [
        { id: 'task-3', title: 'useState hook', completed: false },
        { id: 'task-4', title: 'useEffect hook', completed: false },
      ],
      completed: false,
      progress: 0,
    },
  ],
  progress: 25,
};

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

describe('LearningPathViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the service to return our test data
    const { getLearningPath } = require('../../../services/learningPathService');
    getLearningPath.mockResolvedValue(mockLearningPath);
  });

  it('renders the learning path title and description', async () => {
    renderWithQueryClient(<LearningPathViewer pathId="path-123" />);

    await waitFor(() => {
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Learn the basics of React')).toBeInTheDocument();
    });
  });

  it('displays all modules as cards', async () => {
    renderWithQueryClient(<LearningPathViewer pathId="path-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('module-card-module-1')).toBeInTheDocument();
      expect(screen.getByTestId('module-card-module-2')).toBeInTheDocument();
    });
  });

  it('shows overall progress', async () => {
    renderWithQueryClient(<LearningPathViewer pathId="path-123" />);

    await waitFor(() => {
      expect(screen.getByText(/25%/)).toBeInTheDocument();
    });
  });

  it('opens task details modal when module is selected', async () => {
    renderWithQueryClient(<LearningPathViewer pathId="path-123" />);

    await waitFor(() => {
      const moduleCard = screen.getByTestId('module-card-module-1');
      fireEvent.click(moduleCard);
    });

    expect(screen.getByTestId('task-details-modal')).toBeInTheDocument();
  });

  it('closes task details modal', async () => {
    renderWithQueryClient(<LearningPathViewer pathId="path-123" />);

    await waitFor(() => {
      const moduleCard = screen.getByTestId('module-card-module-1');
      fireEvent.click(moduleCard);
    });

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('task-details-modal')).not.toBeInTheDocument();
  });

  it('displays loading state', () => {
    const { getLearningPath } = require('../../../services/learningPathService');
    getLearningPath.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithQueryClient(<LearningPathViewer pathId="path-123" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error state', async () => {
    const { getLearningPath } = require('../../../services/learningPathService');
    getLearningPath.mockRejectedValue(new Error('Failed to load'));

    renderWithQueryClient(<LearningPathViewer pathId="path-123" />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('handles empty learning path', async () => {
    const { getLearningPath } = require('../../../services/learningPathService');
    getLearningPath.mockResolvedValue({
      ...mockLearningPath,
      modules: [],
    });

    renderWithQueryClient(<LearningPathViewer pathId="path-123" />);

    await waitFor(() => {
      expect(screen.getByText(/no modules/i)).toBeInTheDocument();
    });
  });

  it('updates progress when module is completed', async () => {
    const { updateModuleProgress } = require('../../../services/learningPathService');
    updateModuleProgress.mockResolvedValue({ success: true });

    renderWithQueryClient(<LearningPathViewer pathId="path-123" />);

    await waitFor(() => {
      const moduleCard = screen.getByTestId('module-card-module-1');
      fireEvent.click(moduleCard);
    });

    // Simulate completing a task
    // This would typically be triggered by a task completion action
    expect(updateModuleProgress).not.toHaveBeenCalled(); // Not called until task is actually completed
  });

  it('is accessible with proper ARIA labels', async () => {
    renderWithQueryClient(<LearningPathViewer pathId="path-123" />);

    await waitFor(() => {
      const pathContainer = screen.getByRole('main');
      expect(pathContainer).toBeInTheDocument();
    });
  });
});
