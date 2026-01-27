import { faker } from '@faker-js/faker';
import { Factory } from 'factory.ts';
import type { 
  UserProfile, 
  LearningSession, 
  Curriculum, 
  Task, 
  Exercise,
  Submission,
  Achievement
} from '@/types/api';

// User Profile Factory
export const mockUserProfile = Factory.define<UserProfile>(() => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  username: faker.internet.userName(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  avatar: faker.image.avatar(),
  skillLevel: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced', 'expert']),
  learningGoals: faker.helpers.arrayElements([
    'JavaScript', 'React', 'TypeScript', 'Node.js', 'Python', 'Go'
  ], { min: 1, max: 3 }),
  timeConstraints: {
    hoursPerWeek: faker.number.int({ min: 5, max: 40 }),
    preferredTimes: faker.helpers.arrayElements([
      'morning', 'afternoon', 'evening', 'night'
    ], { min: 1, max: 2 })
  },
  preferences: {
    theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
    notifications: faker.datatype.boolean(),
    language: 'en'
  },
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString()
}));

// Learning Session Factory
export const mockLearningSession = Factory.define<LearningSession>(() => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  currentTask: mockTask(),
  progress: {
    totalTasks: faker.number.int({ min: 20, max: 100 }),
    completedTasks: faker.number.int({ min: 0, max: 50 }),
    currentStreak: faker.number.int({ min: 0, max: 30 }),
    xp: faker.number.int({ min: 0, max: 10000 }),
    level: faker.number.int({ min: 1, max: 20 })
  },
  startedAt: faker.date.recent().toISOString(),
  lastActivity: faker.date.recent().toISOString()
}));

// Curriculum Factory
export const mockCurriculum = Factory.define<Curriculum>(() => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
  estimatedHours: faker.number.int({ min: 10, max: 100 }),
  topics: faker.helpers.arrayElements([
    'Variables and Data Types',
    'Functions and Scope',
    'Objects and Arrays',
    'Async Programming',
    'Error Handling',
    'Testing',
    'Performance Optimization'
  ], { min: 3, max: 7 }),
  modules: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
    id: faker.string.uuid(),
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    order: faker.number.int({ min: 1, max: 10 }),
    tasks: mockTasks(faker.number.int({ min: 2, max: 6 }))
  })),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString()
}));

// Task Factory
export const mockTask = Factory.define<Task>(() => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(4),
  description: faker.lorem.paragraph(),
  type: faker.helpers.arrayElement(['exercise', 'reading', 'video', 'project']),
  difficulty: faker.number.int({ min: 1, max: 10 }),
  estimatedMinutes: faker.number.int({ min: 15, max: 120 }),
  prerequisites: [],
  learningObjectives: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
    faker.lorem.sentence()
  ),
  resources: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
    title: faker.lorem.words(3),
    url: faker.internet.url(),
    type: faker.helpers.arrayElement(['documentation', 'tutorial', 'video', 'article'])
  })),
  status: faker.helpers.arrayElement(['not_started', 'in_progress', 'completed', 'skipped']),
  completedAt: faker.datatype.boolean() ? faker.date.recent().toISOString() : null,
  createdAt: faker.date.past().toISOString()
}));

// Tasks array factory
export const mockTasks = (count: number = 5): Task[] => {
  return Array.from({ length: count }, () => mockTask());
};

// Exercise Factory
export const mockExercise = Factory.define<Exercise>(() => ({
  id: faker.string.uuid(),
  taskId: faker.string.uuid(),
  title: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  instructions: faker.lorem.paragraphs(2),
  starterCode: `// ${faker.lorem.sentence()}\nfunction solution() {\n  // Your code here\n}`,
  solution: `function solution() {\n  return "${faker.lorem.word()}";\n}`,
  testCases: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
    input: faker.lorem.word(),
    expected: faker.lorem.word(),
    description: faker.lorem.sentence()
  })),
  hints: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
    faker.lorem.sentence()
  ),
  difficulty: faker.number.int({ min: 1, max: 10 }),
  language: faker.helpers.arrayElement(['javascript', 'typescript', 'python']),
  timeLimit: faker.number.int({ min: 300, max: 3600 }), // 5 minutes to 1 hour
  createdAt: faker.date.past().toISOString()
}));

// Submission Factory
export const mockSubmission = Factory.define<Submission>(() => ({
  id: faker.string.uuid(),
  exerciseId: faker.string.uuid(),
  userId: faker.string.uuid(),
  code: `function solution() {\n  return "${faker.lorem.word()}";\n}`,
  language: faker.helpers.arrayElement(['javascript', 'typescript', 'python']),
  status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
  result: faker.datatype.boolean() ? {
    passed: faker.datatype.boolean(),
    score: faker.number.int({ min: 0, max: 100 }),
    executionTime: faker.number.int({ min: 10, max: 5000 }),
    memoryUsed: faker.number.int({ min: 1, max: 100 }),
    testResults: Array.from({ length: 3 }, () => ({
      name: faker.lorem.words(2),
      passed: faker.datatype.boolean(),
      message: faker.lorem.sentence(),
      executionTime: faker.number.int({ min: 1, max: 100 })
    })),
    feedback: faker.lorem.paragraph()
  } : null,
  submittedAt: faker.date.recent().toISOString(),
  completedAt: faker.datatype.boolean() ? faker.date.recent().toISOString() : null
}));

// Achievement Factory
export const mockAchievement = Factory.define<Achievement>(() => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  icon: faker.helpers.arrayElement(['🎯', '🏆', '🔥', '⭐', '💎', '🚀']),
  category: faker.helpers.arrayElement(['progress', 'streak', 'skill', 'social']),
  requirements: {
    type: faker.helpers.arrayElement(['tasks_completed', 'streak_days', 'score_average']),
    target: faker.number.int({ min: 1, max: 100 })
  },
  xpReward: faker.number.int({ min: 50, max: 500 }),
  rarity: faker.helpers.arrayElement(['common', 'rare', 'epic', 'legendary']),
  unlockedAt: faker.datatype.boolean() ? faker.date.recent().toISOString() : null,
  createdAt: faker.date.past().toISOString()
}));

// Utility functions for creating specific test scenarios
export const createUserWithProfile = (overrides: Partial<UserProfile> = {}): UserProfile => {
  return mockUserProfile(overrides);
};

export const createBeginnerUser = (): UserProfile => {
  return mockUserProfile({
    skillLevel: 'beginner',
    learningGoals: ['JavaScript'],
    timeConstraints: {
      hoursPerWeek: 10,
      preferredTimes: ['evening']
    }
  });
};

export const createAdvancedUser = (): UserProfile => {
  return mockUserProfile({
    skillLevel: 'advanced',
    learningGoals: ['React', 'TypeScript', 'Node.js'],
    timeConstraints: {
      hoursPerWeek: 20,
      preferredTimes: ['morning', 'evening']
    }
  });
};

export const createCompletedTask = (): Task => {
  return mockTask({
    status: 'completed',
    completedAt: faker.date.recent().toISOString()
  });
};

export const createInProgressTask = (): Task => {
  return mockTask({
    status: 'in_progress',
    completedAt: null
  });
};

export const createFailedSubmission = (): Submission => {
  return mockSubmission({
    status: 'completed',
    result: {
      passed: false,
      score: faker.number.int({ min: 0, max: 50 }),
      executionTime: faker.number.int({ min: 10, max: 1000 }),
      memoryUsed: faker.number.int({ min: 1, max: 50 }),
      testResults: [
        {
          name: 'Test 1',
          passed: false,
          message: 'Expected "hello" but got "world"',
          executionTime: 50
        }
      ],
      feedback: 'Your solution has some issues. Try checking the logic again.'
    }
  });
};

export const createSuccessfulSubmission = (): Submission => {
  return mockSubmission({
    status: 'completed',
    result: {
      passed: true,
      score: faker.number.int({ min: 80, max: 100 }),
      executionTime: faker.number.int({ min: 10, max: 500 }),
      memoryUsed: faker.number.int({ min: 1, max: 30 }),
      testResults: [
        {
          name: 'Test 1',
          passed: true,
          message: 'Passed',
          executionTime: 25
        },
        {
          name: 'Test 2',
          passed: true,
          message: 'Passed',
          executionTime: 30
        }
      ],
      feedback: 'Excellent work! Your solution is correct and efficient.'
    }
  });
};