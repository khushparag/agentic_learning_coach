---
description: Generate comprehensive coding exercises with AI-powered content and adaptive difficulty
---

# Exercise Generation Prompt

Generate high-quality coding exercises for the Agentic Learning Coach system with AI-powered content generation, adaptive difficulty, and comprehensive learning support.

## Context
You are creating exercises for a personalized learning system that adapts to individual learner needs. Exercises should be:
- **Pedagogically sound**: Based on learning science principles
- **Industry-relevant**: Reflect real-world programming scenarios
- **Progressively challenging**: Build upon previous concepts
- **Engaging**: Include interesting contexts and problems

## Input Requirements

### Required Parameters
- **topic**: Programming concept to practice (e.g., "JavaScript closures", "Python list comprehensions", "React hooks")
- **difficulty_level**: 1-10 scale (1=absolute beginner, 10=expert level)
- **skill_level**: beginner | intermediate | advanced | expert
- **language**: Programming language (javascript, python, typescript, java, go)
- **learning_objective**: Specific skill to develop
- **time_limit**: Estimated completion time in minutes (5-60)

### Optional Parameters
- **previous_exercises**: Array of recently completed exercises (for progression)
- **learner_struggles**: Areas where learner has shown difficulty
- **preferred_context**: Domain context (web dev, data science, algorithms, etc.)
- **exercise_type**: code_completion | bug_fix | from_scratch | refactoring | testing

## Exercise Generation Strategy

### Difficulty Scaling Algorithm
```typescript
const difficultyFactors = {
  1-2: { concepts: 1, complexity: "single step", examples: 3 },
  3-4: { concepts: 2, complexity: "multi-step", examples: 2 },
  5-6: { concepts: 3, complexity: "problem solving", examples: 1 },
  7-8: { concepts: 4, complexity: "optimization", examples: 0 },
  9-10: { concepts: 5, complexity: "architectural", examples: 0 }
};
```

### Learning Progression
- **Build on previous exercises**: Reference completed concepts
- **Introduce one new concept**: Avoid cognitive overload
- **Provide scaffolding**: Gradual complexity increase
- **Include real-world context**: Industry-relevant scenarios

## Exercise Structure

### 1. Title & Metadata
```json
{
  "title": "Descriptive title indicating concept and context",
  "topic": "Primary programming concept",
  "subtopics": ["supporting", "concepts"],
  "difficulty_level": 1-10,
  "estimated_time": "5-60 minutes",
  "prerequisites": ["concept1", "concept2"],
  "learning_objectives": ["specific", "measurable", "outcomes"]
}
```

### 2. Contextual Description
- **Hook**: Engaging real-world scenario (1-2 sentences)
- **Concept explanation**: Clear, concise explanation (2-3 sentences)
- **Learning goal**: What the learner will achieve
- **Industry relevance**: Why this matters in professional development

### 3. Detailed Instructions
```json
{
  "objective": "Clear, specific goal statement",
  "requirements": [
    "Functional requirement 1",
    "Functional requirement 2",
    "Quality requirement (performance, style, etc.)"
  ],
  "constraints": [
    "Technical constraints",
    "Time/resource limitations",
    "Specific approaches to use/avoid"
  ],
  "success_criteria": [
    "All tests pass",
    "Code follows best practices",
    "Performance meets requirements"
  ]
}
```

### 4. Progressive Starter Code
```typescript
// Difficulty 1-3: Substantial scaffolding
function exerciseFunction(param1, param2) {
  // TODO: Implement basic functionality here
  // Hint: Use the provided helper function below
  return null;
}

// Difficulty 4-6: Moderate scaffolding
function exerciseFunction(param1, param2) {
  // TODO: Implement the solution
  // Consider edge cases and error handling
}

// Difficulty 7-10: Minimal scaffolding
// TODO: Implement the complete solution
// Requirements: [list requirements]
```

### 5. Comprehensive Test Cases
```json
{
  "test_cases": [
    {
      "name": "Basic functionality",
      "input": "simple valid input",
      "expected_output": "expected result",
      "description": "Tests core functionality",
      "weight": 40
    },
    {
      "name": "Edge case handling",
      "input": "boundary condition",
      "expected_output": "expected result",
      "description": "Tests boundary conditions",
      "weight": 30
    },
    {
      "name": "Error handling",
      "input": "invalid input",
      "expected_output": "error or default behavior",
      "description": "Tests error scenarios",
      "weight": 20
    },
    {
      "name": "Performance/optimization",
      "input": "large dataset",
      "expected_output": "efficient result",
      "description": "Tests performance requirements",
      "weight": 10
    }
  ]
}
```

### 6. Adaptive Hints System
```json
{
  "hints": [
    {
      "trigger": "first_failure",
      "type": "conceptual",
      "content": "Think about the core concept. What is the main operation you need to perform?"
    },
    {
      "trigger": "second_failure",
      "type": "structural",
      "content": "Consider breaking this into steps: 1) validate input, 2) process data, 3) return result"
    },
    {
      "trigger": "third_failure",
      "type": "implementation",
      "content": "Try using [specific method/approach]. Here's the pattern: [code snippet]"
    },
    {
      "trigger": "time_limit_approaching",
      "type": "time_management",
      "content": "Focus on getting the basic functionality working first, then optimize"
    }
  ]
}
```

### 7. Exemplary Solution
```typescript
/**
 * Complete solution with comprehensive comments
 * Demonstrates best practices and explains reasoning
 */
function exemplarySolution(param1, param2) {
  // Input validation - always validate user input
  if (!param1 || typeof param1 !== 'expected_type') {
    throw new Error('Invalid input: param1 must be...');
  }
  
  // Core algorithm implementation
  // Explanation of approach and why it's chosen
  const result = processData(param1, param2);
  
  // Error handling and edge cases
  if (result === null) {
    return defaultValue;
  }
  
  // Return with proper type and format
  return result;
}

// Helper functions if needed
function processData(data1, data2) {
  // Implementation details with comments
}
```

## AI-Powered Content Generation

### LLM Integration
```typescript
// Use LLM for dynamic content generation
const exercisePrompt = `
Generate a ${difficulty_level}/10 difficulty ${language} exercise on ${topic}.
Context: ${learner_context}
Previous exercises: ${previous_exercises}
Learning objective: ${learning_objective}

Requirements:
- Industry-relevant scenario
- Progressive difficulty
- Comprehensive test coverage
- Clear learning outcomes
`;

// Fallback to templates if LLM unavailable
const fallbackExercise = exerciseTemplates[topic][difficulty_level];
```

### Content Adaptation
- **Personalization**: Adapt to learner's interests and background
- **Contextualization**: Use relevant industry examples
- **Localization**: Adjust examples for cultural context
- **Accessibility**: Ensure content is inclusive and accessible

## Quality Assurance

### Automated Validation
```typescript
interface ExerciseQuality {
  difficulty_appropriate: boolean;
  instructions_clear: boolean;
  test_coverage_complete: boolean;
  solution_optimal: boolean;
  learning_objective_met: boolean;
  industry_relevant: boolean;
}

const validateExercise = (exercise: Exercise): ExerciseQuality => {
  return {
    difficulty_appropriate: validateDifficulty(exercise),
    instructions_clear: validateInstructions(exercise),
    test_coverage_complete: validateTestCoverage(exercise),
    solution_optimal: validateSolution(exercise),
    learning_objective_met: validateLearningObjective(exercise),
    industry_relevant: validateIndustryRelevance(exercise)
  };
};
```

### Quality Criteria Checklist
- [ ] **Difficulty Alignment**: Exercise matches specified difficulty level
- [ ] **Clear Instructions**: Unambiguous requirements and success criteria
- [ ] **Comprehensive Testing**: Edge cases and error scenarios covered
- [ ] **Progressive Hints**: Hints provide guidance without revealing solution
- [ ] **Optimal Solution**: Demonstrates best practices and efficiency
- [ ] **Learning Objectives**: Clearly achieves stated learning goals
- [ ] **Industry Relevance**: Reflects real-world programming scenarios
- [ ] **Accessibility**: Inclusive language and clear explanations
- [ ] **Time Appropriate**: Realistic completion time estimate
- [ ] **Prerequisite Alignment**: Builds appropriately on previous knowledge

## Output Format

### Complete Exercise JSON Schema
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "type": "CODE" | "QUIZ" | "PROJECT" | "REVIEW",
  "difficulty_level": 1-10,
  "language": "javascript" | "python" | "typescript" | "java" | "go",
  "topic": "string",
  "subtopics": ["string"],
  "learning_objectives": ["string"],
  "prerequisites": ["string"],
  "estimated_time_minutes": 5-60,
  "instructions": {
    "objective": "string",
    "requirements": ["string"],
    "constraints": ["string"],
    "success_criteria": ["string"]
  },
  "starter_code": "string",
  "test_cases": [
    {
      "name": "string",
      "input": "string",
      "expected_output": "string",
      "description": "string",
      "weight": 0-100,
      "hidden": boolean
    }
  ],
  "hints": [
    {
      "trigger": "string",
      "type": "string",
      "content": "string"
    }
  ],
  "solution": {
    "code": "string",
    "explanation": "string",
    "time_complexity": "string",
    "space_complexity": "string",
    "best_practices": ["string"]
  },
  "metadata": {
    "created_by": "ai" | "template" | "human",
    "industry_context": "string",
    "real_world_application": "string",
    "common_mistakes": ["string"],
    "extension_ideas": ["string"]
  }
}
```

## Example Usage

### Basic Exercise Generation
```bash
kiro generate-exercise \
  --topic "JavaScript closures" \
  --difficulty_level 4 \
  --skill_level intermediate \
  --language javascript \
  --time_limit 20
```

### Advanced Exercise with Context
```bash
kiro generate-exercise \
  --topic "React hooks optimization" \
  --difficulty_level 7 \
  --skill_level advanced \
  --language typescript \
  --time_limit 45 \
  --previous_exercises "useState,useEffect,useCallback" \
  --learner_struggles "performance optimization" \
  --preferred_context "web development" \
  --exercise_type "refactoring"
```

### Adaptive Exercise Generation
```bash
kiro generate-exercise \
  --topic "Python data structures" \
  --difficulty_level 3 \
  --skill_level beginner \
  --language python \
  --adaptive true \
  --learner_profile "visual learner, prefers examples" \
  --industry_context "data science"
```

This enhanced exercise generation prompt provides comprehensive, AI-powered exercise creation with adaptive difficulty, quality assurance, and industry relevance for optimal learning outcomes.
