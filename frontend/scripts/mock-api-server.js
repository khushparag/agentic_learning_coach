#!/usr/bin/env node

/**
 * Mock API Server for E2E Testing
 * Provides realistic API responses for testing without backend dependency
 */

const express = require('express');
const cors = require('cors');
const { faker } = require('@faker-js/faker');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Mock data generators
const generateUser = () => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  avatar: faker.image.avatar(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString()
});

const generateLearningProfile = () => ({
  id: faker.string.uuid(),
  skillLevel: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
  goals: faker.helpers.arrayElements(['javascript', 'react', 'typescript', 'node.js'], { min: 1, max: 3 }),
  timeConstraints: {
    hoursPerWeek: faker.number.int({ min: 2, max: 20 }),
    preferredTimes: faker.helpers.arrayElements(['morning', 'afternoon', 'evening'], { min: 1, max: 2 })
  },
  preferences: {
    learningStyle: faker.helpers.arrayElement(['visual', 'auditory', 'kinesthetic']),
    difficulty: faker.helpers.arrayElement(['adaptive', 'challenging', 'comfortable'])
  }
});

const generateExercise = () => ({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  difficulty: faker.number.int({ min: 1, max: 10 }),
  type: faker.helpers.arrayElement(['coding', 'quiz', 'project']),
  language: faker.helpers.arrayElement(['javascript', 'typescript', 'python']),
  instructions: faker.lorem.paragraphs(2),
  starterCode: `// ${faker.lorem.sentence()}\nfunction solution() {\n  // Your code here\n}`,
  testCases: Array.from({ length: 3 }, () => ({
    input: faker.lorem.word(),
    expected: faker.lorem.word(),
    description: faker.lorem.sentence()
  })),
  hints: Array.from({ length: 2 }, () => faker.lorem.sentence()),
  createdAt: faker.date.past().toISOString()
});

const generateSubmission = () => ({
  id: faker.string.uuid(),
  exerciseId: faker.string.uuid(),
  code: `function solution() {\n  return "${faker.lorem.word()}";\n}`,
  status: faker.helpers.arrayElement(['pending', 'passed', 'failed']),
  score: faker.number.int({ min: 0, max: 100 }),
  feedback: {
    passed: faker.datatype.boolean(),
    message: faker.lorem.sentence(),
    suggestions: Array.from({ length: 2 }, () => faker.lorem.sentence())
  },
  submittedAt: faker.date.recent().toISOString(),
  evaluatedAt: faker.date.recent().toISOString()
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'test'
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // Mock successful login
  res.json({
    user: generateUser(),
    token: faker.string.alphanumeric(64),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name required' });
  }
  
  res.status(201).json({
    user: generateUser(),
    token: faker.string.alphanumeric(64),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
});

// User profile endpoints
app.get('/api/profile', (req, res) => {
  res.json({
    user: generateUser(),
    profile: generateLearningProfile()
  });
});

app.put('/api/profile', (req, res) => {
  res.json({
    user: generateUser(),
    profile: { ...generateLearningProfile(), ...req.body }
  });
});

// Exercise endpoints
app.get('/api/exercises', (req, res) => {
  const { page = 1, limit = 10, difficulty, type } = req.query;
  const exercises = Array.from({ length: parseInt(limit) }, generateExercise);
  
  res.json({
    exercises,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 100,
      pages: 10
    }
  });
});

app.get('/api/exercises/:id', (req, res) => {
  res.json(generateExercise());
});

app.post('/api/exercises/:id/submit', (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }
  
  // Simulate evaluation delay
  setTimeout(() => {
    res.json(generateSubmission());
  }, faker.number.int({ min: 500, max: 2000 }));
});

// Submission endpoints
app.get('/api/submissions', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const submissions = Array.from({ length: parseInt(limit) }, generateSubmission);
  
  res.json({
    submissions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 50,
      pages: 5
    }
  });
});

app.get('/api/submissions/:id', (req, res) => {
  res.json(generateSubmission());
});

// Progress endpoints
app.get('/api/progress', (req, res) => {
  res.json({
    totalExercises: 100,
    completedExercises: faker.number.int({ min: 10, max: 80 }),
    averageScore: faker.number.int({ min: 60, max: 95 }),
    streak: faker.number.int({ min: 0, max: 30 }),
    weeklyProgress: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      exercisesCompleted: faker.number.int({ min: 0, max: 5 }),
      timeSpent: faker.number.int({ min: 0, max: 120 })
    }))
  });
});

// Curriculum endpoints
app.get('/api/curriculum', (req, res) => {
  res.json({
    id: faker.string.uuid(),
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript programming',
    modules: Array.from({ length: 5 }, () => ({
      id: faker.string.uuid(),
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      exercises: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, generateExercise)
    }))
  });
});

// Analytics endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    totalUsers: faker.number.int({ min: 1000, max: 10000 }),
    activeUsers: faker.number.int({ min: 100, max: 1000 }),
    exercisesCompleted: faker.number.int({ min: 5000, max: 50000 }),
    averageCompletionRate: faker.number.float({ min: 0.6, max: 0.9, fractionDigits: 2 }),
    performanceMetrics: {
      responseTime: faker.number.int({ min: 100, max: 500 }),
      errorRate: faker.number.float({ min: 0.001, max: 0.05, fractionDigits: 3 }),
      uptime: faker.number.float({ min: 0.99, max: 1.0, fractionDigits: 4 })
    }
  });
});

// Error simulation endpoints (for testing error handling)
app.get('/api/error/500', (req, res) => {
  res.status(500).json({ error: 'Internal server error' });
});

app.get('/api/error/timeout', (req, res) => {
  // Never respond to simulate timeout
});

app.get('/api/error/rate-limit', (req, res) => {
  res.status(429).json({ error: 'Rate limit exceeded' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down mock API server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down mock API server...');
  process.exit(0);
});