# Architecture & Clean Boundaries

## System Architecture

### Multi-Agent Design Pattern
**MUST** implement a clean separation between agents with well-defined interfaces:

```
Orchestrator Agent (Entry Point)
├── ProfileAgent (User modeling & preferences)
├── CurriculumPlannerAgent (Learning path design)
├── ResourcesAgent (Content retrieval & curation)
├── ExerciseGeneratorAgent (Practice creation)
├── ReviewerAgent (Code evaluation & feedback)
└── ProgressTracker (Analytics & adaptation)
```

### Data Layer Boundaries
**MUST** maintain strict separation between:
- **Postgres**: System of record for all transactional data (users, plans, tasks, submissions, evaluations)
- **Qdrant**: ONLY for semantic resource retrieval via embeddings
- **Never** store transactional state in vector database

### Agent Communication Protocol
**MUST** use structured message passing:
```typescript
interface AgentMessage {
  from: AgentType;
  to: AgentType;
  intent: string;
  payload: unknown;
  correlationId: string;
  timestamp: Date;
}
```

## Boundary Rules

### DO: Clean Interfaces
- Define explicit contracts between agents
- Use dependency injection for agent communication
- Implement circuit breakers for agent failures
- Log all inter-agent communications

### DON'T: Tight Coupling
- Direct database access from agents (use repositories)
- Shared mutable state between agents
- Synchronous blocking calls between agents
- Business logic in the orchestrator

## Example: Proper Agent Handoff
```typescript
// ✅ Good: Clean handoff with explicit contract
const learningPlan = await curriculumPlanner.createPlan({
  userId,
  goals: userProfile.goals,
  currentLevel: userProfile.skillLevel,
  timeConstraints: userProfile.availability
});

// ❌ Bad: Direct coupling
const plan = curriculumPlanner.directAccessToUserData(userId);
```