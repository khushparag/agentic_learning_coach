# Coding Standards & SOLID Principles

## TypeScript Standards

### MUST Follow
- **Strict TypeScript**: `"strict": true` with no `any` types
- **Explicit return types** for all public methods
- **Interface segregation**: Small, focused interfaces
- **Immutable data structures** where possible

### Naming Conventions
```typescript
// ✅ Good
class CurriculumPlannerAgent implements IAgent {}
interface LearningGoal {}
type AgentResponse<T> = { success: boolean; data: T };
const calculateDifficulty = (level: number) => {};

// ❌ Bad
class agent {}
interface data {}
const calc = (x: any) => {};
```

## SOLID Principles Implementation

### Single Responsibility Principle
**MUST** ensure each class has one reason to change:
```typescript
// ✅ Good: Single responsibility
class ExerciseValidator {
  validate(exercise: Exercise): ValidationResult {}
}

class ExercisePersistence {
  save(exercise: Exercise): Promise<void> {}
}

// ❌ Bad: Multiple responsibilities
class ExerciseManager {
  validate(exercise: Exercise): ValidationResult {}
  save(exercise: Exercise): Promise<void> {}
  generateHints(exercise: Exercise): string[] {}
}
```

### Open/Closed Principle
**MUST** use strategy pattern for extensible behavior:
```typescript
interface FeedbackStrategy {
  generateFeedback(submission: CodeSubmission): Feedback;
}

class BeginnerFeedbackStrategy implements FeedbackStrategy {}
class AdvancedFeedbackStrategy implements FeedbackStrategy {}
```

### Liskov Substitution Principle
**MUST** ensure derived classes are substitutable:
```typescript
abstract class BaseAgent {
  abstract process(input: AgentInput): Promise<AgentOutput>;
}

class ProfileAgent extends BaseAgent {
  // Must honor base contract
  async process(input: AgentInput): Promise<AgentOutput> {}
}
```

### Interface Segregation Principle
**MUST** create focused interfaces:
```typescript
// ✅ Good: Segregated interfaces
interface Readable {
  read(): Promise<string>;
}

interface Writable {
  write(data: string): Promise<void>;
}

// ❌ Bad: Fat interface
interface FileHandler {
  read(): Promise<string>;
  write(data: string): Promise<void>;
  compress(): Promise<void>;
  encrypt(): Promise<void>;
}
```

### Dependency Inversion Principle
**MUST** depend on abstractions:
```typescript
// ✅ Good: Depends on abstraction
class ReviewerAgent {
  constructor(
    private codeRunner: ICodeRunner,
    private feedbackGenerator: IFeedbackGenerator
  ) {}
}

// ❌ Bad: Depends on concrete implementation
class ReviewerAgent {
  constructor() {
    this.codeRunner = new DockerCodeRunner();
  }
}
```

## Error Handling Standards

### MUST Use Result Pattern
```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage
const result = await exerciseGenerator.create(prompt);
if (!result.success) {
  logger.error('Exercise generation failed', result.error);
  return;
}
```

### Custom Error Classes
```typescript
class LearningCoachError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LearningCoachError';
  }
}
```