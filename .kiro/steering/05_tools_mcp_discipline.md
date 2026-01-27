# Tools & MCP Discipline

## MCP Usage Rules

### MUST Use MCP Tools When
- **Information verification required**: Documentation, API references, current versions
- **Code execution needed**: Running tests, validating solutions
- **External resource access**: Fetching tutorials, examples, or documentation
- **Real-time data required**: Latest library versions, breaking changes

### MUST NOT Use MCP Tools When
- **Information is static**: Basic programming concepts, established patterns
- **Internal system data**: User profiles, progress, stored exercises
- **Fabricated content acceptable**: Example code snippets, practice exercises

## Code Runner Service Integration

### MUST Use for All Code Evaluation
```typescript
interface CodeRunnerRequest {
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'go';
  code: string;
  tests: string[];
  timeout: number; // milliseconds
  memoryLimit: number; // MB
}

interface CodeRunnerResponse {
  success: boolean;
  output: string;
  errors: string[];
  testResults: TestResult[];
  executionTime: number;
  memoryUsed: number;
}
```

### NEVER Fabricate Test Results
```typescript
// ✅ Good: Use actual runner results
const runResult = await codeRunnerMCP.execute({
  code: submission.code,
  tests: exercise.tests,
  language: submission.language,
  timeout: 5000
});

const feedback = generateFeedback(runResult);

// ❌ Bad: Fabricated results
const feedback = {
  passed: true, // This is made up!
  message: "Looks good to me"
};
```

## Documentation & Resource MCP

### MUST Verify Before Presenting
```typescript
// ✅ Good: Verify current documentation
const docResult = await documentationMCP.fetchLatest({
  library: 'react',
  topic: 'hooks',
  version: 'latest'
});

if (docResult.success) {
  return formatLearningResource(docResult.content);
}

// ❌ Bad: Assume documentation content
return "React hooks work like this..."; // Potentially outdated
```

### Resource Attribution Requirements
```typescript
interface LearningResource {
  content: string;
  source: {
    url: string;
    title: string;
    lastUpdated: Date;
    verified: boolean;
  };
  relevanceScore: number;
}
```

## Code Analysis MCP (Optional)

### Use for Advanced Code Review
```typescript
interface CodeAnalysisRequest {
  code: string;
  language: string;
  analysisType: 'security' | 'performance' | 'style' | 'complexity';
  rules?: string[];
}

// Only use when basic review isn't sufficient
const analysis = await codeAnalysisMCP.analyze({
  code: submission.code,
  language: submission.language,
  analysisType: 'security'
});
```

## Tool Discipline Rules

### Confirmation Protocol
**MUST** confirm before destructive actions:
```typescript
// Actions requiring confirmation
const DESTRUCTIVE_ACTIONS = [
  'overwrite_learning_plan',
  'delete_progress',
  'reset_profile',
  'clear_submissions'
];

async function executeWithConfirmation(action: string, data: unknown): Promise<Result> {
  if (DESTRUCTIVE_ACTIONS.includes(action)) {
    const confirmed = await requestUserConfirmation({
      action,
      impact: getActionImpact(action),
      data: sanitizeForDisplay(data)
    });
    
    if (!confirmed) {
      return { success: false, error: 'Action cancelled by user' };
    }
  }
  
  return await executeAction(action, data);
}
```

### Error Handling for MCP Calls
```typescript
async function safeMCPCall<T>(
  mcpFunction: () => Promise<T>,
  fallback: () => T,
  context: string
): Promise<T> {
  try {
    const result = await Promise.race([
      mcpFunction(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('MCP timeout')), 10000)
      )
    ]);
    return result;
  } catch (error) {
    logger.warn('MCP call failed, using fallback', { context, error });
    return fallback();
  }
}

// Usage
const docContent = await safeMCPCall(
  () => documentationMCP.fetch(url),
  () => getCachedDocumentation(url),
  'fetch_react_docs'
);
```

### Rate Limiting & Caching
```typescript
class MCPRateLimiter {
  private calls = new Map<string, number[]>();
  private readonly maxCallsPerMinute = 60;
  
  async throttle(mcpName: string): Promise<void> {
    const now = Date.now();
    const calls = this.calls.get(mcpName) || [];
    
    // Remove calls older than 1 minute
    const recentCalls = calls.filter(time => now - time < 60000);
    
    if (recentCalls.length >= this.maxCallsPerMinute) {
      const waitTime = 60000 - (now - recentCalls[0]);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    recentCalls.push(now);
    this.calls.set(mcpName, recentCalls);
  }
}
```

## Tool Selection Guidelines

### Documentation Retrieval
```typescript
// Priority order for documentation
async function getDocumentation(topic: string): Promise<string> {
  // 1. Try official docs via MCP
  try {
    return await officialDocsMCP.fetch(topic);
  } catch (error) {
    // 2. Try cached/indexed docs
    const cached = await getCachedDocs(topic);
    if (cached) return cached;
    
    // 3. Use curated internal resources
    return getInternalDocumentation(topic);
  }
}
```

### Code Execution Priority
```typescript
// Always prefer secure code runner
async function executeCode(code: string, language: string): Promise<ExecutionResult> {
  // 1. Use sandboxed code runner MCP
  try {
    return await codeRunnerMCP.execute({ code, language });
  } catch (error) {
    // 2. Use static analysis as fallback
    return await staticAnalyzer.analyze(code, language);
  }
  // Never execute code directly on system
}
```