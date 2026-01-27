# Workflows & Intent Routing

## Intent Classification

### Learning Intents
**MUST** route to appropriate agents based on user intent:

```typescript
enum LearningIntent {
  // Profile Management
  ASSESS_SKILL_LEVEL = 'assess_skill_level',
  UPDATE_GOALS = 'update_goals',
  SET_CONSTRAINTS = 'set_constraints',
  
  // Curriculum Planning
  CREATE_LEARNING_PATH = 'create_learning_path',
  ADAPT_DIFFICULTY = 'adapt_difficulty',
  REQUEST_NEXT_TOPIC = 'request_next_topic',
  
  // Practice & Exercises
  REQUEST_EXERCISE = 'request_exercise',
  SUBMIT_SOLUTION = 'submit_solution',
  REQUEST_HINT = 'request_hint',
  
  // Resources & Help
  FIND_DOCUMENTATION = 'find_documentation',
  EXPLAIN_CONCEPT = 'explain_concept',
  GET_EXAMPLES = 'get_examples',
  
  // Progress & Review
  CHECK_PROGRESS = 'check_progress',
  REVIEW_MISTAKES = 'review_mistakes',
  GET_RECOMMENDATIONS = 'get_recommendations'
}
```

### Intent Routing Rules
```typescript
const INTENT_ROUTING: Record<LearningIntent, AgentType> = {
  // Profile intents → ProfileAgent
  [LearningIntent.ASSESS_SKILL_LEVEL]: AgentType.PROFILE,
  [LearningIntent.UPDATE_GOALS]: AgentType.PROFILE,
  [LearningIntent.SET_CONSTRAINTS]: AgentType.PROFILE,
  
  // Curriculum intents → CurriculumPlannerAgent
  [LearningIntent.CREATE_LEARNING_PATH]: AgentType.CURRICULUM_PLANNER,
  [LearningIntent.ADAPT_DIFFICULTY]: AgentType.CURRICULUM_PLANNER,
  [LearningIntent.REQUEST_NEXT_TOPIC]: AgentType.CURRICULUM_PLANNER,
  
  // Exercise intents → ExerciseGeneratorAgent or ReviewerAgent
  [LearningIntent.REQUEST_EXERCISE]: AgentType.EXERCISE_GENERATOR,
  [LearningIntent.SUBMIT_SOLUTION]: AgentType.REVIEWER,
  [LearningIntent.REQUEST_HINT]: AgentType.EXERCISE_GENERATOR,
  
  // Resource intents → ResourcesAgent
  [LearningIntent.FIND_DOCUMENTATION]: AgentType.RESOURCES,
  [LearningIntent.EXPLAIN_CONCEPT]: AgentType.RESOURCES,
  [LearningIntent.GET_EXAMPLES]: AgentType.RESOURCES,
  
  // Progress intents → ProgressTracker
  [LearningIntent.CHECK_PROGRESS]: AgentType.PROGRESS_TRACKER,
  [LearningIntent.REVIEW_MISTAKES]: AgentType.PROGRESS_TRACKER,
  [LearningIntent.GET_RECOMMENDATIONS]: AgentType.PROGRESS_TRACKER
};
```

## Standard Workflows

### New Learner Onboarding
**MUST** follow this sequence:
1. **ProfileAgent**: Assess current level with diagnostic questions
2. **ProfileAgent**: Clarify goals and time constraints
3. **CurriculumPlannerAgent**: Create initial learning path
4. **ExerciseGeneratorAgent**: Generate first practice exercise
5. **ProgressTracker**: Initialize tracking metrics

```typescript
async function onboardNewLearner(userId: string): Promise<OnboardingResult> {
  // Step 1: Profile assessment
  const profile = await profileAgent.assessSkillLevel(userId);
  
  // Step 2: Goal clarification
  const goals = await profileAgent.clarifyGoals(userId);
  
  // Step 3: Create learning path
  const curriculum = await curriculumPlanner.createPath({
    profile,
    goals,
    constraints: profile.timeConstraints
  });
  
  // Step 4: First exercise
  const firstExercise = await exerciseGenerator.createIntroExercise(curriculum.firstTopic);
  
  // Step 5: Initialize tracking
  await progressTracker.initialize(userId, curriculum);
  
  return { profile, curriculum, firstExercise };
}
```

### Exercise Submission Workflow
**MUST** handle submissions with adaptive feedback:
1. **ReviewerAgent**: Evaluate submission using code-runner
2. **ProgressTracker**: Update performance metrics
3. **CurriculumPlannerAgent**: Adapt difficulty if needed
4. **ExerciseGeneratorAgent**: Generate next exercise or remediation

```typescript
async function handleSubmission(submission: CodeSubmission): Promise<SubmissionResult> {
  // Step 1: Evaluate submission
  const evaluation = await reviewerAgent.evaluate(submission);
  
  // Step 2: Update progress
  const progress = await progressTracker.recordAttempt(submission.userId, evaluation);
  
  // Step 3: Check for adaptation triggers
  if (progress.consecutiveFailures >= 2) {
    await curriculumPlanner.reduceDifficulty(submission.userId);
    const recap = await exerciseGenerator.createRecapExercise(submission.topicId);
    return { evaluation, nextAction: 'recap', exercise: recap };
  }
  
  if (progress.quickSuccess) {
    const stretch = await exerciseGenerator.createStretchExercise(submission.topicId);
    return { evaluation, nextAction: 'stretch', exercise: stretch };
  }
  
  // Step 4: Generate next exercise
  const nextExercise = await exerciseGenerator.createNextExercise(submission.userId);
  return { evaluation, nextAction: 'continue', exercise: nextExercise };
}
```

### Resource Discovery Workflow
**MUST** verify information before presenting:
1. **ResourcesAgent**: Search semantic database (Qdrant)
2. **ResourcesAgent**: Use MCP tools to verify current information
3. **ResourcesAgent**: Filter and rank by relevance
4. **ResourcesAgent**: Present with source attribution

```typescript
async function findResources(query: string, context: LearningContext): Promise<ResourceResult> {
  // Step 1: Semantic search
  const candidates = await qdrantClient.search({
    collection: 'learning_resources',
    vector: await embedQuery(query),
    limit: 10
  });
  
  // Step 2: Verify with MCP tools when needed
  const verified = await Promise.all(
    candidates.map(async (resource) => {
      if (resource.requiresVerification) {
        return await mcpTools.verifyResource(resource.url);
      }
      return resource;
    })
  );
  
  // Step 3: Filter and rank
  const relevant = verified
    .filter(r => r.relevanceScore > 0.7)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return { resources: relevant, searchQuery: query };
}
```

## Error Recovery Workflows

### Agent Timeout Recovery
```typescript
async function handleAgentTimeout(message: AgentMessage): Promise<AgentResponse> {
  logger.warn('Agent timeout', { agent: message.toAgent, correlationId: message.correlationId });
  
  // Try fallback agent or simplified approach
  switch (message.toAgent) {
    case AgentType.EXERCISE_GENERATOR:
      return await fallbackExerciseGenerator.createSimpleExercise(message.payload);
    case AgentType.REVIEWER:
      return await staticCodeAnalyzer.basicReview(message.payload);
    default:
      return { success: false, error: 'Service temporarily unavailable' };
  }
}
```

### Context Recovery
```typescript
async function recoverLearningContext(userId: string, sessionId: string): Promise<LearningContext> {
  // Reconstruct context from persistent storage
  const profile = await profileRepository.findByUserId(userId);
  const progress = await progressRepository.getLatest(userId);
  const currentPlan = await curriculumRepository.getActive(userId);
  
  return {
    userId,
    sessionId,
    currentObjective: currentPlan?.currentTopic || 'assessment',
    attemptCount: progress?.attemptCount || 0,
    lastFeedback: progress?.lastFeedback,
    preferences: profile?.preferences || defaultPreferences
  };
}
```