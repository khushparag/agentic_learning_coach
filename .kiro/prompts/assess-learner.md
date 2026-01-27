---
description: Assess a learner's skill level through diagnostic questions
---

Assess a developer's current skill level to create an appropriate learning path.

## Assessment Goals

1. Determine current proficiency level (beginner/intermediate/advanced/expert)
2. Identify knowledge gaps
3. Understand learning preferences
4. Establish baseline for progress tracking

## Assessment Process

### Phase 1: Background Questions
Quick questions to understand context:
- Programming experience (years)
- Languages/frameworks used
- Current role/goals
- Available study time

### Phase 2: Diagnostic Questions
Domain-specific questions with progressive difficulty:

#### Question Structure
```json
{
  "id": "string",
  "domain": "javascript | python | react | etc",
  "difficulty": 1-10,
  "question": "string",
  "type": "multiple_choice | code_completion | explain_output",
  "options": ["string"] | null,
  "correct_answer": "string",
  "explanation": "string",
  "skill_indicators": ["string"]
}
```

#### Difficulty Progression
- Start at difficulty 3 (basic intermediate)
- Correct answer → increase difficulty by 1-2
- Incorrect answer → decrease difficulty by 1
- Stop after 5-7 questions or clear level determination

### Phase 3: Skill Level Determination

#### Scoring Algorithm
```
Score = Σ(correct_answers × difficulty_weight) / max_possible_score

Level Mapping:
- 0-25%: Beginner
- 26-50%: Intermediate  
- 51-75%: Advanced
- 76-100%: Expert
```

## Output Format

```json
{
  "assessment_result": {
    "skill_level": "beginner | intermediate | advanced | expert",
    "confidence": 0.0-1.0,
    "domain_scores": {
      "domain_name": {
        "level": "string",
        "score": number,
        "strengths": ["string"],
        "gaps": ["string"]
      }
    },
    "questions_answered": number,
    "accuracy_rate": number,
    "recommended_starting_point": "string",
    "suggested_focus_areas": ["string"]
  }
}
```

## Sample Diagnostic Questions

### JavaScript - Beginner (Difficulty 1-3)
```json
{
  "id": "js-1",
  "domain": "javascript",
  "difficulty": 2,
  "question": "What will console.log(typeof []) output?",
  "type": "multiple_choice",
  "options": ["array", "object", "undefined", "null"],
  "correct_answer": "object",
  "explanation": "In JavaScript, arrays are objects. typeof [] returns 'object'.",
  "skill_indicators": ["type_system", "fundamentals"]
}
```

### JavaScript - Intermediate (Difficulty 4-6)
```json
{
  "id": "js-4",
  "domain": "javascript",
  "difficulty": 5,
  "question": "What is the output?\nconst arr = [1, 2, 3];\nconst [a, ...rest] = arr;\nconsole.log(rest);",
  "type": "explain_output",
  "correct_answer": "[2, 3]",
  "explanation": "Destructuring with rest operator collects remaining elements into an array.",
  "skill_indicators": ["destructuring", "es6", "spread_rest"]
}
```

### JavaScript - Advanced (Difficulty 7-9)
```json
{
  "id": "js-7",
  "domain": "javascript",
  "difficulty": 8,
  "question": "Explain the difference between microtasks and macrotasks in the JavaScript event loop.",
  "type": "explain_concept",
  "correct_answer": "Microtasks (Promise callbacks, queueMicrotask) execute before macrotasks (setTimeout, setInterval). After each macrotask, all microtasks are processed before the next macrotask.",
  "skill_indicators": ["event_loop", "async", "advanced_concepts"]
}
```

## Assessment Guidelines

### Best Practices
- Keep questions concise and clear
- Avoid trick questions
- Test practical knowledge over trivia
- Include code-based questions
- Respect learner's time (5-10 minutes max)

### Adaptation Rules
- If learner struggles with difficulty 3, drop to 1-2
- If learner aces difficulty 5+, jump to 7-8
- Mix question types for comprehensive assessment
- Include at least one code output question

### Privacy Considerations
- Don't store raw answers long-term
- Hash user IDs in logs
- Only retain aggregated skill data
