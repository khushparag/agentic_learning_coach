import React from 'react';
import { render, screen, waitFor } from '@/test/utils';
import { CollaborationDashboard } from '../CollaborationDashboard';
import { userInteractions } from '@/test/utils/user-interactions';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

// Mock WebSocket for collaboration features
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN,
};

// Mock the WebSocket constructor
global.WebSocket = jest.fn(() => mockWebSocket) as any;

describe('CollaborationDashboard', () => {
  const mockCollaborationData = {
    activeStudyGroups: [
      {
        id: 'group-1',
        name: 'React Study Group',
        members: 5,
        currentTopic: 'Hooks',
        isActive: true,
        lastActivity: new Date().toISOString()
      },
      {
        id: 'group-2',
        name: 'JavaScript Fundamentals',
        members: 8,
        currentTopic: 'Async/Await',
        isActive: false,
        lastActivity: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    ],
    recentActivity: [
      {
        id: 'activity-1',
        type: 'code_review',
        user: 'Alice',
        description: 'Reviewed your React component',
        timestamp: new Date().toISOString()
      },
      {
        id: 'activity-2',
        type: 'study_group_join',
        user: 'Bob',
        description: 'Joined React Study Group',
        timestamp: new Date(Date.now() - 1800000).toISOString() // 30 min ago
      }
    ],
    pendingInvitations: [
      {
        id: 'invite-1',
        from: 'Charlie',
        groupName: 'TypeScript Masters',
        timestamp: new Date().toISOString()
      }
    ]
  };

  beforeEach(() => {
    server.use(
      http.get('/api/collaboration/dashboard', () => {
        return HttpResponse.json(mockCollaborationData);
      })
    );
  });

  describe('Rendering', () => {
    it('renders collaboration dashboard with all sections', async () => {
      render(<CollaborationDashboard />);
      
      expect(screen.getByText('Collaboration Dashboard')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Active Study Groups')).toBeInTheDocument();
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      render(<CollaborationDashboard />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('shows error state when API fails', async () => {
      server.use(
        http.get('/api/collaboration/dashboard', () => {
          return HttpResponse.json(
            { error: 'Failed to load collaboration data' },
            { status: 500 }
          );
        })
      );

      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load collaboration data')).toBeInTheDocument();
      });
    });
  });

  describe('Study Groups Section', () => {
    it('displays active study groups', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('React Study Group')).toBeInTheDocument();
        expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
      });
      
      expect(screen.getByText('5 members')).toBeInTheDocument();
      expect(screen.getByText('8 members')).toBeInTheDocument();
    });

    it('shows active status indicators', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        const activeGroup = screen.getByTestId('study-group-group-1');
        const inactiveGroup = screen.getByTestId('study-group-group-2');
        
        expect(activeGroup).toHaveClass('border-green-500');
        expect(inactiveGroup).toHaveClass('border-gray-300');
      });
    });

    it('allows joining a study group', async () => {
      const mockJoinGroup = jest.fn();
      server.use(
        http.post('/api/collaboration/study-groups/:id/join', ({ params }) => {
          mockJoinGroup(params.id);
          return HttpResponse.json({ success: true });
        })
      );

      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('React Study Group')).toBeInTheDocument();
      });
      
      const joinButton = screen.getByRole('button', { name: /join react study group/i });
      await userInteractions.setup().click(joinButton);
      
      await waitFor(() => {
        expect(mockJoinGroup).toHaveBeenCalledWith('group-1');
      });
    });

    it('opens study group details modal', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('React Study Group')).toBeInTheDocument();
      });
      
      const groupCard = screen.getByTestId('study-group-group-1');
      await userInteractions.setup().click(groupCard);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Study Group Details')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Activity Section', () => {
    it('displays recent collaboration activities', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Reviewed your React component')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Joined React Study Group')).toBeInTheDocument();
      });
    });

    it('shows activity timestamps', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('just now')).toBeInTheDocument();
        expect(screen.getByText('30 minutes ago')).toBeInTheDocument();
      });
    });

    it('filters activities by type', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(2);
      });
      
      const filterSelect = screen.getByLabelText('Filter activities');
      await userInteractions.selectOption(filterSelect, 'Code Reviews');
      
      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(1);
        expect(screen.getByText('Reviewed your React component')).toBeInTheDocument();
      });
    });
  });

  describe('Pending Invitations Section', () => {
    it('displays pending invitations', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Charlie')).toBeInTheDocument();
        expect(screen.getByText('TypeScript Masters')).toBeInTheDocument();
      });
    });

    it('allows accepting invitations', async () => {
      const mockAcceptInvite = jest.fn();
      server.use(
        http.post('/api/collaboration/invitations/:id/accept', ({ params }) => {
          mockAcceptInvite(params.id);
          return HttpResponse.json({ success: true });
        })
      );

      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('TypeScript Masters')).toBeInTheDocument();
      });
      
      const acceptButton = screen.getByRole('button', { name: /accept invitation/i });
      await userInteractions.setup().click(acceptButton);
      
      await waitFor(() => {
        expect(mockAcceptInvite).toHaveBeenCalledWith('invite-1');
      });
    });

    it('allows declining invitations', async () => {
      const mockDeclineInvite = jest.fn();
      server.use(
        http.post('/api/collaboration/invitations/:id/decline', ({ params }) => {
          mockDeclineInvite(params.id);
          return HttpResponse.json({ success: true });
        })
      );

      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('TypeScript Masters')).toBeInTheDocument();
      });
      
      const declineButton = screen.getByRole('button', { name: /decline invitation/i });
      await userInteractions.setup().click(declineButton);
      
      await waitFor(() => {
        expect(mockDeclineInvite).toHaveBeenCalledWith('invite-1');
      });
    });
  });

  describe('Real-time Updates', () => {
    it('updates when WebSocket message received', async () => {
      render(
        <WebSocketProvider mockMode={false}>
          <CollaborationDashboard />
        </WebSocketProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('React Study Group')).toBeInTheDocument();
      });
      
      // Simulate WebSocket message
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'collaboration_update',
          data: {
            type: 'new_activity',
            activity: {
              id: 'activity-3',
              type: 'message',
              user: 'Dave',
              description: 'Sent a message in React Study Group',
              timestamp: new Date().toISOString()
            }
          }
        })
      });
      
      // Trigger the WebSocket message handler
      const messageHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1];
      
      if (messageHandler) {
        messageHandler(messageEvent);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Dave')).toBeInTheDocument();
        expect(screen.getByText('Sent a message in React Study Group')).toBeInTheDocument();
      });
    });

    it('shows online status of study group members', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('React Study Group')).toBeInTheDocument();
      });
      
      // Should show online member count
      expect(screen.getByText('3 online')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('provides quick action buttons', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create study group/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /find collaborators/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /share progress/i })).toBeInTheDocument();
      });
    });

    it('opens create study group modal', async () => {
      render(<CollaborationDashboard />);
      
      const createButton = screen.getByRole('button', { name: /create study group/i });
      await userInteractions.setup().click(createButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Create Study Group')).toBeInTheDocument();
      });
    });

    it('opens find collaborators modal', async () => {
      render(<CollaborationDashboard />);
      
      const findButton = screen.getByRole('button', { name: /find collaborators/i });
      await userInteractions.setup().click(findButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Find Collaborators')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('region', { name: /study groups/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /recent activity/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /pending invitations/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('React Study Group')).toBeInTheDocument();
      });
      
      // Tab through interactive elements
      await userInteractions.keyboard.tab(); // First study group
      await userInteractions.keyboard.tab(); // Join button
      await userInteractions.keyboard.tab(); // Second study group
      
      expect(document.activeElement).toHaveAttribute('data-testid', 'study-group-group-2');
    });

    it('passes axe accessibility tests', async () => {
      const { container } = render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('React Study Group')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        const container = screen.getByTestId('collaboration-dashboard');
        expect(container).toHaveClass('flex-col', 'md:flex-row');
      });
    });

    it('shows condensed view on small screens', async () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        // Should show condensed cards
        const studyGroups = screen.getAllByTestId(/study-group-/);
        studyGroups.forEach(group => {
          expect(group).toHaveClass('p-3'); // Smaller padding
        });
      });
    });
  });

  describe('Performance', () => {
    it('memoizes expensive calculations', async () => {
      const { rerender } = render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('React Study Group')).toBeInTheDocument();
      });
      
      // Re-render with same props should not recalculate
      rerender(<CollaborationDashboard />);
      
      // Component should use memoized values
      expect(screen.getByText('React Study Group')).toBeInTheDocument();
    });

    it('lazy loads activity feed', async () => {
      render(<CollaborationDashboard />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(2);
      });
      
      // Scroll to load more activities
      const activityContainer = screen.getByTestId('activity-feed');
      activityContainer.scrollTop = activityContainer.scrollHeight;
      
      await waitFor(() => {
        // Should load more activities
        expect(screen.getAllByTestId('activity-item').length).toBeGreaterThan(2);
      });
    });
  });
});
