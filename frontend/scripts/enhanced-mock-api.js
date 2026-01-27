#!/usr/bin/env node

/**
 * Enhanced Mock API Server for Development
 * 
 * Provides comprehensive mock endpoints that mirror the real API structure
 * with realistic data and proper error handling for development testing.
 * 
 * Features:
 * - Full CRUD operations for all entities
 * - Realistic data generation with @faker-js/faker
 * - Proper HTTP status codes and error responses
 * - CORS support for cross-origin requests
 * - Request/response logging for debugging
 * - Configurable delays for testing loading states
 * - WebSocket simulation for real-time features
 * - Clean architecture following SOLID principles
 */

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { faker } from '@faker-js/faker'

// Configuration following clean architecture principles
const config = {
  port: parseInt(process.env.PORT || '3001'),
  delay: parseInt(process.env.MOCK_DELAY || '0'),
  enableLogging: process.env.MOCK_LOGGING !== 'false',
  enableErrors: process.env.MOCK_ERRORS === 'true',
  errorRate: parseFloat(process.env.MOCK_ERROR_RATE || '0.1'),
  enableWebSocket: process.env.MOCK_WEBSOCKET !== 'false'
}

// Express app setup
const app = express()
const server = createServer(app)

// WebSocket setup for real-time features
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Middleware setup
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
  if (config.enableLogging) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${req.method} ${req.path}`)
    
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`  Body:`, JSON.stringify(req.body, null, 2))
    }
  }
  next()
})


// Delay middleware for testing loading states
app.use((req, res, next) => {
  if (config.delay > 0) {
    setTimeout(next, config.delay)
  } else {
    next()
  }
})

// Error simulation middleware
app.use((req, res, next) => {
  if (config.enableErrors && Math.random() < config.errorRate) {
    const errorTypes = [
      { status: 500, message: 'Internal server error' },
      { status: 503, message: 'Service temporarily unavailable' },
      { status: 429, message: 'Rate limit exceeded' }
    ]
    
    const error = faker.helpers.arrayElement(errorTypes)
    return res.status(error.status).json({
      success: false,
      error: error.message,
      message: 'This is a simulated error for testing purposes',
      timestamp: new Date().toISOString()
    })
  }
  next()
})

// In-memory data store following clean architecture
const store = {
  users: [],
  profiles: [],
  curricula: [],
  exercises: [],
  submissions: [],
  progress: [],
  achievements: [],
  leaderboard: [],
  notifications: [],
  sessions: []
}

// Data generators following the Result pattern
class DataGenerators {
  static user() {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      avatar: faker.image.avatar(),
      emailVerified: faker.datatype.boolean(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  static profile(userId) {
    return {
      id: faker.string.uuid(),
      userId,
      skillLevel: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced', 'expert']),
      learningStyle: faker.helpers.arrayElement(['visual', 'auditory', 'kinesthetic', 'reading']),
      goals: faker.helpers.arrayElements(['javascript', 'react', 'typescript', 'node.js', 'python', 'java'], { min: 1, max: 4 }),
      timeConstraints: {
        hoursPerWeek: faker.number.int({ min: 2, max: 20 }),
        preferredTimes: faker.helpers.arrayElements(['morning', 'afternoon', 'evening'], { min: 1, max: 2 }),
        timezone: faker.location.timeZone()
      },
      preferences: {
        theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
        notifications: faker.datatype.boolean(),
        difficulty: faker.helpers.arrayElement(['adaptive', 'fixed']),
        language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de'])
      },
      assessmentCompleted: faker.datatype.boolean(),
      onboardingCompleted: faker.datatype.boolean(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  static curriculum(userId) {
    const totalTopics = faker.number.int({ min: 5, max: 15 })
    const completedTopics = faker.number.int({ min: 0, max: totalTopics })
    return {
      id: faker.string.uuid(),
      userId,
      title: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(['draft', 'active', 'completed', 'paused']),
      totalTopics,
      completedTopics,
      estimatedHours: faker.number.int({ min: 10, max: 100 }),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }


  static exercise(topicId) {
    return {
      id: faker.string.uuid(),
      topicId,
      title: faker.lorem.words(4),
      description: faker.lorem.paragraph(),
      type: faker.helpers.arrayElement(['coding', 'quiz', 'project', 'review']),
      difficultyLevel: faker.number.int({ min: 1, max: 10 }),
      instructions: faker.lorem.paragraphs(2),
      testCases: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
        input: faker.lorem.word(),
        expected: faker.lorem.word()
      })),
      solutionTemplate: `// ${faker.lorem.sentence()}\nfunction solution() {\n  // Your code here\n}`,
      hints: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => faker.lorem.sentence()),
      timeLimitMinutes: faker.number.int({ min: 5, max: 60 }),
      createdAt: faker.date.past().toISOString()
    }
  }

  static submission(userId, exerciseId) {
    return {
      id: faker.string.uuid(),
      userId,
      exerciseId,
      code: `function solution() {\n  return ${faker.lorem.word()};\n}`,
      status: faker.helpers.arrayElement(['pending', 'passed', 'failed', 'needs_review']),
      score: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
      executionTimeMs: faker.number.int({ min: 10, max: 5000 }),
      memoryUsedMb: faker.number.int({ min: 1, max: 512 }),
      submittedAt: faker.date.recent().toISOString(),
      evaluatedAt: faker.date.recent().toISOString()
    }
  }

  static achievement() {
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words(2),
      description: faker.lorem.sentence(),
      icon: faker.helpers.arrayElement(['🏆', '⭐', '🎯', '🚀', '💎', '🔥', '🎖️']),
      category: faker.helpers.arrayElement(['learning', 'streak', 'social', 'mastery']),
      xpReward: faker.number.int({ min: 10, max: 500 }),
      rarity: faker.helpers.arrayElement(['common', 'uncommon', 'rare', 'epic', 'legendary']),
      unlockedAt: faker.date.recent().toISOString()
    }
  }

  static leaderboardEntry(rank) {
    return {
      rank,
      userId: faker.string.uuid(),
      username: faker.internet.userName(),
      avatar: faker.image.avatar(),
      xp: faker.number.int({ min: 100, max: 50000 }),
      level: faker.number.int({ min: 1, max: 50 }),
      streak: faker.number.int({ min: 0, max: 365 }),
      completedExercises: faker.number.int({ min: 0, max: 500 })
    }
  }

  static notification() {
    return {
      id: faker.string.uuid(),
      type: faker.helpers.arrayElement(['achievement', 'reminder', 'social', 'system']),
      title: faker.lorem.words(3),
      message: faker.lorem.sentence(),
      read: faker.datatype.boolean(),
      createdAt: faker.date.recent().toISOString()
    }
  }
}


// Initialize mock data
function initializeStore() {
  // Create users
  for (let i = 0; i < 10; i++) {
    const user = DataGenerators.user()
    store.users.push(user)
    store.profiles.push(DataGenerators.profile(user.id))
    store.curricula.push(DataGenerators.curriculum(user.id))
  }

  // Create exercises
  for (let i = 0; i < 20; i++) {
    store.exercises.push(DataGenerators.exercise(faker.string.uuid()))
  }

  // Create submissions
  store.users.forEach(user => {
    const numSubmissions = faker.number.int({ min: 1, max: 5 })
    for (let i = 0; i < numSubmissions; i++) {
      const exercise = faker.helpers.arrayElement(store.exercises)
      store.submissions.push(DataGenerators.submission(user.id, exercise.id))
    }
  })

  // Create achievements
  for (let i = 0; i < 15; i++) {
    store.achievements.push(DataGenerators.achievement())
  }

  // Create leaderboard
  for (let i = 1; i <= 100; i++) {
    store.leaderboard.push(DataGenerators.leaderboardEntry(i))
  }

  // Create notifications
  for (let i = 0; i < 20; i++) {
    store.notifications.push(DataGenerators.notification())
  }

  console.log('📦 Mock data store initialized')
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      cache: 'connected',
      queue: 'connected'
    }
  })
})

// Users
app.get('/api/users', (req, res) => {
  res.json({ success: true, data: store.users })
})

app.get('/api/users/:id', (req, res) => {
  const user = store.users.find(u => u.id === req.params.id)
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' })
  }
  res.json({ success: true, data: user })
})

app.post('/api/users', (req, res) => {
  const user = { ...DataGenerators.user(), ...req.body }
  store.users.push(user)
  res.status(201).json({ success: true, data: user })
})

// Profiles
app.get('/api/profiles', (req, res) => {
  res.json({ success: true, data: store.profiles })
})

app.get('/api/profiles/:userId', (req, res) => {
  const profile = store.profiles.find(p => p.userId === req.params.userId)
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' })
  }
  res.json({ success: true, data: profile })
})

app.put('/api/profiles/:userId', (req, res) => {
  const index = store.profiles.findIndex(p => p.userId === req.params.userId)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Profile not found' })
  }
  store.profiles[index] = { ...store.profiles[index], ...req.body, updatedAt: new Date().toISOString() }
  res.json({ success: true, data: store.profiles[index] })
})


// Curricula
app.get('/api/curricula', (req, res) => {
  const { userId, status } = req.query
  let curricula = store.curricula
  if (userId) curricula = curricula.filter(c => c.userId === userId)
  if (status) curricula = curricula.filter(c => c.status === status)
  res.json({ success: true, data: curricula })
})

app.get('/api/curricula/:id', (req, res) => {
  const curriculum = store.curricula.find(c => c.id === req.params.id)
  if (!curriculum) {
    return res.status(404).json({ success: false, error: 'Curriculum not found' })
  }
  res.json({ success: true, data: curriculum })
})

app.post('/api/curricula', (req, res) => {
  const curriculum = { ...DataGenerators.curriculum(req.body.userId || faker.string.uuid()), ...req.body }
  store.curricula.push(curriculum)
  res.status(201).json({ success: true, data: curriculum })
})

// Exercises
app.get('/api/exercises', (req, res) => {
  const { type, difficulty } = req.query
  let exercises = store.exercises
  if (type) exercises = exercises.filter(e => e.type === type)
  if (difficulty) exercises = exercises.filter(e => e.difficultyLevel === parseInt(difficulty))
  res.json({ success: true, data: exercises })
})

app.get('/api/exercises/:id', (req, res) => {
  const exercise = store.exercises.find(e => e.id === req.params.id)
  if (!exercise) {
    return res.status(404).json({ success: false, error: 'Exercise not found' })
  }
  res.json({ success: true, data: exercise })
})

// Submissions
app.get('/api/submissions', (req, res) => {
  const { userId, exerciseId, status } = req.query
  let submissions = store.submissions
  if (userId) submissions = submissions.filter(s => s.userId === userId)
  if (exerciseId) submissions = submissions.filter(s => s.exerciseId === exerciseId)
  if (status) submissions = submissions.filter(s => s.status === status)
  res.json({ success: true, data: submissions })
})

app.post('/api/submissions', (req, res) => {
  const submission = {
    ...DataGenerators.submission(req.body.userId, req.body.exerciseId),
    ...req.body,
    status: 'pending'
  }
  store.submissions.push(submission)
  
  // Simulate async evaluation
  setTimeout(() => {
    const index = store.submissions.findIndex(s => s.id === submission.id)
    if (index !== -1) {
      store.submissions[index].status = faker.helpers.arrayElement(['passed', 'failed'])
      store.submissions[index].evaluatedAt = new Date().toISOString()
      
      // Emit WebSocket event
      io.emit('submission:evaluated', store.submissions[index])
    }
  }, 2000)
  
  res.status(201).json({ success: true, data: submission })
})

// Progress
app.get('/api/progress/:userId', (req, res) => {
  const userSubmissions = store.submissions.filter(s => s.userId === req.params.userId)
  const passedSubmissions = userSubmissions.filter(s => s.status === 'passed')
  
  res.json({
    success: true,
    data: {
      userId: req.params.userId,
      totalSubmissions: userSubmissions.length,
      passedSubmissions: passedSubmissions.length,
      averageScore: userSubmissions.length > 0 
        ? userSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / userSubmissions.length 
        : 0,
      streak: faker.number.int({ min: 0, max: 30 }),
      lastActivityAt: faker.date.recent().toISOString()
    }
  })
})


// Achievements
app.get('/api/achievements', (req, res) => {
  res.json({ success: true, data: store.achievements })
})

app.get('/api/achievements/:userId', (req, res) => {
  // Return random subset of achievements for user
  const userAchievements = faker.helpers.arrayElements(store.achievements, { min: 3, max: 10 })
  res.json({ success: true, data: userAchievements })
})

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const { limit = 10, offset = 0 } = req.query
  const data = store.leaderboard.slice(parseInt(offset), parseInt(offset) + parseInt(limit))
  res.json({
    success: true,
    data,
    pagination: {
      total: store.leaderboard.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  })
})

// Notifications
app.get('/api/notifications', (req, res) => {
  const { unreadOnly } = req.query
  let notifications = store.notifications
  if (unreadOnly === 'true') {
    notifications = notifications.filter(n => !n.read)
  }
  res.json({ success: true, data: notifications })
})

app.put('/api/notifications/:id/read', (req, res) => {
  const index = store.notifications.findIndex(n => n.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Notification not found' })
  }
  store.notifications[index].read = true
  res.json({ success: true, data: store.notifications[index] })
})

app.put('/api/notifications/read-all', (req, res) => {
  store.notifications.forEach(n => n.read = true)
  res.json({ success: true, message: 'All notifications marked as read' })
})

// Goals
app.get('/api/goals', (req, res) => {
  res.json({
    success: true,
    data: {
      goals: [
        { id: faker.string.uuid(), title: 'Learn React', progress: 65, target: 100 },
        { id: faker.string.uuid(), title: 'Master TypeScript', progress: 40, target: 100 },
        { id: faker.string.uuid(), title: 'Build 5 Projects', progress: 3, target: 5 }
      ]
    }
  })
})

// Tasks
app.get('/api/tasks/today', (req, res) => {
  res.json({
    success: true,
    data: {
      tasks: [
        { id: faker.string.uuid(), title: 'Complete React Hooks Exercise', completed: false, estimatedMinutes: 30 },
        { id: faker.string.uuid(), title: 'Review TypeScript Generics', completed: true, estimatedMinutes: 20 },
        { id: faker.string.uuid(), title: 'Practice Array Methods', completed: false, estimatedMinutes: 25 }
      ]
    }
  })
})

// Gamification
app.get('/api/gamification/profile/:userId', (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.params.userId,
      level: faker.number.int({ min: 1, max: 50 }),
      xp: faker.number.int({ min: 0, max: 50000 }),
      xpToNextLevel: faker.number.int({ min: 100, max: 1000 }),
      streak: faker.number.int({ min: 0, max: 100 }),
      longestStreak: faker.number.int({ min: 0, max: 365 }),
      badges: faker.helpers.arrayElements(['🏆', '⭐', '🎯', '🚀', '💎', '🔥'], { min: 2, max: 6 }),
      recent_xp_events: [
        { type: 'exercise_completed', xp: 50, timestamp: faker.date.recent().toISOString() },
        { type: 'streak_bonus', xp: 25, timestamp: faker.date.recent().toISOString() }
      ]
    }
  })
})


// Analytics
app.get('/api/analytics/insights/:userId', (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.params.userId,
      efficiencyScore: faker.number.float({ min: 0.5, max: 1.0, fractionDigits: 2 }),
      learningPatterns: {
        bestTimeOfDay: faker.helpers.arrayElement(['morning', 'afternoon', 'evening']),
        averageSessionLength: faker.number.int({ min: 15, max: 90 }),
        consistencyScore: faker.number.float({ min: 0.3, max: 1.0, fractionDigits: 2 })
      },
      retentionAnalysis: {
        overallRetention: faker.number.float({ min: 0.6, max: 0.95, fractionDigits: 2 }),
        criticalCount: faker.number.int({ min: 0, max: 5 }),
        needsReview: faker.helpers.arrayElements(['Arrays', 'Promises', 'Closures'], { min: 0, max: 3 })
      },
      recommendations: [
        'Focus on practicing async/await patterns',
        'Review array methods for better retention',
        'Consider shorter, more frequent study sessions'
      ]
    }
  })
})

// Social
app.get('/api/social/challenges/:userId', (req, res) => {
  res.json({
    success: true,
    data: {
      active: faker.number.int({ min: 0, max: 5 }),
      pending: faker.number.int({ min: 0, max: 3 }),
      won: faker.number.int({ min: 0, max: 20 }),
      challenges: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
        id: faker.string.uuid(),
        title: faker.lorem.words(3),
        opponent: faker.internet.userName(),
        status: faker.helpers.arrayElement(['active', 'pending', 'completed']),
        createdAt: faker.date.recent().toISOString()
      }))
    }
  })
})

app.get('/api/social/solutions/:userId', (req, res) => {
  res.json({
    success: true,
    data: {
      shared: faker.number.int({ min: 0, max: 50 }),
      totalLikes: faker.number.int({ min: 0, max: 500 }),
      solutions: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () => ({
        id: faker.string.uuid(),
        exerciseTitle: faker.lorem.words(3),
        likes: faker.number.int({ min: 0, max: 100 }),
        comments: faker.number.int({ min: 0, max: 20 }),
        sharedAt: faker.date.recent().toISOString()
      }))
    }
  })
})

app.get('/api/social/groups/:userId', (req, res) => {
  res.json({
    success: true,
    data: {
      joined: faker.number.int({ min: 0, max: 10 }),
      groups: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
        id: faker.string.uuid(),
        name: faker.lorem.words(2),
        members: faker.number.int({ min: 5, max: 100 }),
        activity: faker.helpers.arrayElement(['high', 'medium', 'low'])
      }))
    }
  })
})

app.get('/api/social/activity/:userId', (req, res) => {
  res.json({
    success: true,
    data: Array.from({ length: faker.number.int({ min: 5, max: 20 }) }, () => ({
      id: faker.string.uuid(),
      type: faker.helpers.arrayElement(['challenge_completed', 'solution_shared', 'badge_earned', 'group_joined']),
      message: faker.lorem.sentence(),
      timestamp: faker.date.recent().toISOString()
    }))
  })
})

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id)
  
  socket.on('join:room', (room) => {
    socket.join(room)
    console.log(`📍 Socket ${socket.id} joined room: ${room}`)
  })
  
  socket.on('leave:room', (room) => {
    socket.leave(room)
    console.log(`📍 Socket ${socket.id} left room: ${room}`)
  })
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id)
  })
})

// Simulate real-time events
if (config.enableWebSocket) {
  setInterval(() => {
    // Random progress update
    io.emit('progress:update', {
      type: 'xp_gained',
      amount: faker.number.int({ min: 5, max: 50 }),
      timestamp: new Date().toISOString()
    })
  }, 30000) // Every 30 seconds
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  })
})

// Initialize and start server
initializeStore()

server.listen(config.port, () => {
  console.log(`
🚀 Enhanced Mock API Server running!
   
   URL: http://localhost:${config.port}
   
   Configuration:
   - Logging: ${config.enableLogging ? 'enabled' : 'disabled'}
   - Delay: ${config.delay}ms
   - Error simulation: ${config.enableErrors ? `enabled (${config.errorRate * 100}% rate)` : 'disabled'}
   - WebSocket: ${config.enableWebSocket ? 'enabled' : 'disabled'}
   
   Available endpoints:
   - GET  /api/health
   - GET  /api/users
   - GET  /api/profiles/:userId
   - GET  /api/curricula
   - GET  /api/exercises
   - POST /api/submissions
   - GET  /api/progress/:userId
   - GET  /api/achievements
   - GET  /api/leaderboard
   - GET  /api/notifications
   - GET  /api/goals
   - GET  /api/tasks/today
   - GET  /api/gamification/profile/:userId
   - GET  /api/analytics/insights/:userId
   - GET  /api/social/challenges/:userId
  `)
})

export default app
