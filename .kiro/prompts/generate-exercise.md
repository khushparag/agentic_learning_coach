---
description: Generate a coding exercise for the learning coach system
---

Generate a coding exercise for the Agentic Learning Coach system.

## Input Requirements

Provide the following information:
- **Topic**: The programming concept to practice (e.g., "JavaScript closures", "Python list comprehensions")
- **Difficulty Level**: 1-10 scale (1=beginner, 10=expert)
- **Skill Level**: beginner | intermediate | advanced | expert
- **Time Limit**: Estimated completion time in minutes

## Exercise Structure

Generate an exercise with:

### 1. Title
Clear, descriptive title indicating the concept being practiced.

### 2. Description
- Brief explanation of the concept (2-3 sentences)
- What the learner will practice
- Real-world application context

### 3. Instructions
Step-by-step instructions for completing the exercise:
1. Clear objective statement
2. Specific requirements
3. Expected output format
4. Any constraints or rules

### 4. Starter Code
```{language}
// Provide starter code template
// Include comments guiding the learner
// Mark areas where code should be written with TODO comments
```

### 5. Test Cases
```{language}
// Test case 1: Basic functionality
// Test case 2: Edge case handling
// Test case 3: Error handling (if applicable)
```

### 6. Hints
Provide 2-3 progressive hints:
- **Hint 1**: General direction (shown after 1 failed attempt)
- **Hint 2**: More specific guidance (shown after 2 failed attempts)
- **Hint 3**: Near-solution hint (shown after 3 failed attempts)

### 7. Solution
```{language}
// Complete solution with comments explaining key concepts
```

## Quality Criteria

- [ ] Exercise is appropriate for the specified difficulty level
- [ ] Instructions are clear and unambiguous
- [ ] Test cases cover main functionality and edge cases
- [ ] Hints provide progressive assistance without giving away the solution
- [ ] Solution demonstrates best practices

## Output Format

Return the exercise as a JSON object matching the Exercise domain entity:

```json
{
  "title": "string",
  "description": "string",
  "type": "CODE",
  "difficulty_level": number,
  "instructions": {
    "objective": "string",
    "requirements": ["string"],
    "constraints": ["string"]
  },
  "starter_code": "string",
  "test_cases": [
    {
      "input": "string",
      "expected_output": "string",
      "description": "string"
    }
  ],
  "hints": ["string"],
  "solution": "string",
  "time_limit_minutes": number
}
```
