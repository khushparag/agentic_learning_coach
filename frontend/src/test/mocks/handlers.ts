import { http, HttpResponse } from 'msw';
import { mockUserProfile, mockLearningSession, mockCurriculum, mockTasks } from '../factories';

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: mockUserProfile(),
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json(mockUserProfile());
  }),

  // User profile endpoints
  http.get('/api/users/profile', () => {
    return HttpResponse.json(mockUserProfile());
  }),

  http.put('/api/users/profile', async ({ request }) => {
    const updates = await request.json();
    return HttpResponse.json({
      ...mockUserProfile(),
      ...updates
    });
  }),

  // Learning session endpoints
  http.get('/api/learning/session', () => {
    return HttpResponse.json(mockLearningSession());
  }),

  http.post('/api/learning/session/start', () => {
    return HttpResponse.json(mockLearningSession());
  }),

  // Curriculum endpoints
  http.get('/api/curriculum', () => {
    return HttpResponse.json([mockCurriculum()]);
  }),

  http.get('/api/curriculum/:id', ({ params }) => {
    return HttpResponse.json({
      ...mockCurriculum(),
      id: params.id
    });
  }),

  http.post('/api/curriculum', async ({ request }) => {
    const curriculum = await request.json();
    return HttpResponse.json({
      ...mockCurriculum(),
      ...curriculum,
      id: 'new-curriculum-id'
    });
  }),

  // Tasks endpoints
  http.get('/api/tasks', () => {
    return HttpResponse.json(mockTasks(5));
  }),

  http.get('/api/tasks/:id', ({ params }) => {
    const tasks = mockTasks(1);
    return HttpResponse.json({
      ...tasks[0],
      id: params.id
    });
  }),

  http.post('/api/tasks', async ({ request }) => {
    const task = await request.json();
    return HttpResponse.json({
      ...mockTasks(1)[0],
      ...task,
      id: 'new-task-id'
    });
  }),

  http.put('/api/tasks/:id', async ({ request, params }) => {
    const updates = await request.json();
    return HttpResponse.json({
      ...mockTasks(1)[0],
      ...updates,
      id: params.id
    });
  }),

  // Submissions endpoints
  http.post('/api/submissions', async ({ request }) => {
    const submission = await request.json();
    return HttpResponse.json({
      id: 'submission-id',
      ...submission,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  }),

  http.get('/api/submissions/:id/result', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      passed: true,
      score: 95,
      feedback: 'Great work! Your solution is correct and efficient.',
      testResults: [
        { name: 'Test 1', passed: true, message: 'Passed' },
        { name: 'Test 2', passed: true, message: 'Passed' }
      ]
    });
  }),

  // Progress endpoints
  http.get('/api/progress', () => {
    return HttpResponse.json({
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
    });
  }),

  // Analytics endpoints
  http.get('/api/analytics/dashboard', () => {
    return HttpResponse.json({
      learningVelocity: {
        current: 4.2,
        trend: 'increasing',
        data: [3.1, 3.5, 3.8, 4.0, 4.2]
      },
      knowledgeRetention: {
        overall: 87,
        byTopic: [
          { topic: 'JavaScript', retention: 92 },
          { topic: 'React', retention: 85 },
          { topic: 'TypeScript', retention: 89 }
        ]
      },
      performanceMetrics: {
        averageScore: 88,
        completionRate: 94,
        timeToComplete: 45
      }
    });
  }),

  // Gamification endpoints
  http.get('/api/gamification/achievements', () => {
    return HttpResponse.json([
      {
        id: 'first-submission',
        name: 'First Steps',
        description: 'Complete your first exercise',
        icon: '🎯',
        unlockedAt: new Date().toISOString()
      },
      {
        id: 'week-streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        unlockedAt: null
      }
    ]);
  }),

  // Social endpoints
  http.get('/api/social/leaderboard', () => {
    return HttpResponse.json([
      { rank: 1, username: 'CodeMaster', xp: 5420, avatar: null },
      { rank: 2, username: 'DevNinja', xp: 4890, avatar: null },
      { rank: 3, username: 'JSWizard', xp: 4320, avatar: null }
    ]);
  }),

  // Error simulation endpoints for testing error handling
  http.get('/api/error/500', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }),

  http.get('/api/error/404', () => {
    return HttpResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }),

  http.get('/api/error/network', () => {
    return HttpResponse.error();
  })
];
