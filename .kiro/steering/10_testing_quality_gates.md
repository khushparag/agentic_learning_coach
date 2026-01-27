# Testing Strategy & Quality Gates

## Testing Pyramid

### MUST Follow Testing Hierarchy
```
    E2E Tests (5%)
   ┌─────────────────┐
   │ Integration (15%) │
   └─────────────────┘
  ┌───────────────────────┐
  │   Unit Tests (80%)    │
  └───────────────────────┘
```

### Unit Testing Requirements
**MUST** achieve 90%+ coverage for:
- Agent business logic
- Exercise generation algorithms
- Feedback generation systems
- Progress tracking calculations
- Security validation functions

```typescript
// ✅ Good: Comprehensive unit test
describe('ExerciseGeneratorAgent', () => {
  let generator: ExerciseGeneratorAgent;
  let mockResourcesAgent: jest.Mocked<ResourcesAgent>;
  
  beforeEach(() => {
    mockResourcesAgent = createMockResourcesAgent();
    generator = new ExerciseGeneratorAgent(mockResourcesAgent);
  });
  
  describe('createExercise', () => {
    it('should generate appropriate difficulty for beginner level', async () => {
      const context: LearningContext = {
        userId: 'test-user',
        skillLevel: 1,
        currentObjective: 'variables',
        learningGoals: ['javascript-basics']
      };
      
      const exercise = await generator.createExercise(context);
      
      expect(exercise.difficultyLevel).toBe(1);
      expect(exercise.instructions).toContain('variable');
      expect(exercise.testCases).toHaveLength(3);
      expect(exercise.hints).toHaveLength(2);
    });
    
    it('should adapt difficulty based on consecutive failures', async () => {
      const context: LearningContext = {
        userId: 'test-user',
        skillLevel: 3,
        currentObjective: 'loops',
        attemptCount: 3,
        lastFeedback: { passed: false, consecutiveFailures: 2 }
      };
      
      const exercise = await generator.createExercise(context);
      
      expect(exercise.difficultyLevel).toBe(2); // Reduced from 3
      expect(exercise.type).toBe('recap');
    });
  });
});
```

## Integration Testing

### Agent Communication Testing
```typescript
describe('Agent Integration', () => {
  let orchestrator: OrchestratorAgent;
  let profileAgent: ProfileAgent;
  let curriculumAgent: CurriculumPlannerAgent;
  
  beforeEach(async () => {
    // Use test database
    await setupTestDatabase();
    
    orchestrator = new OrchestratorAgent();
    profileAgent = new ProfileAgent();
    curriculumAgent = new CurriculumPlannerAgent();
  });
  
  it('should complete full onboarding workflow', async () => {
    const userId = 'test-user-123';
    
    // Step 1: Profile assessment
    const profileResult = await orchestrator.routeMessage({
      intent: LearningIntent.ASSESS_SKILL_LEVEL,
      userId,
      payload: { responses: mockDiagnosticResponses }
    });
    
    expect(profileResult.success).toBe(true);
    expect(profileResult.data.skillLevel).toBe('intermediate');
    
    // Step 2: Curriculum creation
    const curriculumResult = await orchestrator.routeMessage({
      intent: LearningIntent.CREATE_LEARNING_PATH,
      userId,
      payload: { goals: ['react', 'typescript'] }
    });
    
    expect(curriculumResult.success).toBe(true);
    expect(curriculumResult.data.topics).toHaveLength(8);
    
    // Verify database state
    const savedProfile = await profileRepository.findByUserId(userId);
    expect(savedProfile.skillLevel).toBe('intermediate');
  });
});
```

### Database Integration Testing
```typescript
describe('Database Operations', () => {
  beforeEach(async () => {
    await truncateTestTables();
  });
  
  it('should maintain data consistency across agent operations', async () => {
    const userId = 'test-user';
    
    // Create user and profile
    const user = await userRepository.create({
      email: 'test@example.com',
      passwordHash: 'hashed'
    });
    
    const profile = await profileRepository.create({
      userId: user.id,
      skillLevel: 'beginner',
      goals: ['javascript'],
      timeConstraints: { hoursPerWeek: 5 }
    });
    
    // Create curriculum
    const curriculum = await curriculumRepository.create({
      userId: user.id,
      title: 'JavaScript Fundamentals',
      topics: mockTopics
    });
    
    // Verify relationships
    const userWithProfile = await userRepository.findWithProfile(user.id);
    expect(userWithProfile.profile.id).toBe(profile.id);
    expect(userWithProfile.curricula).toHaveLength(1);
  });
});
```

## End-to-End Testing

### Learning Journey Testing
```typescript
describe('Complete Learning Journey', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await chromium.launch();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await setupTestUser();
  });
  
  it('should complete full learning session', async () => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    
    // Start learning session
    await page.waitForSelector('[data-testid=dashboard]');
    await page.click('[data-testid=continue-learning]');
    
    // Complete exercise
    await page.waitForSelector('[data-testid=code-editor]');
    await page.fill('[data-testid=code-editor]', validSolution);
    await page.click('[data-testid=submit-code]');
    
    // Verify feedback
    await page.waitForSelector('[data-testid=feedback]');
    const feedback = await page.textContent('[data-testid=feedback]');
    expect(feedback).toContain('Correct!');
    
    // Verify progress update
    const progress = await page.textContent('[data-testid=progress]');
    expect(progress).toContain('1/10 completed');
  });
});
```

## Quality Gates

### Pre-Commit Hooks
```typescript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run unit tests
npm run test:unit

# Run security audit
npm audit --audit-level moderate

# Check test coverage
npm run test:coverage -- --threshold=90
```

### CI/CD Pipeline Gates
```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
        env:
          COVERAGE_THRESHOLD: 90

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level moderate
      - run: npm run security:scan

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
```

## Performance Testing

### Load Testing for Agent Operations
```typescript
describe('Performance Tests', () => {
  it('should handle concurrent exercise submissions', async () => {
    const concurrentUsers = 50;
    const submissions = Array(concurrentUsers).fill(null).map((_, i) => ({
      userId: `user-${i}`,
      exerciseId: 'test-exercise',
      code: validSolution,
      language: 'javascript'
    }));
    
    const startTime = Date.now();
    
    const results = await Promise.all(
      submissions.map(submission => 
        reviewerAgent.evaluateSubmission(submission)
      )
    );
    
    const duration = Date.now() - startTime;
    
    // All submissions should succeed
    expect(results.every(r => r.success)).toBe(true);
    
    // Should complete within reasonable time
    expect(duration).toBeLessThan(10000); // 10 seconds
    
    // Average response time should be acceptable
    const avgResponseTime = duration / concurrentUsers;
    expect(avgResponseTime).toBeLessThan(200); // 200ms average
  });
});
```

### Memory Leak Testing
```typescript
describe('Memory Usage', () => {
  it('should not leak memory during extended operation', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Simulate extended usage
    for (let i = 0; i < 1000; i++) {
      await exerciseGenerator.createExercise(mockContext);
      
      // Force garbage collection every 100 iterations
      if (i % 100 === 0) {
        global.gc?.();
      }
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (< 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Test Data Management

### Test Fixtures
```typescript
export const testFixtures = {
  users: {
    beginner: {
      id: 'beginner-user',
      email: 'beginner@test.com',
      profile: {
        skillLevel: 'beginner',
        goals: ['javascript-basics'],
        timeConstraints: { hoursPerWeek: 3 }
      }
    },
    
    intermediate: {
      id: 'intermediate-user',
      email: 'intermediate@test.com',
      profile: {
        skillLevel: 'intermediate',
        goals: ['react', 'typescript'],
        timeConstraints: { hoursPerWeek: 8 }
      }
    }
  },
  
  exercises: {
    variables: {
      id: 'variables-exercise',
      title: 'Variable Declaration',
      difficultyLevel: 1,
      testCases: [
        { input: '', expected: 'let name = "John";' }
      ]
    }
  }
};
```

### Database Seeding
```typescript
export async function seedTestDatabase(): Promise<void> {
  await db.transaction(async (trx) => {
    // Clear existing data
    await trx('progress_tracking').del();
    await trx('submissions').del();
    await trx('exercises').del();
    await trx('learning_topics').del();
    await trx('curricula').del();
    await trx('learning_profiles').del();
    await trx('users').del();
    
    // Insert test data
    await trx('users').insert(testFixtures.users);
    await trx('learning_profiles').insert(testFixtures.profiles);
    await trx('exercises').insert(testFixtures.exercises);
  });
}
```