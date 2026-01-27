import { collaborationService } from '../collaborationService';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('CollaborationService Integration Tests', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Study Groups', () => {
    const mockStudyGroup = {
      id: 'group-1',
      name: 'React Study Group',
      description: 'Learning React together',
      members: [
        { id: 'user-1', username: 'Alice', role: 'admin' },
        { id: 'user-2', username: 'Bob', role: 'member' }
      ],
      currentTopic: 'Hooks',
      isPublic: true,
      createdAt: new Date().toISOString()
    };

    it('creates study group successfully', async () => {
      server.use(
        http.post('/api/collaboration/study-groups', async ({ request }) => {
          const groupData = await request.json();
          return HttpResponse.json({
            ...mockStudyGroup,
            ...groupData,
            id: 'new-group-id'
          });
        })
      );

      const groupData = {
        name: 'TypeScript Masters',
        description: 'Advanced TypeScript concepts',
        isPublic: true
      };

      const result = await collaborationService.createStudyGroup(groupData);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('TypeScript Masters');
      expect(result.data?.id).toBe('new-group-id');
    });

    it('handles study group creation error', async () => {
      server.use(
        http.post('/api/collaboration/study-groups', () => {
          return HttpResponse.json(
            { error: 'Group name already exists' },
            { status: 400 }
          );
        })
      );

      const groupData = {
        name: 'Existing Group',
        description: 'This group already exists',
        isPublic: true
      };

      const result = await collaborationService.createStudyGroup(groupData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Group name already exists');
    });

    it('joins study group successfully', async () => {
      server.use(
        http.post('/api/collaboration/study-groups/:id/join', ({ params }) => {
          return HttpResponse.json({
            ...mockStudyGroup,
            id: params.id,
            members: [
              ...mockStudyGroup.members,
              { id: 'user-3', username: 'Charlie', role: 'member' }
            ]
          });
        })
      );

      const result = await collaborationService.joinStudyGroup('group-1');

      expect(result.success).toBe(true);
      expect(result.data?.members).toHaveLength(3);
      expect(result.data?.members.some(m => m.username === 'Charlie')).toBe(true);
    });

    it('handles join group error when group is full', async () => {
      server.use(
        http.post('/api/collaboration/study-groups/:id/join', () => {
          return HttpResponse.json(
            { error: 'Study group is full' },
            { status: 409 }
          );
        })
      );

      const result = await collaborationService.joinStudyGroup('group-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Study group is full');
    });

    it('leaves study group successfully', async () => {
      server.use(
        http.post('/api/collaboration/study-groups/:id/leave', ({ params }) => {
          return HttpResponse.json({
            ...mockStudyGroup,
            id: params.id,
            members: mockStudyGroup.members.filter(m => m.id !== 'user-2')
          });
        })
      );

      const result = await collaborationService.leaveStudyGroup('group-1');

      expect(result.success).toBe(true);
      expect(result.data?.members).toHaveLength(1);
      expect(result.data?.members.some(m => m.username === 'Bob')).toBe(false);
    });

    it('fetches study group details', async () => {
      server.use(
        http.get('/api/collaboration/study-groups/:id', ({ params }) => {
          return HttpResponse.json({
            ...mockStudyGroup,
            id: params.id
          });
        })
      );

      const result = await collaborationService.getStudyGroup('group-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('group-1');
      expect(result.data?.name).toBe('React Study Group');
    });

    it('searches study groups with filters', async () => {
      const mockGroups = [
        { ...mockStudyGroup, id: 'group-1', name: 'React Beginners' },
        { ...mockStudyGroup, id: 'group-2', name: 'React Advanced' },
        { ...mockStudyGroup, id: 'group-3', name: 'Vue.js Study Group' }
      ];

      server.use(
        http.get('/api/collaboration/study-groups', ({ request }) => {
          const url = new URL(request.url);
          const search = url.searchParams.get('search');
          const topic = url.searchParams.get('topic');
          
          let filteredGroups = mockGroups;
          
          if (search) {
            filteredGroups = filteredGroups.filter(g => 
              g.name.toLowerCase().includes(search.toLowerCase())
            );
          }
          
          if (topic) {
            filteredGroups = filteredGroups.filter(g => 
              g.currentTopic.toLowerCase().includes(topic.toLowerCase())
            );
          }
          
          return HttpResponse.json(filteredGroups);
        })
      );

      // Search for React groups
      const reactResult = await collaborationService.searchStudyGroups({
        search: 'React',
        limit: 10
      });

      expect(reactResult.success).toBe(true);
      expect(reactResult.data).toHaveLength(2);
      expect(reactResult.data?.every(g => g.name.includes('React'))).toBe(true);

      // Search by topic
      const hooksResult = await collaborationService.searchStudyGroups({
        topic: 'Hooks',
        limit: 10
      });

      expect(hooksResult.success).toBe(true);
      expect(hooksResult.data).toHaveLength(3); // All groups have 'Hooks' topic
    });
  });

  describe('Code Reviews', () => {
    const mockCodeReview = {
      id: 'review-1',
      submissionId: 'submission-1',
      reviewerId: 'user-2',
      reviewerName: 'Bob',
      status: 'pending',
      comments: [],
      overallFeedback: '',
      createdAt: new Date().toISOString()
    };

    it('requests code review successfully', async () => {
      server.use(
        http.post('/api/collaboration/code-reviews', async ({ request }) => {
          const reviewData = await request.json();
          return HttpResponse.json({
            ...mockCodeReview,
            ...reviewData,
            id: 'new-review-id'
          });
        })
      );

      const reviewRequest = {
        submissionId: 'submission-123',
        reviewerId: 'user-456',
        message: 'Please review my React component'
      };

      const result = await collaborationService.requestCodeReview(reviewRequest);

      expect(result.success).toBe(true);
      expect(result.data?.submissionId).toBe('submission-123');
      expect(result.data?.id).toBe('new-review-id');
    });

    it('submits code review feedback', async () => {
      server.use(
        http.put('/api/collaboration/code-reviews/:id', async ({ request, params }) => {
          const feedback = await request.json();
          return HttpResponse.json({
            ...mockCodeReview,
            id: params.id,
            ...feedback,
            status: 'completed'
          });
        })
      );

      const feedback = {
        comments: [
          {
            line: 15,
            message: 'Consider using useCallback here',
            type: 'suggestion'
          }
        ],
        overallFeedback: 'Good work! Just a few minor improvements.',
        rating: 4
      };

      const result = await collaborationService.submitCodeReview('review-1', feedback);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('completed');
      expect(result.data?.comments).toHaveLength(1);
    });

    it('fetches pending code reviews', async () => {
      const mockReviews = [
        { ...mockCodeReview, id: 'review-1', status: 'pending' },
        { ...mockCodeReview, id: 'review-2', status: 'pending' },
        { ...mockCodeReview, id: 'review-3', status: 'completed' }
      ];

      server.use(
        http.get('/api/collaboration/code-reviews', ({ request }) => {
          const url = new URL(request.url);
          const status = url.searchParams.get('status');
          
          if (status === 'pending') {
            return HttpResponse.json(mockReviews.filter(r => r.status === 'pending'));
          }
          
          return HttpResponse.json(mockReviews);
        })
      );

      const result = await collaborationService.getPendingCodeReviews();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.every(r => r.status === 'pending')).toBe(true);
    });
  });

  describe('Real-time Collaboration', () => {
    it('sends chat message successfully', async () => {
      server.use(
        http.post('/api/collaboration/chat/messages', async ({ request }) => {
          const messageData = await request.json();
          return HttpResponse.json({
            id: 'msg-123',
            ...messageData,
            timestamp: new Date().toISOString()
          });
        })
      );

      const message = {
        roomId: 'room-1',
        content: 'Hello everyone!',
        type: 'text'
      };

      const result = await collaborationService.sendChatMessage(message);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Hello everyone!');
      expect(result.data?.id).toBe('msg-123');
    });

    it('fetches chat history', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          userId: 'user-1',
          username: 'Alice',
          content: 'Hello!',
          type: 'text',
          timestamp: new Date().toISOString()
        },
        {
          id: 'msg-2',
          userId: 'user-2',
          username: 'Bob',
          content: 'Hi Alice!',
          type: 'text',
          timestamp: new Date(Date.now() - 60000).toISOString()
        }
      ];

      server.use(
        http.get('/api/collaboration/chat/:roomId/messages', ({ params, request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const before = url.searchParams.get('before');
          
          let messages = mockMessages.filter(m => m.id.includes(params.roomId as string));
          
          if (before) {
            messages = messages.filter(m => new Date(m.timestamp) < new Date(before));
          }
          
          return HttpResponse.json(messages.slice(0, limit));
        })
      );

      const result = await collaborationService.getChatHistory('room-1', {
        limit: 20,
        before: new Date().toISOString()
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].content).toBe('Hello!');
    });

    it('shares screen session', async () => {
      server.use(
        http.post('/api/collaboration/screen-share', async ({ request }) => {
          const sessionData = await request.json();
          return HttpResponse.json({
            sessionId: 'screen-session-123',
            ...sessionData,
            status: 'active'
          });
        })
      );

      const sessionData = {
        roomId: 'room-1',
        type: 'code-editor',
        permissions: ['view', 'edit']
      };

      const result = await collaborationService.startScreenShare(sessionData);

      expect(result.success).toBe(true);
      expect(result.data?.sessionId).toBe('screen-session-123');
      expect(result.data?.status).toBe('active');
    });
  });

  describe('Progress Sharing', () => {
    it('shares progress update successfully', async () => {
      server.use(
        http.post('/api/collaboration/progress-sharing', async ({ request }) => {
          const progressData = await request.json();
          return HttpResponse.json({
            id: 'progress-123',
            ...progressData,
            timestamp: new Date().toISOString()
          });
        })
      );

      const progressUpdate = {
        type: 'achievement',
        title: 'Completed React Hooks Module',
        description: 'Just finished learning about useEffect and useState!',
        visibility: 'study_group',
        studyGroupId: 'group-1'
      };

      const result = await collaborationService.shareProgress(progressUpdate);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Completed React Hooks Module');
      expect(result.data?.id).toBe('progress-123');
    });

    it('fetches progress feed', async () => {
      const mockProgressUpdates = [
        {
          id: 'progress-1',
          userId: 'user-1',
          username: 'Alice',
          type: 'achievement',
          title: 'Completed JavaScript Basics',
          timestamp: new Date().toISOString()
        },
        {
          id: 'progress-2',
          userId: 'user-2',
          username: 'Bob',
          type: 'milestone',
          title: 'Reached Level 5',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      server.use(
        http.get('/api/collaboration/progress-sharing/feed', ({ request }) => {
          const url = new URL(request.url);
          const studyGroupId = url.searchParams.get('studyGroupId');
          const limit = parseInt(url.searchParams.get('limit') || '20');
          
          let updates = mockProgressUpdates;
          
          if (studyGroupId) {
            // Filter by study group (mock implementation)
            updates = updates.filter(u => u.id.includes(studyGroupId));
          }
          
          return HttpResponse.json(updates.slice(0, limit));
        })
      );

      const result = await collaborationService.getProgressFeed({
        studyGroupId: 'group-1',
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].type).toBe('achievement');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      server.use(
        http.get('/api/collaboration/study-groups', () => {
          return HttpResponse.error();
        })
      );

      const result = await collaborationService.searchStudyGroups({
        search: 'React',
        limit: 10
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('handles API validation errors', async () => {
      server.use(
        http.post('/api/collaboration/study-groups', () => {
          return HttpResponse.json(
            { 
              error: 'Validation failed',
              details: {
                name: 'Name is required',
                description: 'Description must be at least 10 characters'
              }
            },
            { status: 400 }
          );
        })
      );

      const result = await collaborationService.createStudyGroup({
        name: '',
        description: 'Short',
        isPublic: true
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
      expect(result.validationErrors).toEqual({
        name: 'Name is required',
        description: 'Description must be at least 10 characters'
      });
    });

    it('handles authentication errors', async () => {
      server.use(
        http.get('/api/collaboration/study-groups', () => {
          return HttpResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      const result = await collaborationService.searchStudyGroups({
        search: 'React',
        limit: 10
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(result.requiresAuth).toBe(true);
    });

    it('handles rate limiting', async () => {
      server.use(
        http.post('/api/collaboration/chat/messages', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          );
        })
      );

      const result = await collaborationService.sendChatMessage({
        roomId: 'room-1',
        content: 'Test message',
        type: 'text'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.retryAfter).toBeDefined();
    });
  });

  describe('Request Cancellation', () => {
    it('supports request cancellation', async () => {
      server.use(
        http.get('/api/collaboration/study-groups', async () => {
          // Simulate slow request
          await new Promise(resolve => setTimeout(resolve, 2000));
          return HttpResponse.json([]);
        })
      );

      const abortController = new AbortController();
      
      const resultPromise = collaborationService.searchStudyGroups(
        { search: 'React', limit: 10 },
        { signal: abortController.signal }
      );

      // Cancel request after 100ms
      setTimeout(() => abortController.abort(), 100);

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('cancelled');
    });
  });
});
