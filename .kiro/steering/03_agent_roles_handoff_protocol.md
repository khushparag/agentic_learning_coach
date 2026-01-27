# Agent Roles & Handoff Protocol

## Agent Responsibilities

### Orchestrator Agent
**MUST** serve as the single entry point and coordinator:
- Route user intents to appropriate agents
- Manage conversation state and context
- Coordinate multi-agent workflows
- Handle error recovery and fallbacks
- **NEVER** contain business logic

### ProfileAgent
**MUST** manage learner modeling and preferences:
- Assess current skill level through diagnostic questions
- Track learning preferences and constraints
- Maintain learner goals and motivations
- Update profile based on performance data
- **ALWAYS** start by clarifying learner's goal, time constraints, and current level

### CurriculumPlannerAgent
**MUST** design adaptive learning paths:
- Create personalized curriculum based on profile
- Sequence learning objectives logically
- Adapt difficulty based on progress
- Balance theory and practice (prefer practice-first)
- **ALWAYS** include practice exercises for each concept

### ResourcesAgent
**MUST** curate and retrieve learning materials:
- Search and filter relevant documentation/tutorials
- Use Qdrant for semantic resource matching
- Verify resource quality and relevance
- **ONLY** use tools/MCP when information must be verified
- **NEVER** fabricate or assume resource content

### ExerciseGeneratorAgent
**MUST** create targeted practice opportunities:
- Generate coding exercises based on learning objectives
- Adapt difficulty to learner level
- Create realistic, industry-relevant scenarios
- Include clear success criteria
- **ALWAYS** provide guided exercises after explanations

### ReviewerAgent
**MUST** evaluate submissions and provide feedback:
- Analyze code submissions for correctness
- Use code-runner service for test execution
- Generate specific, actionable feedback
- Include "why" and "how to fix" in feedback
- **NEVER** fabricate test results—only report runner outputs

### ProgressTracker
**MUST** monitor and adapt learning effectiveness:
- Track completion rates and performance metrics
- Identify learning patterns and blockers
- Trigger curriculum adaptations
- Generate progress reports
- **ALWAYS** implement adaptation policy: 2 failures → reduce difficulty + recap; quick pass → add stretch task

## Handoff Protocol

### Standard Message Format
```typescript
interface AgentHandoff {
  correlationId: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  intent: HandoffIntent;
  context: LearningContext;
  payload: unknown;
  priority: 'low' | 'normal' | 'high';
  timeout?: number;
}
```

### Critical Handoff Rules

#### MUST Confirm Before Destructive Actions
```typescript
// ✅ Good: Confirm before overwriting
const confirmation = await orchestrator.requestConfirmation({
  action: 'overwrite_learning_plan',
  impact: 'This will replace your current 5-week plan',
  data: newPlan
});

// ❌ Bad: Direct overwrite
await curriculumPlanner.replacePlan(newPlan);
```

#### MUST Preserve Context Across Handoffs
```typescript
interface LearningContext {
  userId: string;
  sessionId: string;
  currentObjective: string;
  attemptCount: number;
  lastFeedback?: Feedback;
  preferences: LearnerPreferences;
}
```

#### MUST Handle Agent Failures Gracefully
```typescript
const result = await agentCommunicator.send(message, { timeout: 5000 });
if (!result.success) {
  // Fallback to simpler approach
  return await fallbackHandler.handle(message.intent);
}
```

## Teaching-Style Rules

### MUST Follow Practice-First Approach
1. **Short explanation** (2-3 sentences max)
2. **Guided exercise** with clear instructions
3. **Review feedback** with specific improvements
4. **Next step** based on performance

### MUST Adapt Based on Performance
- **Two failures**: Reduce difficulty, add recap task
- **Quick success**: Add stretch task or advanced concept
- **Confusion**: Provide additional examples or analogies

### MUST Provide Actionable Feedback
```typescript
// ✅ Good feedback
{
  correct: false,
  issues: [
    {
      line: 15,
      problem: "Missing null check",
      why: "The user input could be null, causing a runtime error",
      howToFix: "Add `if (input === null) return;` before processing"
    }
  ],
  nextSteps: ["Practice defensive programming patterns"]
}

// ❌ Bad feedback
{
  correct: false,
  message: "Your code has issues"
}
```